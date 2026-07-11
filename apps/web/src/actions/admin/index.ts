"use server";

import { serverApiFetch } from "@/lib/server-api";
import { ApiResult, success, serverError } from "@/lib/api-result";
import { logger } from "@/lib/logger";

export interface PlatformStats {
  totalUsers: number;
  activeIgAccounts: number;
  totalWebhookEvents: number;
  failedWebhookEvents: number;
}

export interface AdminUserListItem {
  id: string;
  clerkId: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  createdAt: string;
  memberships: Array<{
    role: string;
    workspace: {
      id: string;
      name: string;
      organization: { plan: string };
    };
  }>;
}

export interface AdminUserDetails {
  id: string;
  clerkId: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  createdAt: string;
  subscription: {
    id: string;
    plan: "FREE" | "PRO";
    customerId: string | null;
  } | null;
  memberships: Array<{
    id: string;
    role: string;
    workspace: {
      id: string;
      name: string;
      organization: {
        id: string;
        name: string;
        plan: string;
        stripeCustomerId: string | null;
      };
      igAccounts: Array<{
        id: string;
        igUserId: string;
        username: string | null;
        status: string;
        createdAt: string;
      }>;
    };
  }>;
}

export interface WebhookEventListItem {
  id: string;
  provider: string;
  eventKey: string;
  status: "RECEIVED" | "PROCESSED" | "FAILED" | "DUPLICATE";
  error: string | null;
  receivedAt: string;
  processedAt: string | null;
}

export const getPlatformStats = async (): Promise<ApiResult<PlatformStats>> => {
  try {
    const data = await serverApiFetch<PlatformStats>("/admin/stats");
    return success(data);
  } catch (error) {
    logger.error("Error in getPlatformStats", { error });
    return serverError();
  }
};

export const getAdminUsers = async (
  page = 1,
  limit = 10,
  search = "",
): Promise<ApiResult<{ items: AdminUserListItem[]; total: number }>> => {
  try {
    const data = await serverApiFetch<{ items: AdminUserListItem[]; total: number }>(
      `/admin/users?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`,
    );
    return success(data);
  } catch (error) {
    logger.error("Error in getAdminUsers", { error });
    return serverError();
  }
};

export const getAdminUserDetails = async (
  userId: string,
): Promise<ApiResult<AdminUserDetails>> => {
  try {
    const data = await serverApiFetch<AdminUserDetails>(`/admin/users/${userId}`);
    return success(data);
  } catch (error) {
    logger.error("Error in getAdminUserDetails", { error });
    return serverError();
  }
};

export const overrideOrgSubscription = async (
  orgId: string,
  plan: "FREE" | "PRO",
): Promise<ApiResult<unknown>> => {
  try {
    const data = await serverApiFetch<unknown>(
      `/admin/organizations/${orgId}/override-subscription`,
      {
        method: "POST",
        body: { plan },
      },
    );
    return success(data);
  } catch (error) {
    logger.error("Error in overrideOrgSubscription", { error });
    return serverError();
  }
};

export const getWebhookEventsList = async (
  page = 1,
  limit = 15,
  status?: string,
): Promise<ApiResult<{ items: WebhookEventListItem[]; total: number }>> => {
  try {
    const statusQuery = status ? `&status=${status}` : "";
    const data = await serverApiFetch<{ items: WebhookEventListItem[]; total: number }>(
      `/admin/webhooks?page=${page}&limit=${limit}${statusQuery}`,
    );
    return success(data);
  } catch (error) {
    logger.error("Error in getWebhookEventsList", { error });
    return serverError();
  }
};

export const retryWebhookEvent = async (
  webhookEventId: string,
): Promise<ApiResult<unknown>> => {
  try {
    const data = await serverApiFetch<unknown>(
      `/admin/webhooks/${webhookEventId}/retry`,
      { method: "POST" },
    );
    return success(data);
  } catch (error) {
    logger.error("Error in retryWebhookEvent", { error });
    return serverError();
  }
};

export const startImpersonating = async (userId: string): Promise<ApiResult<boolean>> => {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.set("x-impersonate-user-id", userId, {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 2, // 2 hours
    });
    return success(true);
  } catch (error) {
    logger.error("Error in startImpersonating", { error });
    return serverError();
  }
};

export const stopImpersonating = async (): Promise<ApiResult<boolean>> => {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    cookieStore.delete("x-impersonate-user-id");
    return success(true);
  } catch (error) {
    logger.error("Error in stopImpersonating", { error });
    return serverError();
  }
};

export const getImpersonationState = async (): Promise<ApiResult<string | null>> => {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const val = cookieStore.get("x-impersonate-user-id")?.value || null;
    return success(val);
  } catch (error) {
    return success(null);
  }
};
