import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

const USER_PROFILE_INCLUDE = {
  subscription: true,
  integrations: {
    select: {
      id: true,
      name: true,
      expiresAt: true,
      instagramId: true,
      createdAt: true,
    },
  },
  memberships: {
    include: {
      workspace: {
        select: { id: true, name: true, organizationId: true },
      },
    },
  },
} as const;

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: USER_PROFILE_INCLUDE,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async getProfileByClerkId(clerkId: string) {
    const user = await this.prisma.user.findUnique({
      where: { clerkId },
      include: USER_PROFILE_INCLUDE,
    });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  async ensure(clerkId: string, userId: string, firstname: string, lastname: string, email: string) {
    const user = await this.prisma.user.upsert({
      where: { clerkId },
      create: {
        id: userId,
        clerkId,
        firstname,
        lastname,
        email,
        subscription: { create: {} },
      },
      update: {
        firstname,
        lastname,
        email,
      },
      select: { id: true, firstname: true, lastname: true, email: true, clerkId: true },
    });

    const membership = await this.prisma.membership.findFirst({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!membership) {
      await this.prisma.organization.create({
        data: {
          name: "My Organization",
          ownerId: user.id,
          workspaces: {
            create: {
              name: "Default",
              memberships: { create: { userId: user.id, role: "OWNER" } },
            },
          },
        },
      });
    }

    return user;
  }

  async create(clerkId: string, firstname: string, lastname: string, email: string) {
    return this.prisma.user.create({
      data: {
        clerkId,
        firstname,
        lastname,
        email,
        subscription: { create: {} },
      },
      select: { firstname: true, lastname: true, id: true },
    });
  }

  async updateSubscription(
    userId: string,
    data: { customerId: string; plan: "FREE" | "PRO" },
  ) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        subscription: {
          update: {
            customerId: data.customerId,
            plan: data.plan,
          },
        },
      },
    });
  }

  async resolveWorkspace(userId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { userId },
      select: { workspaceId: true, role: true },
      orderBy: { createdAt: "asc" },
    });
    if (!membership) {
      throw new NotFoundException("User has no workspace membership");
    }
    return membership;
  }
}
