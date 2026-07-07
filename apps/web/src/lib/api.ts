import type { FlowDefinition, SegmentFilter, Role } from "@repo/shared";

/**
 * Typed fetch client for the NestJS backend.
 * All routes are prefixed with /v1 — pass paths like "/me" or
 * "/workspaces/:id/conversations".
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  status: number;
  /** Validation issues surfaced by the API (e.g. flow publish 400s). */
  issues?: unknown[];
  body?: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
    if (
      body &&
      typeof body === "object" &&
      Array.isArray((body as { issues?: unknown[] }).issues)
    ) {
      this.issues = (body as { issues: unknown[] }).issues;
    }
  }
}

export type ApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  workspaceId?: string | null;
  token?: string | null;
  signal?: AbortSignal;
};

export async function apiFetch<T>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const { method = "GET", body, workspaceId, token, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (workspaceId) headers["x-workspace-id"] = workspaceId;

  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(0, "Network error — could not reach the API");
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (data && typeof data === "object") {
      const m = (data as { message?: string | string[] }).message;
      if (Array.isArray(m)) message = m.join(", ");
      else if (typeof m === "string") message = m;
    } else if (typeof data === "string" && data) {
      message = data;
    }
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}

/* ------------------------------------------------------------------ */
/* API entity types (mirrors the /v1 contract)                         */
/* ------------------------------------------------------------------ */

export type Page<T> = { items: T[]; nextCursor: string | null };

export type Me = {
  id: string;
  email: string;
  memberships: {
    role: Role;
    workspace: {
      id: string;
      name: string;
      organization: { id: string; name: string; plan: string };
    };
  }[];
};

export type Member = {
  id: string;
  role: Role;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstname: string | null;
    lastname: string | null;
  };
};

export type IgAccount = {
  id: string;
  igUserId: string;
  username: string;
  status: string;
};

export type ContactSummary = {
  id: string;
  username: string;
  name: string | null;
  profilePicUrl: string | null;
  lastInboundAt: string | null;
};

export type Contact = ContactSummary & {
  tags: string[];
  optedOut: boolean;
  createdAt?: string;
};

export type ConversationStatus = "OPEN" | "CLOSED";
export type ConversationMode = "BOT" | "HUMAN";

export type Conversation = {
  id: string;
  status: ConversationStatus;
  mode: ConversationMode;
  assignedToId: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  contact: ContactSummary;
};

export type MessageSource = "AGENT" | "FLOW" | "AI" | "BROADCAST" | string;

export type Message = {
  id: string;
  direction: "IN" | "OUT";
  source: MessageSource | null;
  text: string | null;
  status: string | null;
  errorCode: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type FlowStatus = "DRAFT" | "ACTIVE" | "PAUSED";

export type FlowSummary = {
  id: string;
  name: string;
  status: FlowStatus;
  updatedAt?: string;
  createdAt?: string;
};

export type FlowDetail = FlowSummary & {
  draftDefinition: FlowDefinition | null;
  activeDefinition: FlowDefinition | null;
};

export type FlowRun = {
  id: string;
  status?: string;
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string | null;
  error?: string | null;
  contact?: { username?: string } | null;
  [key: string]: unknown;
};

export type Segment = {
  id: string;
  name: string;
  filter: SegmentFilter;
  createdAt?: string;
};

export type SegmentPreview = { total: number; eligible: number };

export type Broadcast = {
  id: string;
  name: string;
  status: string;
  igAccountId: string;
  segmentId: string | null;
  messageText: string;
  totalTargets?: number;
  sentCount?: number;
  failedCount?: number;
  skippedCount?: number;
  createdAt?: string;
};

export type AnalyticsOverview = {
  sends: number;
  delivered: number;
  failed: number;
  rejected: number;
  inbound: number;
  newContacts: number;
  activeFlows: number;
  broadcasts: number;
};

export type Billing = {
  plan: string;
  currentPeriodEnd: string | null;
  usage: Record<string, number>;
  limits: Record<string, number>;
};
