/**
 * BullMQ job payload contracts. These are the boundaries between the
 * webhook receiver, flow engine, broadcast fan-out and the send layer.
 */

/** QUEUES.WEBHOOK_EVENTS — raw verified Instagram webhook entry to process. */
export interface WebhookEventJob {
  webhookEventId: string; // WebhookEvent row id (already deduped)
}

/** QUEUES.FLOW_RUNS — either start a flow for a trigger event, or resume a waiting run. */
export type FlowRunJob =
  | {
      kind: "trigger";
      workspaceId: string;
      igAccountId: string;
      contactId: string;
      conversationId: string;
      messageId: string | null;
      trigger: {
        source: "dm" | "comment" | "story_reply";
        text: string;
        postId?: string;
        commentId?: string;
      };
    }
  | {
      kind: "resume";
      flowRunId: string;
    };

/** QUEUES.SEND_MESSAGES — one outbound Instagram message. */
export interface SendMessageJob {
  workspaceId: string;
  igAccountId: string;
  contactId: string;
  /** Pre-created Message row (status QUEUED) that the processor finalizes. */
  messageId: string;
  text: string;
  quickReplies?: string[];
  source: "FLOW" | "BROADCAST" | "AGENT" | "AI";
  /** Send with HUMAN_AGENT tag (7-day window) — only for human agent replies. */
  humanAgent?: boolean;
  broadcastId?: string;
  flowRunId?: string;
  /** Private reply to a comment id instead of a standard DM. */
  replyToCommentId?: string;
}

/** QUEUES.BROADCASTS — fan a broadcast out into individual sends. */
export interface BroadcastJob {
  broadcastId: string;
}
