import type { TriggerNode } from "@repo/shared";

/** Event shape the trigger matcher evaluates (subset of FlowRunJob.trigger). */
export interface TriggerEvent {
  source: "dm" | "comment" | "story_reply";
  text: string;
  postId?: string;
  commentId?: string;
}

/**
 * Keyword matching: exact = case-insensitive equals (trimmed),
 * contains = case-insensitive substring.
 */
export function matchText(
  text: string,
  keywords: string[],
  matchType: "exact" | "contains",
): boolean {
  const haystack = text.trim().toLowerCase();
  return keywords.some((kw) => {
    const needle = kw.trim().toLowerCase();
    if (!needle) return false;
    return matchType === "exact"
      ? haystack === needle
      : haystack.includes(needle);
  });
}

/** Does this trigger node fire for the given inbound event? */
export function triggerMatches(
  data: TriggerNode["data"],
  event: TriggerEvent,
): boolean {
  switch (data.kind) {
    case "keyword":
      return (
        event.source === "dm" &&
        matchText(event.text, data.keywords, data.matchType)
      );
    case "any_message":
      return event.source === "dm";
    case "comment":
      return (
        event.source === "comment" &&
        matchText(event.text, data.keywords, data.matchType) &&
        (data.postIds.length === 0 ||
          (!!event.postId && data.postIds.includes(event.postId)))
      );
    case "story_reply":
      return (
        event.source === "story_reply" &&
        (data.keywords.length === 0 ||
          matchText(event.text, data.keywords, data.matchType))
      );
  }
}
