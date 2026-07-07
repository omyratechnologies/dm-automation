"use server";

import { redirect } from "next/navigation";
import { onCurrentUser } from "../user";
import { invalidateUserCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { serverApiFetch } from "@/lib/server-api";

export const onOAuthInstagram = (strategy: "INSTAGRAM" | "CRM") => {
  if (strategy === "INSTAGRAM") {
    return redirect(process.env.INSTAGRAM_EMBEDDED_OAUTH_URL as string);
  } else {
    logger.info("CRM Auth");
  }
};

const resolveWorkspaceId = async (): Promise<string> => {
  const result = await serverApiFetch<{ workspaceId: string; role: string }>("/workspaces/resolve");
  return result.workspaceId;
};

export const onIntegrate = async (code: string) => {
  logger.info("onIntegrate called", { codePrefix: code.substring(0, 20) + "..." });

  try {
    const user = await onCurrentUser();
    const workspaceId = await resolveWorkspaceId();

    const account = await serverApiFetch<{ id: string; igUserId: string; username: string }>(
      `/workspaces/${workspaceId}/ig-accounts/connect`,
      { method: "POST", body: { code }, workspaceId },
    );

    await invalidateUserCache(user.id);

    return {
      status: 200,
      data: { firstname: user.firstName, lastname: user.lastName },
    };
  } catch (error: any) {
    logger.error("Error in onIntegrate", {
      message: error.message,
      response: error.body,
    });
    return {
      status: 500,
      error: error.message || "Failed to connect Instagram account",
    };
  }
};

export const onDisconnect = async (integrationId: string) => {
  logger.info("onDisconnect called", { integrationId });

  try {
    const user = await onCurrentUser();
    const workspaceId = await resolveWorkspaceId();

    await serverApiFetch(`/workspaces/${workspaceId}/ig-accounts/${integrationId}`, {
      method: "DELETE",
      workspaceId,
    });

    await invalidateUserCache(user.id);

    return { status: 200, message: "Integration disconnected successfully" };
  } catch (error: any) {
    logger.error("Error disconnecting integration", {
      message: error.message,
    });
    return {
      status: 500,
      error: error.message || "Failed to disconnect integration",
    };
  }
};

export const getInstagramAccountInfo = async (instagramId: string, accessToken: string) => {
  logger.info("Fetching Instagram account info", { instagramId });

  try {
    const { default: axios } = await import("axios");
    const response = await axios.get(
      `${process.env.INSTAGRAM_BASE_URL}/${instagramId}`,
      {
        params: { fields: "username,account_type,media_count" },
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    return {
      status: 200,
      data: {
        username: response.data.username,
        accountType: response.data.account_type,
        mediaCount: response.data.media_count,
        instagramId: instagramId,
      },
    };
  } catch (error: any) {
    logger.error("Error fetching Instagram account info", {
      message: error.message,
      response: error.response?.data,
    });
    return {
      status: 500,
      error: error.message || "Failed to fetch Instagram account info",
    };
  }
};
