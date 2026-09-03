"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { onCurrentUser } from "../user";
import { invalidateUserCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { serverApiFetch } from "@/lib/server-api";
import { validateInstagramOAuthUrl } from "@/lib/env-validation";

const INSTAGRAM_OAUTH_STATE_COOKIE = "instagram_oauth_state";

export const onOAuthInstagram = async () => {
  const configuredUrl = process.env.INSTAGRAM_EMBEDDED_OAUTH_URL;
  if (!configuredUrl) {
    logger.error("Instagram OAuth URL is not configured");
    return { status: 500, error: "Instagram integration is not configured" };
  }
  const configurationError = validateInstagramOAuthUrl(configuredUrl);
  if (configurationError) {
    logger.error("Instagram OAuth URL is invalid", {
      message: configurationError,
    });
    return { status: 500, error: "Instagram integration is misconfigured" };
  }

  const state = randomBytes(32).toString("base64url");
  const oauthUrl = new URL(configuredUrl);
  oauthUrl.searchParams.set("state", state);
  const cookieStore = await cookies();
  cookieStore.set(INSTAGRAM_OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/callback/instagram",
    maxAge: 10 * 60,
  });
  redirect(oauthUrl.toString());
};

const isValidOAuthState = (received: string, expected: string): boolean => {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

const resolveWorkspaceId = async (): Promise<string> => {
  const result = await serverApiFetch<{ workspaceId: string; role: string }>("/workspaces/resolve");
  return result.workspaceId;
};

export const onIntegrate = async (code: string, state: string) => {
  logger.info("Instagram integration started");

  try {
    const cookieStore = await cookies();
    const expectedState = cookieStore.get(INSTAGRAM_OAUTH_STATE_COOKIE)?.value;
    if (!expectedState || !state || !isValidOAuthState(state, expectedState)) {
      logger.warn("Instagram OAuth state validation failed");
      return { status: 400, error: "Invalid or expired OAuth state" };
    }

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
