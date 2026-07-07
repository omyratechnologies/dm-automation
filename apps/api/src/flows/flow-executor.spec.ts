import { FlowExecutor, MAX_STEPS, type RunSnapshot } from "./flow-executor";
import type { FlowDefinition, FlowNode } from "@repo/shared";

const makeRun = (overrides: Partial<RunSnapshot> = {}): RunSnapshot => ({
  id: "run-1",
  workspaceId: "ws-1",
  flowId: "flow-1",
  contactId: "contact-1",
  context: {},
  ...overrides,
});

const makeDef = (
  nodes: FlowNode[],
  edges: FlowDefinition["edges"] = [],
): FlowDefinition => ({
  nodes,
  edges,
});

function makeFixture() {
  const prisma = {
    contact: { findUnique: jest.fn(), update: jest.fn() },
    conversation: { findUnique: jest.fn(), update: jest.fn() },
    message: { create: jest.fn() },
    flowRun: { update: jest.fn() },
  };
  const config = { get: jest.fn() };
  const sendQueue = { add: jest.fn() };
  const flowRunsQueue = { add: jest.fn() };

  const executor = new FlowExecutor(
    prisma as never,
    config as never,
    sendQueue as never,
    flowRunsQueue as never,
  );

  return { executor, prisma, config, sendQueue, flowRunsQueue };
}

describe("FlowExecutor", () => {
  describe("condition evaluation", () => {
    it("evaluates text_matches condition to true", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        {
          id: "b",
          type: "condition",
          data: { kind: "text_matches", keywords: ["hello"], matchType: "contains" },
        },
        { id: "c", type: "action", data: { kind: "send_message", text: "hi", quickReplies: [] } },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
        { id: "e2", from: "b", to: "c", branch: "true" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "hello world" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.message.create).toHaveBeenCalled();
      expect(f.sendQueue.add).toHaveBeenCalled();
    });

    it("follows false branch when text_matches fails", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        {
          id: "b",
          type: "condition",
          data: { kind: "text_matches", keywords: ["hello"], matchType: "contains" },
        },
        { id: "c", type: "action", data: { kind: "send_message", text: "matched", quickReplies: [] } },
        { id: "d", type: "action", data: { kind: "send_message", text: "no match", quickReplies: [] } },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
        { id: "e2", from: "b", to: "c", branch: "true" as const },
        { id: "e3", from: "b", to: "d", branch: "false" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "goodbye" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.sendQueue.add).toHaveBeenCalledWith(
        "send",
        expect.objectContaining({ text: "no match" }),
      );
    });

    it("evaluates has_tag condition", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "condition", data: { kind: "has_tag", tag: "vip" } },
        {
          id: "c",
          type: "action",
          data: { kind: "add_tag", tag: "vip-processed" },
        },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
        { id: "e2", from: "b", to: "c", branch: "true" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: ["vip"],
        lastInboundAt: new Date(),
      });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "hi" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { tags: ["vip", "vip-processed"] } }),
      );
    });

    it("evaluates within_window condition", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        {
          id: "b",
          type: "condition",
          data: { kind: "within_window" },
        },
        {
          id: "c",
          type: "action",
          data: { kind: "send_message", text: "within window", quickReplies: [] },
        },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
        { id: "e2", from: "b", to: "c", branch: "true" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "hi" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.sendQueue.add).toHaveBeenCalled();
    });

    it("reports unknown condition kind as FlowExecutionError", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        {
          id: "b",
          type: "condition",
          data: { kind: "unknown_kind" },
        },
      ] as unknown as FlowNode[];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
      ] as unknown as FlowDefinition["edges"];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "hi" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.flowRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "run-1" },
          data: expect.objectContaining({ status: "FAILED" }),
        }),
      );
    });
  });

  describe("action nodes", () => {
    it("adds a tag then sends a message", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "add_tag", tag: "lead" } },
        {
          id: "c",
          type: "action",
          data: { kind: "send_message", text: "welcome", quickReplies: [] },
        },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
        { id: "e2", from: "b", to: "c", branch: "default" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "i want to buy" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { tags: ["lead"] } }),
      );
      expect(f.sendQueue.add).toHaveBeenCalledWith(
        "send",
        expect.objectContaining({ text: "welcome" }),
      );
    });

    it("removes a tag", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "remove_tag", tag: "lead" } },
      ];
      const edges = [{ id: "e1", from: "a", to: "b", branch: "default" as const }];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: ["lead"],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "stop" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.contact.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { tags: [] } }),
      );
    });

    it("handles handoff_human action", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "handoff_human" } },
      ];
      const edges = [{ id: "e1", from: "a", to: "b", branch: "default" as const }];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "talk to human" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ mode: "HUMAN" }) }),
      );
      expect(f.prisma.flowRun.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) }),
      );
    });

    it("handles wait action by scheduling resume and marking WAITING", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "wait", seconds: 60 } },
      ];
      const edges = [{ id: "e1", from: "a", to: "b", branch: "default" as const }];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "remind me" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.flowRun.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: "WAITING", currentNodeId: "b" } }),
      );
      expect(f.flowRunsQueue.add).toHaveBeenCalledWith(
        "resume",
        { kind: "resume", flowRunId: "run-1" },
        { delay: 60000 },
      );
    });

    it("sends with replyToCommentId on first send from comment trigger", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "send_message", text: "replied", quickReplies: [] } },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({
          context: {
            trigger: { source: "comment", text: "nice!", commentId: "comment-1" },
          },
        }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.sendQueue.add).toHaveBeenCalledWith(
        "send",
        expect.objectContaining({ replyToCommentId: "comment-1" }),
      );
    });
  });

  describe("error handling", () => {
    it("fails the run when contact no longer exists", async () => {
      const f = makeFixture();
      f.prisma.contact.findUnique.mockResolvedValue(null);

      await f.executor.execute(
        makeRun(),
        makeDef([]),
        "a",
      );

      expect(f.prisma.flowRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED" }),
        }),
      );
    });

    it("fails when conversation not found on enqueue", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "send_message", text: "hi", quickReplies: [] } },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue(null);

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "hi" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.flowRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED" }),
        }),
      );
    });

    it("handles step limit exceeded", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "send_message", text: "loop", quickReplies: [] } },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
        { id: "e2", from: "b", to: "b", branch: "default" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "x" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.flowRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "FAILED", error: expect.stringContaining("step limit") }),
        }),
      );
    });

    it("rethrows infra errors (not FlowExecutionError)", async () => {
      const f = makeFixture();
      f.prisma.contact.findUnique.mockRejectedValue(new Error("DB down"));

      await expect(
        f.executor.execute(makeRun(), makeDef([]), "a"),
      ).rejects.toThrow("DB down");
    });
  });

  describe("ai_reply", () => {
    it("fails when no AI API key is configured", async () => {
      const f = makeFixture();
      f.config.get.mockReturnValue(undefined);
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "ai_reply", prompt: "Be helpful" } },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "hello" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.flowRun.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "FAILED",
            error: expect.stringContaining("OPENROUTER_API_KEY"),
          }),
        }),
      );
    });
  });

  describe("no-op actions", () => {
    it("skips tag update when tag already exists (add_tag no-op)", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "add_tag", tag: "lead" } },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: ["lead"],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "hi" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.contact.update).not.toHaveBeenCalled();
    });

    it("skips tag update when tag not present (remove_tag no-op)", async () => {
      const f = makeFixture();
      const nodes: FlowNode[] = [
        { id: "a", type: "trigger", data: { kind: "any_message" } as never },
        { id: "b", type: "action", data: { kind: "remove_tag", tag: "vip" } },
      ];
      const edges = [
        { id: "e1", from: "a", to: "b", branch: "default" as const },
      ];
      f.prisma.contact.findUnique.mockResolvedValue({
        id: "contact-1",
        igAccountId: "iga-1",
        tags: [],
        lastInboundAt: new Date(),
      });
      f.prisma.conversation.findUnique.mockResolvedValue({ id: "conv-1" });
      f.prisma.message.create.mockResolvedValue({ id: "msg-1" });

      await f.executor.execute(
        makeRun({ context: { trigger: { source: "dm", text: "hi" } } }),
        makeDef(nodes, edges),
        "a",
      );

      expect(f.prisma.contact.update).not.toHaveBeenCalled();
    });
  });
});
