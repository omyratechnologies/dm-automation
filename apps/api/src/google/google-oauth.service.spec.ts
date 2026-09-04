import axios from "axios";
import { GoogleOAuthService } from "./google-oauth.service";
import { ProblemException } from "../common/problem-details";

jest.mock("axios");

function fixture() {
  const tx = {
    googleGrant: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn().mockResolvedValue({ id: "grant-1" }) },
    googleBinding: {
      findUnique: jest.fn(),
      upsert: jest.fn().mockResolvedValue({ id: "binding-1", workspaceId: "workspace-1", version: 1 }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    googleWatchChannel: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
  };
  const prisma = {
    membership: { findUnique: jest.fn().mockResolvedValue({ id: "member-1", role: "ADMIN", status: "ACTIVE" }) },
    googleOAuthSession: { create: jest.fn().mockResolvedValue({}), findUnique: jest.fn(), updateMany: jest.fn() },
    workspace: { findUnique: jest.fn().mockResolvedValue({ organizationId: "organization-1" }) },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };
  const values: Record<string, unknown> = {
    FEATURE_GOOGLE_OAUTH: true,
    FEATURE_GOOGLE_CALENDAR: true,
    FEATURE_GOOGLE_SHEETS: true,
    GOOGLE_CLIENT_ID: "client-id",
    GOOGLE_CLIENT_SECRET: "client-secret",
    GOOGLE_OAUTH_REDIRECT_URI: "https://app.example.invalid/v1/google/oauth/callback",
  };
  const config = { get: jest.fn((key: string) => values[key]), getOrThrow: jest.fn((key: string) => values[key]) };
  const crypto = { encrypt: jest.fn((value: string) => `encrypted:${value}`), decrypt: jest.fn() };
  const audit = { logInTransaction: jest.fn().mockResolvedValue({}) };
  return { service: new GoogleOAuthService(prisma as never, config as never, crypto as never, audit as never), prisma, tx, audit, crypto, values };
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

  it("allows an active Agent to authorize only their own Calendar", async () => {
    const f = fixture();
    f.prisma.membership.findUnique.mockResolvedValue({ id: "member-1", role: "AGENT", status: "ACTIVE" });

    await expect(f.service.start({ userId: "user-1", workspaceId: "workspace-1", membershipId: "member-1", ownership: "MEMBER", capabilities: ["CALENDAR"], returnPath: "/dashboard/workspace-1/integrations" })).resolves.toEqual(expect.objectContaining({ authorizationUrl: expect.stringContaining("accounts.google.com") }));
  });

  it("rejects inactive members and member-owned Sheets grants", async () => {
    const f = fixture();
    f.prisma.membership.findUnique.mockResolvedValueOnce({ id: "member-1", role: "AGENT", status: "INACTIVE" });
    await expect(f.service.start({ userId: "user-1", workspaceId: "workspace-1", membershipId: "member-1", ownership: "MEMBER", capabilities: ["CALENDAR"], returnPath: "/dashboard/workspace-1/integrations" })).rejects.toBeInstanceOf(ProblemException);

    f.prisma.membership.findUnique.mockResolvedValueOnce({ id: "member-1", role: "ADMIN", status: "ACTIVE" });
    await expect(f.service.start({ userId: "user-1", workspaceId: "workspace-1", membershipId: "member-1", ownership: "MEMBER", capabilities: ["SHEETS"], returnPath: "/dashboard/workspace-1/integrations" })).rejects.toBeInstanceOf(ProblemException);
  });

  it("rejects requests for deployment-disabled capabilities", async () => {
    const f = fixture();
    f.values.FEATURE_GOOGLE_CALENDAR = false;
    await expect(f.service.start({ userId: "user-1", workspaceId: "workspace-1", membershipId: "member-1", ownership: "MEMBER", capabilities: ["CALENDAR"], returnPath: "/dashboard/workspace-1/integrations" })).rejects.toBeInstanceOf(ProblemException);
  });

  it("never persists a protocol-relative OAuth return path", async () => {
    const f = fixture();
    await f.service.start({ userId: "user-1", workspaceId: "workspace-1", membershipId: "member-1", ownership: "MEMBER", capabilities: ["CALENDAR"], returnPath: "//attacker.example/collect" });
    expect(f.prisma.googleOAuthSession.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ returnPath: "/dashboard" }) }));
  });

  it("rejects replayed OAuth state before exchanging any token", async () => {
    const f = fixture();
    f.prisma.googleOAuthSession.findUnique.mockResolvedValue({ consumedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) });
    await expect(f.service.callback("state", "code")).rejects.toBeInstanceOf(ProblemException);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it("stores a completed customer grant, workspace binding and audit in one transaction", async () => {
    const f = fixture();
    f.prisma.googleOAuthSession.findUnique.mockResolvedValue({
      id: "session-1", userId: "user-1", workspaceId: "workspace-1", authorizedMembershipId: "member-1",
      consumedAt: null, expiresAt: new Date(Date.now() + 60_000), codeVerifierEncrypted: "encrypted:verifier",
      ownership: "MEMBER", capabilities: ["CALENDAR"], requestedScopes: ["openid", "email"],
      returnPath: "/dashboard/workspace-1/integrations",
    });
    f.prisma.googleOAuthSession.updateMany.mockResolvedValue({ count: 1 });
    f.crypto.decrypt.mockReturnValue("verifier");
    (axios.post as jest.Mock)
      .mockResolvedValueOnce({ data: { access_token: "access", refresh_token: "refresh", expires_in: 3600, scope: "openid email", id_token: "identity" } })
      .mockResolvedValueOnce({ data: { sub: "google-sub-1", email: "customer@example.com", aud: "client-id" } });

    await expect(f.service.callback("state", "code")).resolves.toEqual(expect.objectContaining({ bindingId: "binding-1" }));

    expect(f.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(f.tx.googleGrant.upsert).toHaveBeenCalled();
    expect(f.tx.googleBinding.upsert).toHaveBeenCalled();
    expect(f.audit.logInTransaction).toHaveBeenCalledWith(f.tx, expect.objectContaining({ action: "google.binding.connected", targetId: "binding-1" }));
  });

  it("lets a member disconnect only their own Calendar binding", async () => {
    const f = fixture();
    f.tx.googleBinding.findUnique.mockResolvedValue({
      id: "binding-1", ownership: "MEMBER", authorizedMembershipId: "member-1", version: 2,
      grant: { userId: "user-1" },
    });

    await expect((f.service.disconnectBinding as never as (input: Record<string, unknown>) => Promise<unknown>)({
      workspaceId: "workspace-1", organizationId: "organization-1", bindingId: "binding-1", expectedVersion: 2,
      actorUserId: "user-1", actorMembershipId: "member-1", actorRole: "AGENT",
    })).resolves.toEqual({ disconnected: true });

    expect(f.audit.logInTransaction).toHaveBeenCalledWith(f.tx, expect.objectContaining({ action: "google.binding.disconnected", targetId: "binding-1" }));
  });

  it("blocks an Agent from disconnecting another member's binding", async () => {
    const f = fixture();
    f.tx.googleBinding.findUnique.mockResolvedValue({
      id: "binding-2", ownership: "MEMBER", authorizedMembershipId: "member-2", version: 1,
      grant: { userId: "user-2" },
    });

    await expect((f.service.disconnectBinding as never as (input: Record<string, unknown>) => Promise<unknown>)({
      workspaceId: "workspace-1", organizationId: "organization-1", bindingId: "binding-2", expectedVersion: 1,
      actorUserId: "user-1", actorMembershipId: "member-1", actorRole: "AGENT",
    })).rejects.toBeInstanceOf(ProblemException);
    expect(f.tx.googleBinding.updateMany).not.toHaveBeenCalled();
  });

  it("reports safe provider readiness without exposing configuration values", () => {
    const f = fixture();
    expect(f.service.readiness()).toEqual({
      oauth: { available: true, status: "AVAILABLE" },
      calendar: { available: true, status: "AVAILABLE" },
      sheets: { available: true, status: "AVAILABLE" },
    });

    f.values.GOOGLE_CLIENT_SECRET = "";
    expect(f.service.readiness()).toEqual({
      oauth: { available: false, status: "ADMIN_SETUP_REQUIRED" },
      calendar: { available: false, status: "ADMIN_SETUP_REQUIRED" },
      sheets: { available: false, status: "ADMIN_SETUP_REQUIRED" },
    });
  });

  it("reports independently disabled Calendar and Sheets capabilities", () => {
    const f = fixture();
    f.values.FEATURE_GOOGLE_CALENDAR = false;
    f.values.FEATURE_GOOGLE_SHEETS = false;
    expect(f.service.readiness()).toEqual({
      oauth: { available: true, status: "AVAILABLE" },
      calendar: { available: false, status: "FEATURE_DISABLED" },
      sheets: { available: false, status: "FEATURE_DISABLED" },
    });
  });
});
