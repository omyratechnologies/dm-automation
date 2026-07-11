import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import OpenAI from "openai";
import { Prisma } from "@prisma/client";
import { MESSAGING_WINDOW_MS, QUEUES } from "@repo/shared";
import type {
  ConditionNode,
  FlowDefinition,
  FlowNode,
  FlowRunJob,
  SendMessageJob,
} from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { matchText } from "./trigger-matcher";
import type { TriggerEvent } from "./trigger-matcher";

/** Hard cap on nodes handled in one executor pass — cycle/runaway protection. */
export const MAX_STEPS = 50;

/** Persisted FlowRun.context shape. */
export interface FlowRunContext {
  trigger?: TriggerEvent;
  /** Set after the run's first outbound send (comment private-reply rule). */
  firstSendDone?: boolean;
}

/** Snapshot of the run the executor operates on. */
export interface RunSnapshot {
  id: string;
  workspaceId: string;
  flowId: string;
  contactId: string;
  context: FlowRunContext;
}

/**
 * Business-rule failure: mark the run FAILED and stop — never rethrown to
 * BullMQ (infra errors, e.g. DB down, do propagate for retry).
 */
class FlowExecutionError extends Error {}

interface ContactState {
  id: string;
  igAccountId: string;
  tags: string[];
  lastInboundAt: Date | null;
  isFollow: boolean;
}

@Injectable()
export class FlowExecutor {
  private readonly logger = new Logger(FlowExecutor.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @InjectQueue(QUEUES.SEND_MESSAGES)
    private readonly sendQueue: Queue<SendMessageJob>,
    @InjectQueue(QUEUES.FLOW_RUNS)
    private readonly flowRunsQueue: Queue<FlowRunJob>,
  ) {}

  /**
   * Walk the graph starting from the outgoing "default" edge of
   * `fromNodeId` (the trigger node on a fresh run, the wait node on resume).
   * Terminal states: COMPLETED (edge missing / graph end / handoff),
   * WAITING (wait node), FAILED (business error or step limit).
   */
  async execute(
    run: RunSnapshot,
    definition: FlowDefinition,
    fromNodeId: string,
  ): Promise<void> {
    try {
      await this.walk(run, definition, fromNodeId);
    } catch (err) {
      if (err instanceof FlowExecutionError) {
        await this.fail(run.id, err.message);
        return;
      }
      throw err; // infra error → BullMQ retry
    }
  }

  private async walk(
    run: RunSnapshot,
    definition: FlowDefinition,
    fromNodeId: string,
  ): Promise<void> {
    const nodesById = new Map<string, FlowNode>(
      definition.nodes.map((n) => [n.id, n]),
    );
    const contact = await this.loadContact(run.contactId);

    let steps = 0;
    let node = this.nextNode(definition, nodesById, fromNodeId, "default");

    while (node) {
      if (++steps > MAX_STEPS) {
        throw new FlowExecutionError("step limit exceeded");
      }
      await this.prisma.flowRun.update({
        where: { id: run.id },
        data: { currentNodeId: node.id },
      });

      if (node.type === "trigger") {
        // Triggers are entry points; if one is wired mid-graph, pass through.
        node = this.nextNode(definition, nodesById, node.id, "default");
        continue;
      }

      if (node.type === "condition") {
        const result = this.evaluateCondition(node.data, run.context, contact);
        node = this.nextNode(
          definition,
          nodesById,
          node.id,
          result ? "true" : "false",
        );
        continue;
      }

      // action node
      const data = node.data;
      switch (data.kind) {
        case "send_message":
          await this.enqueueSend(run, contact, {
            text: data.text,
            quickReplies: data.quickReplies.length
              ? data.quickReplies
              : undefined,
            source: "FLOW",
          });
          break;
        case "ai_reply": {
          const text = await this.generateAiReply(
            data.prompt,
            run.context.trigger?.text ?? "",
          );
          await this.enqueueSend(run, contact, { text, source: "AI" });
          break;
        }
        case "lead_qualify": {
          const fields = await this.prisma.leadField.findMany({
            where: { workspaceId: run.workspaceId },
          });
          if (fields.length === 0) {
            const defaults = [
              { key: "email", label: "Email Address", type: "TEXT" as const },
              { key: "phone", label: "Phone Number", type: "TEXT" as const },
              { key: "budget", label: "Estimated Budget", type: "NUMBER" as const },
            ];
            for (const d of defaults) {
              await this.prisma.leadField.upsert({
                where: { workspaceId_key: { workspaceId: run.workspaceId, key: d.key } },
                create: { workspaceId: run.workspaceId, key: d.key, label: d.label, type: d.type },
                update: {},
              });
            }
          }
          const allFields = await this.prisma.leadField.findMany({
            where: { workspaceId: run.workspaceId },
          });

          const conversation = await this.prisma.conversation.findFirst({
            where: { contactId: run.contactId },
            include: {
              messages: {
                orderBy: { createdAt: "desc" },
                take: 10,
              },
            },
          });
          const historyText = (conversation?.messages ?? [])
            .reverse()
            .map((m) => `${m.direction === "IN" ? "User" : "Agent"}: ${m.text}`)
            .join("\n");

          const responseText = await this.executeLeadQualification(
            run.workspaceId,
            run.contactId,
            data.prompt || "Qualify lead kindly.",
            historyText,
            allFields,
          );

          await this.enqueueSend(run, contact, { text: responseText, source: "AI" });
          break;
        }
        case "add_tag":
          await this.updateTags(contact, data.tag, "add");
          break;
        case "remove_tag":
          await this.updateTags(contact, data.tag, "remove");
          break;
        case "handoff_human":
          await this.handoffToHuman(contact.id);
          await this.complete(run.id);
          return;
        case "wait":
          await this.prisma.flowRun.update({
            where: { id: run.id },
            data: { status: "WAITING", currentNodeId: node.id },
          });
          await this.flowRunsQueue.add(
            "resume",
            { kind: "resume", flowRunId: run.id },
            { delay: data.seconds * 1000 },
          );
          return;
      }

      node = this.nextNode(definition, nodesById, node.id, "default");
    }

    // No outgoing edge → the flow simply ends.
    await this.complete(run.id);
  }

  private nextNode(
    definition: FlowDefinition,
    nodesById: Map<string, FlowNode>,
    fromId: string,
    branch: "default" | "true" | "false",
  ): FlowNode | null {
    const edge = definition.edges.find(
      (e) => e.from === fromId && e.branch === branch,
    );
    if (!edge) return null;
    return nodesById.get(edge.to) ?? null;
  }

  private evaluateCondition(
    data: ConditionNode["data"],
    context: FlowRunContext,
    contact: ContactState,
  ): boolean {
    switch (data.kind) {
      case "text_matches":
        return matchText(
          context.trigger?.text ?? "",
          data.keywords,
          data.matchType,
        );
      case "has_tag":
        return contact.tags.includes(data.tag);
      case "within_window":
        return (
          !!contact.lastInboundAt &&
          Date.now() - contact.lastInboundAt.getTime() <= MESSAGING_WINDOW_MS
        );
      case "has_follow":
        return contact.isFollow;
      default:
        throw new FlowExecutionError(
          `Unknown condition kind: ${(data as { kind: string }).kind}`,
        );
    }
  }

  private async loadContact(contactId: string): Promise<ContactState> {
    const contact = await this.prisma.contact.findUnique({
      where: { id: contactId },
      select: {
        id: true,
        igAccountId: true,
        tags: true,
        lastInboundAt: true,
        isFollow: true,
      },
    });
    if (!contact) throw new FlowExecutionError("contact no longer exists");
    return { ...contact, tags: [...contact.tags], isFollow: contact.isFollow };
  }

  private async enqueueSend(
    run: RunSnapshot,
    contact: ContactState,
    send: { text: string; quickReplies?: string[]; source: "FLOW" | "AI" },
  ): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { contactId: contact.id },
      select: { id: true },
    });
    if (!conversation) {
      throw new FlowExecutionError("contact has no conversation");
    }

    // Comment-triggered flows must answer with a private reply to the
    // comment — but only for the very first send of the run.
    const trigger = run.context.trigger;
    const isFirstSend = !run.context.firstSendDone;
    const replyToCommentId =
      isFirstSend && trigger?.source === "comment"
        ? trigger.commentId
        : undefined;

    const message = await this.prisma.message.create({
      data: {
        workspaceId: run.workspaceId,
        conversationId: conversation.id,
        direction: "OUT",
        source: send.source,
        text: send.text,
        status: "QUEUED",
      },
    });

    const job: SendMessageJob = {
      workspaceId: run.workspaceId,
      igAccountId: contact.igAccountId,
      contactId: contact.id,
      messageId: message.id,
      text: send.text,
      quickReplies: send.quickReplies,
      source: send.source,
      flowRunId: run.id,
      replyToCommentId,
    };
    await this.sendQueue.add("send", job);

    if (isFirstSend) {
      run.context.firstSendDone = true;
      await this.prisma.flowRun.update({
        where: { id: run.id },
        data: { context: run.context as unknown as Prisma.InputJsonValue },
      });
    }
  }

  private async generateAiReply(
    prompt: string,
    userText: string,
  ): Promise<string> {
    const openRouterKey = this.config.get<string>("OPENROUTER_API_KEY") ?? "";
    const openAiKey = this.config.get<string>("OPENAI_API_KEY") ?? "";
    if (!openRouterKey && !openAiKey) {
      throw new FlowExecutionError(
        "ai_reply failed: no AI API key configured — set OPENROUTER_API_KEY or OPENAI_API_KEY",
      );
    }
    try {
      if (!this.openai) {
        const useOpenRouter = !!openRouterKey;
        this.openai = new OpenAI({
          apiKey: useOpenRouter ? openRouterKey : openAiKey,
          ...(useOpenRouter && {
            baseURL:
              this.config.get<string>("OPENROUTER_BASE_URL") ??
              "https://openrouter.ai/api/v1",
            defaultHeaders: {
              "X-OpenRouter-Title": "DM Automation",
              "HTTP-Referer": "https://dmautomation.com",
            },
          }),
        });
      }
      const model =
        this.config.get<string>("AI_MODEL") ?? "gpt-4o-mini";
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `${prompt}\nKeep responses under 2 sentences.`,
          },
          { role: "user", content: userText },
        ],
      });
      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new FlowExecutionError("ai_reply failed: empty completion");
      }
      return text;
    } catch (err) {
      if (err instanceof FlowExecutionError) throw err;
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(`ai_reply call failed: ${detail}`);
      throw new FlowExecutionError(`ai_reply failed: ${detail}`);
    }
  }

  private async executeLeadQualification(
    workspaceId: string,
    contactId: string,
    prompt: string,
    historyText: string,
    fields: { id: string; key: string; label: string; type: string }[],
  ): Promise<string> {
    const openRouterKey = this.config.get<string>("OPENROUTER_API_KEY") ?? "";
    const openAiKey = this.config.get<string>("OPENAI_API_KEY") ?? "";
    if (!openRouterKey && !openAiKey) {
      throw new FlowExecutionError(
        "lead_qualify failed: no AI API key configured — set OPENROUTER_API_KEY or OPENAI_API_KEY",
      );
    }
    try {
      if (!this.openai) {
        const useOpenRouter = !!openRouterKey;
        this.openai = new OpenAI({
          apiKey: useOpenRouter ? openRouterKey : openAiKey,
          ...(useOpenRouter && {
            baseURL:
              this.config.get<string>("OPENROUTER_BASE_URL") ??
              "https://openrouter.ai/api/v1",
            defaultHeaders: {
              "X-OpenRouter-Title": "DM Automation",
              "HTTP-Referer": "https://dmautomation.com",
            },
          }),
        });
      }
      
      const fieldsDescription = fields.map(f => `- ${f.key} (${f.label}, type: ${f.type})`).join("\n");
      const systemPrompt = `You are an AI lead qualification assistant. Your goal is to qualify a prospect by collecting the following details:
${fieldsDescription}

Instructions:
1. Analyze the conversation history.
2. If any of the requested fields are present in the user's messages, extract them in the exact type requested.
3. Determine if you have gathered all the fields.
4. Draft a short, natural follow-up response (max 2 sentences) to ask for the next missing field, or say thank you if everything is gathered.
5. Return your response ONLY as a JSON object matching this schema:
{
  "extracted": { "fieldKey": "extractedValue" },
  "reply": "Follow-up message text"
}
Do not add markdown formatting or backticks around the JSON.

Additional rules:
${prompt}`;

      const model = this.config.get<string>("AI_MODEL") ?? "gpt-4o-mini";
      const completion = await this.openai.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: historyText || "Start the qualification conversation." },
        ],
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0]?.message?.content?.trim();
      if (!text) {
        throw new FlowExecutionError("lead_qualify failed: empty completion");
      }

      const parsed = JSON.parse(text);
      if (parsed.extracted) {
        for (const [key, val] of Object.entries(parsed.extracted)) {
          const field = fields.find(f => f.key === key);
          if (field && val !== null && val !== undefined) {
            await this.prisma.leadFieldValue.upsert({
              where: {
                contactId_fieldId: {
                  contactId,
                  fieldId: field.id,
                },
              },
              create: {
                contactId,
                fieldId: field.id,
                value: String(val),
              },
              update: {
                value: String(val),
              },
            });
          }
        }
      }

      // Check if all fields are qualified
      const currentValues = await this.prisma.leadFieldValue.findMany({
        where: { contactId },
      });
      const hasAll = fields.every(f => currentValues.some(cv => cv.fieldId === f.id));
      if (hasAll) {
        await this.prisma.lead.upsert({
          where: { contactId },
          create: {
            contactId,
            status: "QUALIFIED",
            qualifiedAt: new Date(),
          },
          update: {
            status: "QUALIFIED",
            qualifiedAt: new Date(),
          },
        });
      } else {
        await this.prisma.lead.upsert({
          where: { contactId },
          create: { contactId, status: "NEW" },
          update: {},
        });
      }

      return parsed.reply || "Thank you for the information!";
    } catch (err) {
      if (err instanceof FlowExecutionError) throw err;
      const detail = err instanceof Error ? err.message : String(err);
      this.logger.warn(`lead_qualify call failed: ${detail}`);
      throw new FlowExecutionError(`lead_qualify failed: ${detail}`);
    }
  }

  private async updateTags(
    contact: ContactState,
    tag: string,
    op: "add" | "remove",
  ): Promise<void> {
    const next =
      op === "add"
        ? contact.tags.includes(tag)
          ? contact.tags
          : [...contact.tags, tag]
        : contact.tags.filter((t) => t !== tag);
    // No-op when already tagged / not present.
    if (next === contact.tags || next.length === contact.tags.length) return;
    contact.tags = next;
    await this.prisma.contact.update({
      where: { id: contact.id },
      data: { tags: next },
    });
  }

  private async handoffToHuman(contactId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { contactId },
      select: { id: true },
    });
    if (!conversation) {
      throw new FlowExecutionError("contact has no conversation");
    }
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { mode: "HUMAN", unreadCount: { increment: 1 } },
    });
  }

  private async complete(runId: string): Promise<void> {
    await this.prisma.flowRun.update({
      where: { id: runId },
      data: { status: "COMPLETED", finishedAt: new Date() },
    });
  }

  private async fail(runId: string, error: string): Promise<void> {
    this.logger.warn(`flow run ${runId} failed: ${error}`);
    await this.prisma.flowRun.update({
      where: { id: runId },
      data: { status: "FAILED", error, finishedAt: new Date() },
    });
  }
}
