"use server";

import { onCurrentUser } from "../user";
import {
  getOrSetCache,
  CACHE_TTL,
  cacheKey,
  CACHE_KEYS,
  invalidateAutomationCache,
  invalidateUserCache,
} from "@/lib/cache";
import { logger } from "@/lib/logger";
import { serverApiFetch } from "@/lib/server-api";
import { ApiError } from "@/lib/api";
import type { ApiResult, AutomationData, AutomationListItem, InstagramMediaResponse } from "@/lib/api-result";
import { success, created, notFound, serverError } from "@/lib/api-result";

const resolveWorkspaceId = async (): Promise<string> => {
  const result = await serverApiFetch<{ workspaceId: string; role: string }>("/workspaces/resolve");
  return result.workspaceId;
};

const callAutomationApi = async <T = unknown>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown } = {},
): Promise<T> => {
  const workspaceId = await resolveWorkspaceId();
  return serverApiFetch<T>(`/workspaces/${workspaceId}/automations${path}`, {
    method: options.method ?? "GET",
    body: options.body,
    workspaceId,
  });
};

const callIgAccountApi = async <T = unknown>(
  path: string,
  options: { method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"; body?: unknown } = {},
): Promise<T> => {
  const workspaceId = await resolveWorkspaceId();
  return serverApiFetch<T>(`/workspaces/${workspaceId}/ig-accounts${path}`, {
    method: options.method ?? "GET",
    body: options.body,
    workspaceId,
  });
};

export const createAutomations = async (id?: string): Promise<ApiResult<string>> => {
  const user = await onCurrentUser();
  const userId = user.id;

  try {
    await callAutomationApi("", { method: "POST", body: id ? { id } : {} });
    await invalidateUserCache(userId);
    return success("Automation Created");
  } catch (error) {
    return serverError("Internal Server Error");
  }
};

export const getAllAutomations = async (): Promise<ApiResult<AutomationListItem[]>> => {
  const user = await onCurrentUser();
  const userId = user.id;

  try {
    const data = await getOrSetCache(
      cacheKey(CACHE_KEYS.AUTOMATION_LIST, userId),
      () => callAutomationApi<{ automations: AutomationListItem[] }>(""),
      CACHE_TTL.AUTOMATION_LIST,
    );

    if (data?.automations) {
      return success(data.automations);
    }

    return notFound();
  } catch (error) {
    logger.error("Error in getAllAutomations", {
      message: error instanceof Error ? error.message : String(error),
    });
    return serverError();
  }
};

export const getAutomationInfo = async (id: string): Promise<ApiResult<AutomationData>> => {
  try {
    const automation = await callAutomationApi<AutomationData>(`/${id}`);
    return success(automation);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return notFound();
    return serverError();
  }
};

export const updateAutomationName = async (
  automationId: string,
  data: {
    name?: string;
    active?: boolean;
    automation?: string;
  },
): Promise<ApiResult<string>> => {
  const user = await onCurrentUser();
  const userId = user.id;

  try {
    await callAutomationApi(`/${automationId}`, {
      method: "PATCH",
      body: {
        name: data.name,
        active: data.active,
      },
    });
    await invalidateAutomationCache(automationId, userId);
    return success("Automation successfully updated");
  } catch (error) {
    return serverError("Oops! something went wrong");
  }
};

export const activateAutomation = async (id: string, state: boolean): Promise<ApiResult<string>> => {
  const user = await onCurrentUser();
  const userId = user.id;

  try {
    await callAutomationApi(`/${id}`, {
      method: "PATCH",
      body: { active: state },
    });
    await invalidateAutomationCache(id, userId);
    return success(`Automation ${state ? "activated" : "disabled"}`);
  } catch (error) {
    return serverError("Oops! something went wrong");
  }
};

export const saveListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string,
): Promise<ApiResult<string>> => {
  try {
    await callAutomationApi(`/${automationId}/listener`, {
      method: "POST",
      body: { listener, prompt, reply },
    });
    return success("Listener saved");
  } catch (error) {
    return serverError("Oops! something went wrong");
  }
};

export const saveTrigger = async (automationId: string, trigger: string[]): Promise<ApiResult<string>> => {
  try {
    await callAutomationApi(`/${automationId}/triggers`, {
      method: "POST",
      body: { triggers: trigger },
    });
    return success("Trigger saved");
  } catch (error) {
    return serverError("Oops! something went wrong");
  }
};

export const saveKeyword = async (automationId: string, keyword: string): Promise<ApiResult<string>> => {
  const user = await onCurrentUser();
  try {
    await callAutomationApi(`/${automationId}/keywords`, {
      method: "POST",
      body: { word: keyword },
    });
    await invalidateUserCache(user.id);
    return success("Keyword saved");
  } catch (error) {
    return serverError("Oops! something went wrong");
  }
};

export const deleteKeyword = async (keywordId: string): Promise<ApiResult<string>> => {
  const user = await onCurrentUser();
  try {
    await callAutomationApi(`/keywords/${keywordId}`, {
      method: "DELETE",
    });
    await invalidateUserCache(user.id);
    return success("Keyword deleted");
  } catch (error) {
    return serverError("Oops! something went wrong");
  }
};

export const getProfilePosts = async (): Promise<ApiResult<InstagramMediaResponse>> => {
  try {
    const accounts = await callIgAccountApi<Array<{ id: string }>>("");
    if (!Array.isArray(accounts) || accounts.length === 0) {
      return { status: 401 as const, data: "Instagram not connected" };
    }
    const result = await callIgAccountApi<{ igUserId: string; media: Array<{ id: string; caption?: string; media_url?: string; media_type?: string; timestamp?: string }> }>(`/${accounts[0].id}/media`);
    return success({ data: (result.media ?? []) as InstagramMediaResponse["data"] });
  } catch (error) {
    logger.error("Error fetching posts", {
      message: error instanceof Error ? error.message : String(error),
    });
    return serverError();
  }
};

export const savePosts = async (
  automationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
    requireFollow?: boolean;
  }[],
): Promise<ApiResult<string>> => {
  try {
    await callAutomationApi(`/${automationId}/posts`, {
      method: "POST",
      body: { posts },
    });
    return success("Posts attached");
  } catch (error) {
    return serverError("Oops! something went wrong");
  }
};

export const deleteAutomation = async (id: string): Promise<ApiResult<string>> => {
  try {
    await callAutomationApi(`/${id}`, { method: "DELETE" });
    return success("Automation deleted successfully");
  } catch (error) {
    return serverError("Oops! something went wrong");
  }
};
