"use server";

import { onCurrentUser } from "../user";
import {
  createAutomation,
  findAutomation,
  getAutomations,
  updateAutomation,
  addListener,
  addTrigger,
  addKeyword,
  deleteKeywordQuery,
  addPost,
  deleteAutomationQuery,
} from "./queries";

import { findUser } from "../user/queries";
import {
  getOrSetCache,
  CACHE_TTL,
  cacheKey,
  CACHE_KEYS,
  invalidateAutomationCache,
  invalidateUserCache,
} from "@/lib/cache";

export const createAutomations = async (id?: string) => {
  const user = await onCurrentUser();
  const userId = user.id; // Extract to prevent closure capture
  
  try {
    const create = await createAutomation(userId, id);
    if (create) {
      // Invalidate automation list cache
      await invalidateUserCache(userId);
      return {
        status: 200,
        data: "Automation Created",
      };
    }
  } catch (error) {
    return { status: 500, data: "Internal Server Error" };
  }
};

export const getAllAutomations = async () => {
  const user = await onCurrentUser();
  const userId = user.id; // Extract to prevent closure capture
  
  try {
    // Use cache with 3-minute TTL for automation list
    const automations = await getOrSetCache(
      cacheKey(CACHE_KEYS.AUTOMATION_LIST, userId),
      () => getAutomations(userId),
      CACHE_TTL.AUTOMATION_LIST
    );

    if (automations) {
      return { status: 200, data: automations.automations };
    }

    return { status: 404, data: [] };
  } catch (error) {
    console.error("❌ Error in getAllAutomations:", error);
    return { status: 500, data: [] };
  }
};

export const getAutomationInfo = async (id: string) => {
  await onCurrentUser();
  try {
    // Use cache with 10-minute TTL for individual automation
    const automation = await getOrSetCache(
      cacheKey(CACHE_KEYS.AUTOMATION, id),
      () => findAutomation(id),
      CACHE_TTL.AUTOMATION_DATA
    );
    
    if (automation) return { status: 200, data: automation };

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};

export const updateAutomationName = async (
  automationId: string,
  data: {
    name?: string;
    active?: boolean;
    automation?: string;
  }
) => {
  const user = await onCurrentUser();
  const userId = user.id; // Extract to prevent closure capture
  
  try {
    const update = await updateAutomation(automationId, data);
    if (update) {
      // Invalidate cache for this automation
      await invalidateAutomationCache(automationId, userId);
      return { status: 200, data: "Automation successfully updated" };
    }
    return { status: 404, data: "Oops! could not find automation" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const activateAutomation = async (id: string, state: boolean) => {
  const user = await onCurrentUser();
  const userId = user.id; // Extract to prevent closure capture
  
  try {
    const update = await updateAutomation(id, { active: state });
    if (update) {
      // Invalidate cache when activation state changes
      await invalidateAutomationCache(id, userId);
      return {
        status: 200,
        data: `Automation ${state ? "activated" : "disabled"}`,
      };
    }
    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string
) => {
  await onCurrentUser();
  try {
    const create = await addListener(automationId, listener, prompt, reply);
    if (create) {
      return { status: 200, data: "Listener saved" };
    }
    return { status: 404, data: "Oops! could not save listener" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveTrigger = async (automationId: string, trigger: string[]) => {
  await onCurrentUser();
  try {
    const create = await addTrigger(automationId, trigger);
    if (create) {
      return { status: 200, data: "Trigger saved" };
    }
    return { status: 404, data: "Oops! could not save trigger" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};
export const saveKeyword = async (automationId: string, keyword: string) => {
  await onCurrentUser();
  try {
    const create = await addKeyword(automationId, keyword);
    if (create) {
      return { status: 200, data: "Keyword saved" };
    }
    return { status: 404, data: "Oops! could not save keywords" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const deleteKeyword = async (id: string) => {
  await onCurrentUser();
  try {
    const deleted = await deleteKeywordQuery(id);
    if (deleted) {
      return { status: 200, data: "Keyword deleted" };
    }
    return { status: 404, data: "Oops! could not delete keyword" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const getProfilePosts = async () => {
  const user = await onCurrentUser();
  const userId = user.id; // Extract to prevent closure capture
  
  try {
    const profile = await findUser(userId);
    const posts = await fetch(
      `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,media_type,timestamp&limit=10&access_token=${profile?.integrations[0].token}`
    );
    const parsed = await posts.json();
    if (parsed) return { status: 200, data: parsed };
    console.log(" Error in getting posts");
    return { status: 404 };
  } catch (error) {
    console.log(" server side Error in getting posts ", error);
    return { status: 500 };
  }
};

export const savePosts = async (
  autmationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[]
) => {
  await onCurrentUser();
  try {
    const create = await addPost(autmationId, posts);

    if (create) return { status: 200, data: "Posts attached" };

    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const deleteAutomation = async (id: string) => {
  await onCurrentUser();
  try {
    const deleted = await deleteAutomationQuery(id);
    if (deleted) {
      return { status: 200, data: "Automation deleted successfully" };
    }
    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};
