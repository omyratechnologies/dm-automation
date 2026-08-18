import { NotFoundException } from "@nestjs/common";
import { TenancyService } from "./tenancy.service";

function makeFixture(user: { id: string; email: string; clerkId: string } | null) {
  const prisma = {
    user: {
      findUnique: jest.fn().mockResolvedValue(user),
      delete: jest.fn().mockResolvedValue(user),
    },
    organization: {
      deleteMany: jest.fn().mockResolvedValue({ count: user ? 1 : 0 }),
    },
    $transaction: jest.fn(async (operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  };
  const service = new TenancyService(prisma as never, { log: jest.fn() } as never);
  return { service, prisma };
}

describe("TenancyService.deleteAccount", () => {
  it("deletes owned organizations before deleting the local user", async () => {
    const f = makeFixture({
      id: "user-1",
      email: "owner@example.com",
      clerkId: "clerk-1",
    });

    await expect(f.service.deleteAccount("user-1")).resolves.toEqual({ ok: true });

    expect(f.prisma.organization.deleteMany).toHaveBeenCalledWith({
      where: { ownerId: "user-1" },
    });
    expect(f.prisma.user.delete).toHaveBeenCalledWith({
      where: { id: "user-1" },
    });
    expect(f.prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("rejects deletion for an unknown local user", async () => {
    const f = makeFixture(null);

    await expect(f.service.deleteAccount("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(f.prisma.$transaction).not.toHaveBeenCalled();
  });
});
