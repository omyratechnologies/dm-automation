import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios, { AxiosInstance } from "axios";
import { mapGraphError } from "./errors";

/** Instagram Business Login authorization-code exchange endpoint. */
const IG_OAUTH_TOKEN_URL = "https://api.instagram.com/oauth/access_token";

export interface SendDmOptions {
  quickReplies?: string[];
  /** Send with the HUMAN_AGENT message tag (7-day human agent window). */
  humanAgent?: boolean;
}

export interface SendResult {
  recipientId?: string;
  messageId?: string;
}

export interface ShortLivedToken {
  accessToken: string;
  userId?: string;
  permissions?: unknown;
}

export interface LongLivedToken {
  accessToken: string;
  tokenType?: string;
  /** Seconds until expiry (typically ~60 days). */
  expiresIn?: number;
}

export interface IgMe {
  userId?: string;
  username?: string;
  accountType?: string;
}

export interface IgUserProfile {
  name?: string;
  username?: string;
  profilePic?: string;
  followerCount?: number;
  isUserFollowBusiness?: boolean;
  isBusinessFollowUser?: boolean;
}

/**
 * Thin axios client for the Instagram Graph API (Instagram Business Login
 * flavor — graph.instagram.com). All errors are mapped to RateLimitedError
 * (Meta codes 4/17/613, subcode 2534022, HTTP 429) or IgApiError.
 */
@Injectable()
export class IgGraphClient {
  private readonly logger = new Logger(IgGraphClient.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly appId: string;
  private readonly appSecret: string;

  constructor(config: ConfigService) {
    this.baseUrl = config
      .getOrThrow<string>("INSTAGRAM_GRAPH_URL")
      .replace(/\/$/, "");
    this.appId = config.get<string>("INSTAGRAM_APP_ID") ?? "";
    this.appSecret = config.get<string>("INSTAGRAM_APP_SECRET") ?? "";
    this.http = axios.create({ timeout: 15_000 });
  }

  /** POST {graph}/{igUserId}/messages — standard DM (optionally HUMAN_AGENT tagged). */
  async sendDm(
    igUserId: string,
    recipientIgUserId: string,
    text: string,
    token: string,
    opts: SendDmOptions = {},
  ): Promise<SendResult> {
    const body: Record<string, unknown> = {
      recipient: { id: recipientIgUserId },
      message: this.buildMessage(text, opts.quickReplies),
    };
    if (opts.humanAgent) {
      body.messaging_type = "MESSAGE_TAG";
      body.tag = "HUMAN_AGENT";
    }
    return this.postMessages(igUserId, body, token);
  }

  /** POST {graph}/{igUserId}/messages with recipient.comment_id — private reply to a comment. */
  async privateReplyToComment(
    igUserId: string,
    commentId: string,
    text: string,
    token: string,
  ): Promise<SendResult> {
    return this.postMessages(
      igUserId,
      { recipient: { comment_id: commentId }, message: { text } },
      token,
    );
  }

  /** Exchange an authorization code for a short-lived token (Instagram Business Login). */
  async exchangeCodeForToken(
    code: string,
    redirectUri: string,
  ): Promise<ShortLivedToken> {
    try {
      const form = new URLSearchParams();
      form.append("client_id", this.appId);
      form.append("client_secret", this.appSecret);
      form.append("grant_type", "authorization_code");
      form.append("redirect_uri", redirectUri);
      form.append("code", code);

      const res = await this.http.post(IG_OAUTH_TOKEN_URL, form, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      // Business Login may return { data: [ {...} ] } or a flat object.
      const payload = Array.isArray(res.data?.data)
        ? res.data.data[0]
        : res.data;
      if (!payload?.access_token) {
        throw new Error("No access token in Instagram OAuth response");
      }
      return {
        accessToken: String(payload.access_token),
        userId:
          payload.user_id !== undefined ? String(payload.user_id) : undefined,
        permissions: payload.permissions,
      };
    } catch (err) {
      throw mapGraphError(err);
    }
  }

  /** GET {graph}/access_token?grant_type=ig_exchange_token — 60-day token. */
  async getLongLivedToken(shortToken: string): Promise<LongLivedToken> {
    try {
      const res = await this.http.get(`${this.baseUrl}/access_token`, {
        params: {
          grant_type: "ig_exchange_token",
          client_secret: this.appSecret,
          access_token: shortToken,
        },
      });
      return {
        accessToken: String(res.data.access_token),
        tokenType: res.data.token_type,
        expiresIn:
          typeof res.data.expires_in === "number"
            ? res.data.expires_in
            : undefined,
      };
    } catch (err) {
      throw mapGraphError(err);
    }
  }

  /** GET {graph}/refresh_access_token?grant_type=ig_refresh_token. */
  async refreshLongLivedToken(token: string): Promise<LongLivedToken> {
    try {
      const res = await this.http.get(`${this.baseUrl}/refresh_access_token`, {
        params: { grant_type: "ig_refresh_token", access_token: token },
      });
      return {
        accessToken: String(res.data.access_token),
        tokenType: res.data.token_type,
        expiresIn:
          typeof res.data.expires_in === "number"
            ? res.data.expires_in
            : undefined,
      };
    } catch (err) {
      throw mapGraphError(err);
    }
  }

  /** Lightweight connectivity check — fetches the API root. */
  async ping(): Promise<void> {
    await this.http.get(`${this.baseUrl}/me`, {
      params: { fields: "id", access_token: "ping" },
      timeout: 5000,
    });
  }

  /**
   * POST {graph}/{igUserId}/subscribed_apps — subscribe to webhook fields
   * so Meta sends event notifications for this IG account.
   */
  async subscribeToWebhooks(igUserId: string, token: string): Promise<void> {
    try {
      await this.http.post(
        `${this.baseUrl}/${igUserId}/subscribed_apps`,
        null,
        {
          params: {
            subscribed_fields: "messages,comments,story_replies",
            access_token: token,
          },
        },
      );
      this.logger.log(`Subscribed to webhooks for IG user ${igUserId}`);
    } catch (err) {
      this.logger.warn(
        `Webhook subscription failed for ${igUserId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** GET {graph}/me/media — fetch recent media posts. */
  async getMedia(
    token: string,
    limit = 10,
  ): Promise<{ data: { id: string; caption?: string; media_url?: string; media_type?: string; timestamp?: string }[] }> {
    try {
      const res = await this.http.get(`${this.baseUrl}/me/media`, {
        params: {
          fields: "id,caption,media_url,media_type,timestamp",
          limit,
          access_token: token,
        },
      });
      return res.data;
    } catch (err) {
      throw mapGraphError(err);
    }
  }

  /** GET {graph}/{igsid} — fetch user profile with follow status. */
  async getUserProfile(
    igsid: string,
    token: string,
  ): Promise<IgUserProfile> {
    try {
      const res = await this.http.get(`${this.baseUrl}/${igsid}`, {
        params: {
          fields: "name,username,profile_pic,follower_count,is_user_follow_business,is_business_follow_user",
          access_token: token,
        },
      });
      return {
        name: res.data.name,
        username: res.data.username,
        profilePic: res.data.profile_pic,
        followerCount: res.data.follower_count,
        isUserFollowBusiness: res.data.is_user_follow_business,
        isBusinessFollowUser: res.data.is_business_follow_user,
      };
    } catch (err) {
      throw mapGraphError(err);
    }
  }

  /** GET {graph}/me — resolve the connected IG professional account. */
  async getMe(token: string): Promise<IgMe> {
    try {
      const res = await this.http.get(`${this.baseUrl}/me`, {
        params: {
          fields: "user_id,username,account_type",
          access_token: token,
        },
      });
      return {
        userId:
          res.data.user_id !== undefined
            ? String(res.data.user_id)
            : res.data.id !== undefined
              ? String(res.data.id)
              : undefined,
        username: res.data.username,
        accountType: res.data.account_type,
      };
    } catch (err) {
      throw mapGraphError(err);
    }
  }

  private buildMessage(text: string, quickReplies?: string[]) {
    const message: Record<string, unknown> = { text };
    if (quickReplies?.length) {
      message.quick_replies = quickReplies.map((title) => ({
        content_type: "text",
        title,
        payload: title,
      }));
    }
    return message;
  }

  private async postMessages(
    igUserId: string,
    body: Record<string, unknown>,
    token: string,
  ): Promise<SendResult> {
    try {
      const res = await this.http.post(
        `${this.baseUrl}/${igUserId}/messages`,
        body,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      return {
        recipientId:
          res.data?.recipient_id !== undefined
            ? String(res.data.recipient_id)
            : undefined,
        messageId:
          res.data?.message_id !== undefined
            ? String(res.data.message_id)
            : undefined,
      };
    } catch (err) {
      const mapped = mapGraphError(err);
      this.logger.warn(`IG send failed for ${igUserId}: ${mapped.message}`);
      throw mapped;
    }
  }
}
