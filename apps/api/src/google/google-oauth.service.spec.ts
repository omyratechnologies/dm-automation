import axios from "axios";
import { GoogleOAuthService } from "./google-oauth.service";
import { ProblemException } from "../common/problem-details";

jest.mock("axios");

function fixture() {
  const prisma = {
    membership: { findUnique: jest.fn().mockResolvedValue({ id: "member-1", role: "ADMIN" }) },
    googleOAuthSession: { create: jest.fn().mockResolvedValue({}), findUnique: jest.fn(), updateMany: jest.fn() },
  };
  const values: Record<string, unknown> = {
    FEATURE_GOOGLE_OAUTH: true,
    GOOGLE_CLIENT_ID: "client-id",
    GOOGLE_CLIENT_SECRET: "client-secret",
    GOOGLE_OAUTH_REDIRECT_URI: "https://app.example.invalid/v1/google/oauth/callback",
  };
  const config = { get: jest.fn((key: string) => values[key]), getOrThrow: jest.fn((key: string) => values[key]) };
  const crypto = { encrypt: jest.fn((value: string) => `encrypted:${value}`), decrypt: jest.fn() };
  return { service: new GoogleOAuthService(prisma as never, config as never, crypto as never), prisma };
}

describe("GoogleOAuthService", () => {
  beforeEach(() => jest.clearAllMocks());

  it("uses PKCE, offline access, and least-privilege per-file Sheets scope", async () => {
    const f = fixture();
    const result = await f.service.start({ userId: "user-1", workspaceId: "workspace-1", membershipId: "member-1", ownership: "WORKSPACE", capabilities: ["SHEETS"], returnPath: "/dashboard/workspace-1/integrations" });
    const url = new URL(result.authorizationUrl);
    const scopes = url.searchParams.get("scope")?.split(" ") ?? [];
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("access_type")).toBe("offline");
    expect(scopes).toContain("https://www.googleapis.com/auth/drive.file");
    expect(scopes).not.toContain("https://www.googleapis.com/auth/spreadsheets");
    expect(f.prisma.googleOAuthSession.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ codeVerifierEncrypted: expect.stringMatching(/^encrypted:/) }) }));
  });

  it("rejects replayed OAuth state before exchanging any token", async () => {
    const f = fixture();
    f.prisma.googleOAuthSession.findUnique.mockResolvedValue({ consumedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    await expect(f.service.callback("state", "code")).rejects.toBeInstanceOf(ProblemException);
    expect(axios.post).not.toHaveBeenCalled();
  });
});
