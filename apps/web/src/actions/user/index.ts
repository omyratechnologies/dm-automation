"use server";

import { currentUser } from "@clerk/nextjs/server";

import { redirect } from "next/navigation";
import {
  getOrSetCache,
  CACHE_TTL,
  cacheKey,
  CACHE_KEYS,
  invalidateUserCache,
} from "@/lib/cache";
import { logger } from "@/lib/logger";
import { serverApiFetch } from "@/lib/server-api";
import type { ApiResult, UserProfile } from "@/lib/api-result";
import { success, notFound, serverError } from "@/lib/api-result";

export const onCurrentUser = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");

  return user;
};

export const onBoardUser = async () => {
  const user = await onCurrentUser();
  logger.info("onBoardUser called", { userId: user.id, email: user.emailAddresses[0].emailAddress });
  try {
    const profile = await serverApiFetch<UserProfile>("/me/ensure", {
      method: "POST",
      body: {
        clerkId: user.id,
        firstname: user.firstName ?? "",
        lastname: user.lastName ?? "",
        email: user.emailAddresses[0].emailAddress,
      },
    });

    if (!profile) {
      return { status: 500 };
    }

    logger.info("User onboarded", { profileId: profile.id });
    return {
      status: 201,
      data: {
        firstname: profile.firstname ?? "",
        lastname: profile.lastname ?? "",
      },
    };
  } catch (error) {
    logger.error("Error in onBoardUser", {
      message: error instanceof Error ? error.message : String(error),
    });
    return { status: 500 };
  }
};

export const onUserInfo = async (): Promise<ApiResult<UserProfile>> => {
  const user = await onCurrentUser();
  const userId = user.id;

  try {
    const profile = await getOrSetCache(
      cacheKey(CACHE_KEYS.USER, userId),
      () => serverApiFetch<UserProfile>("/me"),
      CACHE_TTL.USER_DATA,
    );

    if (profile) {
      logger.info("onUserInfo", {
        userId,
        hasProfile: true,
      });
      return success(profile);
    }

    return notFound();
  } catch (error) {
    logger.error("Error in onUserInfo", {
      message: error instanceof Error ? error.message : String(error),
    });
    return serverError();
  }
};

export const onSubscribe = async (session_id: string): Promise<ApiResult<void>> => {
  const user = await onCurrentUser();
  const userId = user.id;

  try {
    // The API verifies the session is paid and belongs to this user
    // (client_reference_id) before activating PRO.
    await serverApiFetch("/me/subscription", {
      method: "POST",
      body: { sessionId: session_id },
    });
    await invalidateUserCache(userId);
    return success(undefined);
  } catch (error) {
    logger.error("Error activating subscription", {
      message: error instanceof Error ? error.message : String(error),
    });
    return serverError();
  }
};

export const onUpdateProfile = async (data: {
  firstname?: string;
  lastname?: string;
}): Promise<ApiResult<string>> => {
  const user = await onCurrentUser();
  try {
    await serverApiFetch("/me", { method: "PATCH", body: data });
    await invalidateUserCache(user.id);
    return success("Profile updated");
  } catch (error) {
    logger.error("Error updating profile", {
      message: error instanceof Error ? error.message : String(error),
    });
    return serverError("Failed to update profile");
  }
};

export const onDeleteAccount = async (): Promise<ApiResult<string>> => {
  const user = await onCurrentUser();
  try {
    await serverApiFetch("/me", { method: "DELETE" });
    await invalidateUserCache(user.id);
    return success("Account deleted");
  } catch (error) {
    logger.error("Error deleting account", {
      message: error instanceof Error ? error.message : String(error),
    });
    return serverError("Failed to delete account");
  }
};
