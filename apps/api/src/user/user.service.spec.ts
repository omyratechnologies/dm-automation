import type { ConfigService } from "@nestjs/config";
import { UserService } from "./user.service";

const profile = {
  id: "user-1",
  clerkId: "clerk-new",
  firstname: "Ada",
  lastname: "Lovelace",
  email: "ada@example.com",
};

function makeFixture() {
  const tx = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    membership: {
      findFirst: jest.fn(),
    },
    organization: {
      create: jest.fn(),
    },
  };
  const prisma = {
    user: { findUnique: jest.fn() },
    $transaction: jest.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const config = {
    getOrThrow: jest.fn().mockReturnValue("sk_test_example"),
  };
  const service = new UserService(
    prisma as never,
    config as unknown as ConfigService,
  );
  return { service, prisma, tx };
}

describe("UserService.ensure", () => {
  it("repairs an existing verified-email user after a Clerk instance change", async () => {
    const f = makeFixture();
    f.prisma.user.findUnique.mockResolvedValue(null);
    f.tx.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ ...profile, clerkId: "clerk-old" });
    f.tx.user.update.mockResolvedValue(profile);
    f.tx.membership.findFirst.mockResolvedValue(null);
    f.tx.organization.create.mockResolvedValue({ id: "org-1" });
    jest.spyOn(f.service as any, "getVerifiedClerkProfile").mockResolvedValue({
      email: profile.email,
      firstname: profile.firstname,
      lastname: profile.lastname,
    });

    await expect(
      f.service.ensure("clerk-new", "ignored", "ignored", "spoofed@example.com"),
    ).resolves.toEqual(profile);

    expect(f.tx.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        clerkId: "clerk-new",
        firstname: "Ada",
        lastname: "Lovelace",
        email: "ada@example.com",
      },
      select: expect.any(Object),
    });
    expect(f.tx.organization.create).toHaveBeenCalledWith({
      data: {
        name: "My Organization",
        ownerId: "user-1",
        workspaces: {
          create: {
            name: "Default",
            memberships: { create: { userId: "user-1", role: "OWNER" } },
          },
        },
      },
    });
  });

  it("does not create a second workspace when membership already exists", async () => {
    const f = makeFixture();
    f.prisma.user.findUnique.mockResolvedValue(profile);
    f.tx.user.findUnique.mockResolvedValue(profile);
    f.tx.user.update.mockResolvedValue(profile);
    f.tx.membership.findFirst.mockResolvedValue({ id: "membership-1" });

    await expect(
      f.service.ensure("clerk-new", "Ada", "Lovelace", profile.email),
    ).resolves.toEqual(profile);

    expect(f.tx.organization.create).not.toHaveBeenCalled();
  });
});
