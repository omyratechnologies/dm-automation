/** BullMQ queue names — shared by API producers and worker processors. */
export const QUEUES = {
  WEBHOOK_EVENTS: "webhook-events",
  SEND_MESSAGES: "send-messages",
  FLOW_RUNS: "flow-runs",
  BROADCASTS: "broadcasts",
  TOKEN_REFRESH: "token-refresh",
  WEBHOOK_EVENT_CLEANUP: "webhook-event-cleanup",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

/** Workspace member roles, in descending privilege order. */
export const ROLES = ["OWNER", "ADMIN", "AGENT"] as const;
export type Role = (typeof ROLES)[number];

/** Meta standard messaging window (ms). Sends outside it require HUMAN_AGENT. */
export const MESSAGING_WINDOW_MS = 24 * 60 * 60 * 1000;
/** HUMAN_AGENT tag window (ms): 7 days from last inbound message. */
export const HUMAN_AGENT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export const PLANS = {
  FREE: {
    name: "Free",
    monthlySends: 500,
    contacts: 200,
    members: 1,
    aiReplies: false,
  },
  PRO: {
    name: "Pro",
    monthlySends: 25000,
    contacts: 10000,
    members: 10,
    aiReplies: true,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

/** Socket.io event names for the inbox gateway. */
export const WS_EVENTS = {
  // client → server
  JOIN_WORKSPACE: "workspace:join",
  // server → client
  MESSAGE_CREATED: "message:created",
  CONVERSATION_UPDATED: "conversation:updated",
  BROADCAST_PROGRESS: "broadcast:progress",
} as const;

/** Reasons a queued send can be rejected at the send layer. */
export const SEND_REJECTIONS = {
  WINDOW_EXPIRED: "MESSAGING_WINDOW_EXPIRED",
  HUMAN_AGENT_WINDOW_EXPIRED: "HUMAN_AGENT_WINDOW_EXPIRED",
  PLAN_LIMIT: "PLAN_SEND_LIMIT_REACHED",
  NO_CONSENT: "NO_PRIOR_INBOUND_MESSAGE",
  FOLLOW_REQUIRED: "FOLLOW_REQUIRED_FOR_POST",
} as const;
