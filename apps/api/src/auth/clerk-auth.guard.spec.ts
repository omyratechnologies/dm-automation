import { UnauthorizedException } from "@nestjs/common";
import { verifyToken } from "@clerk/backend";
import { ClerkAuthGuard } from "./clerk-auth.guard";

jest.mock("@clerk/backend", () => ({ verifyToken: jest.fn() }));

const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

function makeFixture(method: string, path: string) {
  const request = {
    method,
    path,
    headers: { authorization: "Bearer token" },
  } as Record<string, unknown>;
  const prisma = {
    user: { findUnique: jest.fn().mockResolvedValue(null) },
  };
  const guard = new ClerkAuthGuard(
    { getOrThrow: jest.fn().mockReturnValue("sk_test_example"), get: jest.fn() } as never,
    prisma as never,
    { getAllAndOverride: jest.fn().mockReturnValue(false) } as never,
    {} as never,
  );
  const context = {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  };
  return { guard, context, request };
}

describe("ClerkAuthGuard unprovisioned identities", () => {
  beforeEach(() => {
    mockedVerifyToken.mockResolvedValue({ sub: "clerk-new" } as never);
  });

  it("allows the canonical ensure endpoint to provision the local user", async () => {
    const f = makeFixture("POST", "/v1/me/ensure");

    await expect(f.guard.canActivate(f.context as never)).resolves.toBe(true);
    expect((f.request.user as { clerkId: string }).clerkId).toBe("clerk-new");
  });

  it("rejects workspace mutations until the local user is provisioned", async () => {
    const f = makeFixture("POST", "/v1/orgs");

    await expect(f.guard.canActivate(f.context as never)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
