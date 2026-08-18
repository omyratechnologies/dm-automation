import axios from "axios";
import { IgGraphClient } from "./ig-graph.client";

jest.mock("axios");

describe("IgGraphClient", () => {
  const mockConfig = (overrides: Record<string, string> = {}) => ({
    getOrThrow: jest.fn((key: string) => {
      if (key === "INSTAGRAM_GRAPH_URL") return "https://graph.instagram.com/v25.0";
      throw new Error(`Missing: ${key}`);
    }),
    get: jest.fn((key: string) => {
      const m: Record<string, string> = {
        INSTAGRAM_APP_ID: "app-123",
        INSTAGRAM_APP_SECRET: "secret-xyz",
        ...overrides,
      };
      return m[key] ?? undefined;
    }),
  });

  const mockHttpPost = jest.fn();
  const mockHttpGet = jest.fn();
  const mockHttpDelete = jest.fn();
  (axios.create as jest.Mock).mockReturnValue({
    post: mockHttpPost,
    get: mockHttpGet,
    delete: mockHttpDelete,
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("sendDm", () => {
    it("sends a DM with the correct payload", async () => {
      mockHttpPost.mockResolvedValue({
        data: { recipient_id: "ig-rec", message_id: "mid-1" },
      });
      const client = new IgGraphClient(mockConfig() as never);

      const result = await client.sendDm(
        "ig-biz", "ig-rec", "hello", "tok-1",
      );

      expect(result).toEqual({ recipientId: "ig-rec", messageId: "mid-1" });
      expect(mockHttpPost).toHaveBeenCalledWith(
        "https://graph.instagram.com/v25.0/ig-biz/messages",
        expect.objectContaining({
          recipient: { id: "ig-rec" },
          message: { text: "hello" },
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: "Bearer tok-1" }),
        }),
      );
    });

    it("adds the Instagram HUMAN_AGENT tag without Messenger-only fields", async () => {
      mockHttpPost.mockResolvedValue({ data: { message_id: "mid-2" } });
      const client = new IgGraphClient(mockConfig() as never);

      await client.sendDm("ig-biz", "ig-rec", "hi", "tok-1", {
        humanAgent: true,
      });

      expect(mockHttpPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tag: "HUMAN_AGENT",
        }),
        expect.any(Object),
      );
      expect(mockHttpPost.mock.calls[0][1]).not.toHaveProperty(
        "messaging_type",
      );
    });

    it("includes quick_replies when provided", async () => {
      mockHttpPost.mockResolvedValue({ data: { message_id: "mid-3" } });
      const client = new IgGraphClient(mockConfig() as never);

      await client.sendDm("ig-biz", "ig-rec", "choose", "tok-1", {
        quickReplies: ["Yes", "No"],
      });

      expect(mockHttpPost).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          message: expect.objectContaining({
            quick_replies: [
              { content_type: "text", title: "Yes", payload: "Yes" },
              { content_type: "text", title: "No", payload: "No" },
            ],
          }),
        }),
        expect.any(Object),
      );
    });

    it("throws mapped error on API failure", async () => {
      mockHttpPost.mockRejectedValue({
        response: { status: 429, data: { error: { code: 4 } } },
      });
      const client = new IgGraphClient(mockConfig() as never);

      await expect(
        client.sendDm("ig-biz", "ig-rec", "hello", "tok-1"),
      ).rejects.toThrow("Instagram API request failed");
    });
  });

  describe("privateReplyToComment", () => {
    it("sends a private reply with comment_id", async () => {
      mockHttpPost.mockResolvedValue({
        data: { recipient_id: "ig-rec", message_id: "mid-c" },
      });
      const client = new IgGraphClient(mockConfig() as never);

      const result = await client.privateReplyToComment(
        "ig-biz", "cmt-1", "thanks", "tok-1",
      );

      expect(result).toEqual({ recipientId: "ig-rec", messageId: "mid-c" });
      expect(mockHttpPost).toHaveBeenCalledWith(
        expect.stringContaining("/ig-biz/messages"),
        expect.objectContaining({
          recipient: { comment_id: "cmt-1" },
          message: { text: "thanks" },
        }),
        expect.any(Object),
      );
    });
  });

  describe("exchangeCodeForToken", () => {
    it("exchanges code for short-lived token", async () => {
      mockHttpPost.mockResolvedValue({
        data: { access_token: "short-tok", user_id: "123" },
      });
      const client = new IgGraphClient(mockConfig() as never);

      const result = await client.exchangeCodeForToken("code-1", "https://app.com/cb");

      expect(result).toEqual({ accessToken: "short-tok", userId: "123" });
      expect(mockHttpPost).toHaveBeenCalledWith(
        "https://api.instagram.com/oauth/access_token",
        expect.any(URLSearchParams),
        expect.any(Object),
      );
    });

    it("throws when no access_token in response", async () => {
      mockHttpPost.mockResolvedValue({ data: { user_id: "123" } });
      const client = new IgGraphClient(mockConfig() as never);

      await expect(
        client.exchangeCodeForToken("code-1", "https://app.com/cb"),
      ).rejects.toThrow("No access token");
    });
  });

  describe("token management", () => {
    it("gets long-lived token", async () => {
      mockHttpGet.mockResolvedValue({
        data: { access_token: "long-tok", expires_in: 5_184_000 },
      });
      const client = new IgGraphClient(mockConfig() as never);

      const result = await client.getLongLivedToken("short-tok");

      expect(result).toEqual({ accessToken: "long-tok", expiresIn: 5_184_000 });
      expect(mockHttpGet).toHaveBeenCalledWith(
        "https://graph.instagram.com/v25.0/access_token",
        expect.objectContaining({
          headers: { Authorization: "Bearer short-tok" },
          params: expect.not.objectContaining({ access_token: expect.anything() }),
        }),
      );
    });

    it("refreshes long-lived token", async () => {
      mockHttpGet.mockResolvedValue({
        data: { access_token: "refreshed-tok", expires_in: 5_184_000 },
      });
      const client = new IgGraphClient(mockConfig() as never);

      const result = await client.refreshLongLivedToken("old-tok");

      expect(result.accessToken).toBe("refreshed-tok");
      expect(mockHttpGet).toHaveBeenCalledWith(
        "https://graph.instagram.com/v25.0/refresh_access_token",
        expect.objectContaining({
          headers: { Authorization: "Bearer old-tok" },
          params: expect.not.objectContaining({ access_token: expect.anything() }),
        }),
      );
    });
  });

  describe("ping", () => {
    it("hits /me endpoint as connectivity check", async () => {
      mockHttpGet.mockResolvedValue({ data: { id: "123" } });
      const client = new IgGraphClient(mockConfig() as never);

      await expect(client.ping()).resolves.toBeUndefined();

      expect(mockHttpGet).toHaveBeenCalledWith(
        "https://graph.instagram.com/v25.0/me",
        expect.objectContaining({
          params: expect.objectContaining({ fields: "id" }),
          headers: { Authorization: "Bearer ping" },
        }),
      );
    });

    it("treats an HTTP error response as reachable (invalid ping token)", async () => {
      jest.spyOn(axios, "isAxiosError").mockReturnValue(true);
      mockHttpGet.mockRejectedValue({
        isAxiosError: true,
        response: { status: 400, data: { error: { code: 190 } } },
      });
      const client = new IgGraphClient(mockConfig() as never);

      await expect(client.ping()).resolves.toBeUndefined();
    });

    it("still fails on network-level errors", async () => {
      mockHttpGet.mockRejectedValue(new Error("socket hang up"));
      const client = new IgGraphClient(mockConfig() as never);

      await expect(client.ping()).rejects.toThrow();
    });
  });

  describe("subscribeToWebhooks", () => {
    it("subscribes only to documented Instagram webhook fields", async () => {
      mockHttpPost.mockResolvedValue({ data: { success: true } });
      const client = new IgGraphClient(mockConfig() as never);

      await client.subscribeToWebhooks("ig-biz", "tok-1");

      expect(mockHttpPost).toHaveBeenCalledWith(
        "https://graph.instagram.com/v25.0/ig-biz/subscribed_apps",
        null,
        expect.objectContaining({
          params: expect.objectContaining({
            subscribed_fields: "messages,message_reactions,comments",
          }),
          headers: { Authorization: "Bearer tok-1" },
        }),
      );
    });

    it("fails the connection when webhook subscription fails", async () => {
      mockHttpPost.mockRejectedValue(new Error("network error"));
      const client = new IgGraphClient(mockConfig() as never);

      await expect(
        client.subscribeToWebhooks("ig-biz", "tok-1"),
      ).rejects.toThrow();
    });
  });

  describe("unsubscribeFromWebhooks", () => {
    it("unsubscribes with bearer authentication", async () => {
      mockHttpDelete.mockResolvedValue({ data: { success: true } });
      const client = new IgGraphClient(mockConfig() as never);

      await client.unsubscribeFromWebhooks("ig-biz", "tok-1");

      expect(mockHttpDelete).toHaveBeenCalledWith(
        "https://graph.instagram.com/v25.0/ig-biz/subscribed_apps",
        { headers: { Authorization: "Bearer tok-1" } },
      );
    });
  });

  describe("getMe", () => {
    it("returns IG account info", async () => {
      mockHttpGet.mockResolvedValue({
        data: { user_id: "123", username: "my_biz", account_type: "BUSINESS" },
      });
      const client = new IgGraphClient(mockConfig() as never);

      const result = await client.getMe("tok-1");

      expect(result).toEqual({
        userId: "123",
        username: "my_biz",
        accountType: "BUSINESS",
      });
      expect(mockHttpGet).toHaveBeenCalledWith(
        "https://graph.instagram.com/v25.0/me",
        expect.objectContaining({
          headers: { Authorization: "Bearer tok-1" },
          params: expect.not.objectContaining({ access_token: expect.anything() }),
        }),
      );
    });
  });

  describe("authenticated reads", () => {
    it("uses bearer auth for media and engaging-user profile reads", async () => {
      mockHttpGet
        .mockResolvedValueOnce({ data: { data: [] } })
        .mockResolvedValueOnce({ data: { username: "contact" } });
      const client = new IgGraphClient(mockConfig() as never);

      await client.getMedia("tok-1");
      await client.getUserProfile("igsid-1", "tok-1");

      for (const call of mockHttpGet.mock.calls) {
        expect(call[1]).toEqual(
          expect.objectContaining({
            headers: { Authorization: "Bearer tok-1" },
            params: expect.not.objectContaining({ access_token: expect.anything() }),
          }),
        );
      }
      expect(mockHttpGet.mock.calls[1][1].params.fields).toBe(
        "name,username,profile_pic,is_user_follow_business",
      );
    });
  });
});
