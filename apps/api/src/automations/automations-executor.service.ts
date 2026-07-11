import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { MessagingService } from "../messaging/messaging.service";
import type { IgAccount, Contact, Conversation, Message } from "@prisma/client";
import OpenAI from "openai";

interface InboundInput {
  senderIgUserId: string;
  username?: string;
  text: string;
  mid?: string;
  source: "dm" | "comment" | "story_reply";
  postId?: string;
  commentId?: string;
}

@Injectable()
export class AutomationsExecutorService {
  private readonly logger = new Logger(AutomationsExecutorService.name);
  private openai: OpenAI | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
    private readonly config: ConfigService,
  ) {}

  /** Trigger legacy/standard automations for incoming message/comment */
  async trigger(
    igAccount: IgAccount,
    contact: Contact,
    conversation: Conversation,
    message: Message,
    input: InboundInput,
  ): Promise<void> {
    try {
      // Find active automations belonging to members of this workspace
      const automations = await this.prisma.automation.findMany({
        where: {
          active: true,
          User: {
            memberships: {
              some: {
                workspaceId: igAccount.workspaceId,
              },
            },
          },
        },
        include: {
          trigger: true,
          keywords: true,
          posts: true,
          listener: true,
        },
      });

      if (automations.length === 0) return;

      for (const automation of automations) {
        if (!automation.listener) continue;

        // 1. Check Trigger Match
        const matchesTrigger = automation.trigger.some((t) => {
          if (input.source === "comment" && t.type === "COMMENT") return true;
          if (input.source === "dm" && t.type === "DM") return true;
          if (input.source === "story_reply" && (t.type === "DM" || t.type === "STORY")) return true;
          return false;
        });
        if (!matchesTrigger) continue;

        // 2. Check Post ID Match (for Comments only)
        if (input.source === "comment" && automation.posts.length > 0 && input.postId) {
          const matchesPost = automation.posts.some((p) => p.postid === input.postId);
          if (!matchesPost) continue;
        }

        // 3. Check Keyword Match
        const cleanText = input.text.trim().toLowerCase();
        const matchesKeyword = automation.keywords.length === 0 || automation.keywords.some((kw) => {
          const cleanKw = kw.word.trim().toLowerCase();
          if (!cleanKw) return false;
          return cleanText.includes(cleanKw);
        });
        if (!matchesKeyword) continue;

        // Increment counts
        await this.prisma.listener.update({
          where: { id: automation.listener.id },
          data: {
            ...(input.source === "comment"
              ? { commentCount: { increment: 1 } }
              : { dmCount: { increment: 1 } }),
          },
        });

        // 4. Execute standard reply
        if (automation.listener.listener === "MESSAGE") {
          const replyText = automation.listener.prompt || automation.listener.commentReply;
          if (replyText) {
            await this.messaging.createAndQueueSend({
              workspaceId: igAccount.workspaceId,
              igAccountId: igAccount.id,
              contactId: contact.id,
              conversationId: conversation.id,
              text: replyText,
              source: "AI",
              ...(input.source === "comment" && input.commentId
                ? { replyToCommentId: input.commentId }
                : {}),
            });
          }
        } else if (automation.listener.listener === "SMARTAI") {
          try {
            const replyText = await this.executeAiReply(automation.listener.prompt, input.text);
            await this.messaging.createAndQueueSend({
              workspaceId: igAccount.workspaceId,
              igAccountId: igAccount.id,
              contactId: contact.id,
              conversationId: conversation.id,
              text: replyText,
              source: "AI",
              ...(input.source === "comment" && input.commentId
                ? { replyToCommentId: input.commentId }
                : {}),
            });
          } catch (aiErr) {
            this.logger.warn(`Failed to process standard automation AI reply: ${aiErr}`);
          }
        }
      }
    } catch (err) {
      this.logger.error(`Error executing standard automations trigger matching: ${err}`);
    }
  }

  private async executeAiReply(prompt: string, userText: string): Promise<string> {
    const openRouterKey = this.config.get<string>("OPENROUTER_API_KEY") ?? "";
    const openAiKey = this.config.get<string>("OPENAI_API_KEY") ?? "";
    if (!openRouterKey && !openAiKey) {
      throw new Error("No AI API keys configured");
    }

    if (!this.openai) {
      const useOpenRouter = !!openRouterKey;
      this.openai = new OpenAI({
        apiKey: useOpenRouter ? openRouterKey : openAiKey,
        ...(useOpenRouter && {
          baseURL: this.config.get<string>("OPENROUTER_BASE_URL") ?? "https://openrouter.ai/api/v1",
          defaultHeaders: {
            "X-OpenRouter-Title": "DM Automation",
            "HTTP-Referer": "https://dmautomation.com",
          },
        }),
      });
    }

    const model = this.config.get<string>("AI_MODEL") ?? "gpt-4o-mini";
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
      throw new Error("Empty completion returned from AI model");
    }
    return text;
  }
}
