import { HttpStatus } from "@nestjs/common";
import { lastValueFrom, of } from "rxjs";
import { IdempotencyInterceptor } from "./idempotency";
import { ProblemException } from "./problem-details";

function fixture(existing: Record<string, unknown>) {
  const prisma = {
    idempotencyRecord: {
      create: jest.fn().mockRejectedValue({ code: "P2002" }),
      findUnique: jest.fn().mockResolvedValue(existing),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      update: jest.fn().mockResolvedValue({}),
    },
  };
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) };
  const headers: Record<string, string> = {};
  const response = {
    statusCode: 201,
    status: jest.fn().mockReturnThis(),
    setHeader: jest.fn((name: string, value: string) => { headers[name] = value; }),
  };
  const request = {
    method: "POST",
    path: "/v1/workspaces/ws/leads",
    route: { path: "/v1/workspaces/:workspaceId/leads" },
    params: { workspaceId: "ws" },
    query: {},
    body: { name: "Ada" },
    user: { id: "00000000-0000-4000-8000-000000000001" },
    workspace: { id: "00000000-0000-4000-8000-000000000002" },
    header: jest.fn().mockReturnValue("retry-key"),
  };
  const context = { switchToHttp: () => ({ getRequest: () => request, getResponse: () => response }), getHandler: () => null, getClass: () => null };
  return { interceptor: new IdempotencyInterceptor(prisma as never, reflector as never), prisma, response, headers, context };
}

describe("IdempotencyInterceptor", () => {
  const identity = {
    requestHash: "different-until-overridden",
    status: "FAILED",
    updatedAt: new Date(),
  };

  it("reclaims a failed request and stores the successful retry", async () => {
    const f = fixture(identity);
    const request = f.context.switchToHttp().getRequest();
    const { createHash } = await import("crypto");
    f.prisma.idempotencyRecord.findUnique.mockResolvedValue({
      ...identity,
      requestHash: createHash("sha256").update(JSON.stringify({ params: request.params, query: request.query, body: request.body })).digest("hex"),
    });

    const stream = await f.interceptor.intercept(f.context as never, { handle: () => of({ id: "lead-1" }) } as never);
    await expect(lastValueFrom(stream)).resolves.toEqual({ id: "lead-1" });
    expect(f.prisma.idempotencyRecord.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "IN_PROGRESS" }) }));
    expect(f.prisma.idempotencyRecord.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "COMPLETED" }) }));
  });

  it("returns a stable conflict and Retry-After for an active request", async () => {
    const f = fixture({ ...identity, status: "IN_PROGRESS" });
    const request = f.context.switchToHttp().getRequest();
    const { createHash } = await import("crypto");
    f.prisma.idempotencyRecord.findUnique.mockResolvedValue({
      ...identity,
      status: "IN_PROGRESS",
      requestHash: createHash("sha256").update(JSON.stringify({ params: request.params, query: request.query, body: request.body })).digest("hex"),
    });
    f.prisma.idempotencyRecord.updateMany.mockResolvedValue({ count: 0 });

    await expect(f.interceptor.intercept(f.context as never, { handle: jest.fn() } as never)).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
    expect(f.response.setHeader).toHaveBeenCalledWith("Retry-After", "2");
  });
});
