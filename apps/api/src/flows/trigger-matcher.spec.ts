import type { TriggerNode } from "@repo/shared";
import { matchText, triggerMatches } from "./trigger-matcher";
import type { TriggerEvent } from "./trigger-matcher";

const dm = (text: string): TriggerEvent => ({ source: "dm", text });

describe("matchText", () => {
  it("exact: case-insensitive equals, trimmed", () => {
    expect(matchText("  PRICE ", ["price"], "exact")).toBe(true);
    expect(matchText("price please", ["price"], "exact")).toBe(false);
  });

  it("contains: case-insensitive substring", () => {
    expect(matchText("What's the PRICE?", ["price"], "contains")).toBe(true);
    expect(matchText("hello", ["price"], "contains")).toBe(false);
  });

  it("matches any keyword in the list", () => {
    expect(matchText("send info", ["price", "info"], "contains")).toBe(true);
  });

  it("ignores empty keywords", () => {
    expect(matchText("anything", [" ", ""], "contains")).toBe(false);
  });
});

describe("triggerMatches", () => {
  const keyword = (
    keywords: string[],
    matchType: "exact" | "contains" = "contains",
  ): TriggerNode["data"] => ({ kind: "keyword", keywords, matchType });

  it("keyword: matches dm text only", () => {
    expect(triggerMatches(keyword(["price"]), dm("price?"))).toBe(true);
    expect(triggerMatches(keyword(["price"]), dm("hello"))).toBe(false);
    expect(
      triggerMatches(keyword(["price"]), {
        source: "comment",
        text: "price?",
      }),
    ).toBe(false);
  });

  it("keyword exact vs contains", () => {
    expect(triggerMatches(keyword(["Price"], "exact"), dm(" price "))).toBe(
      true,
    );
    expect(triggerMatches(keyword(["price"], "exact"), dm("price?"))).toBe(
      false,
    );
  });

  it("any_message: any dm, never comments/stories", () => {
    const data: TriggerNode["data"] = { kind: "any_message" };
    expect(triggerMatches(data, dm("whatever"))).toBe(true);
    expect(triggerMatches(data, { source: "comment", text: "x" })).toBe(false);
    expect(triggerMatches(data, { source: "story_reply", text: "x" })).toBe(
      false,
    );
  });

  describe("comment", () => {
    const data = (postIds: string[]): TriggerNode["data"] => ({
      kind: "comment",
      keywords: ["win"],
      matchType: "contains",
      postIds,
    });

    it("keyword match with empty postIds matches any post", () => {
      expect(
        triggerMatches(data([]), {
          source: "comment",
          text: "I want to WIN",
          postId: "p9",
        }),
      ).toBe(true);
    });

    it("postIds filter must include the event postId", () => {
      const event: TriggerEvent = {
        source: "comment",
        text: "win!",
        postId: "p1",
      };
      expect(triggerMatches(data(["p1", "p2"]), event)).toBe(true);
      expect(triggerMatches(data(["p3"]), event)).toBe(false);
      expect(
        triggerMatches(data(["p1"]), { source: "comment", text: "win!" }),
      ).toBe(false); // no postId on event
    });

    it("does not fire for dm source", () => {
      expect(triggerMatches(data([]), dm("win"))).toBe(false);
    });
  });

  describe("story_reply", () => {
    it("empty keywords match every story reply", () => {
      const data: TriggerNode["data"] = {
        kind: "story_reply",
        keywords: [],
        matchType: "contains",
      };
      expect(
        triggerMatches(data, { source: "story_reply", text: "anything" }),
      ).toBe(true);
      expect(triggerMatches(data, dm("anything"))).toBe(false);
    });

    it("keywords filter story replies when present", () => {
      const data: TriggerNode["data"] = {
        kind: "story_reply",
        keywords: ["fire"],
        matchType: "contains",
      };
      expect(
        triggerMatches(data, { source: "story_reply", text: "fire emoji" }),
      ).toBe(true);
      expect(
        triggerMatches(data, { source: "story_reply", text: "meh" }),
      ).toBe(false);
    });
  });
});
