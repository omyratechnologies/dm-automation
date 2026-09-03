import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClerkClient } from "@clerk/backend";
import { Prisma } from "@prisma/client";
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

const ENSURED_USER_SELECT = {
  id: true,
  firstname: true,
  lastname: true,
  email: true,
  clerkId: true,
} as const;

type VerifiedClerkProfile = {
  email: string;
  firstname: string;
  lastname: string;
};

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
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

  async ensure(
    clerkId: string,
    firstname: string,
    lastname: string,
    email: string,
  ) {
    const existing = await this.prisma.user.findUnique({
      where: { clerkId },
      select: ENSURED_USER_SELECT,
    });

    // The submitted profile is a convenience only. When the Clerk subject is
    // new (including an intentional Clerk instance migration), establish the
    // canonical email directly from Clerk before matching an existing row.
    const canonical = existing
      ? {
          email: existing.email,
          firstname: firstname.trim() || existing.firstname || "",
          lastname: lastname.trim() || existing.lastname || "",
        }
      : await this.getVerifiedClerkProfile(clerkId);

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          let user = await tx.user.findUnique({
            where: { clerkId },
            select: ENSURED_USER_SELECT,
          });

          if (!user) {
            const emailMatch = await tx.user.findUnique({
              where: { email: canonical.email },
              select: ENSURED_USER_SELECT,
            });
            user = emailMatch
              ? await tx.user.update({
                  where: { id: emailMatch.id },
                  data: { clerkId, ...canonical },
                  select: ENSURED_USER_SELECT,
                })
              : await tx.user.create({
                  data: {
                    clerkId,
                    ...canonical,
                    subscription: { create: {} },
                  },
                  select: ENSURED_USER_SELECT,
                });
          } else {
            user = await tx.user.update({
              where: { id: user.id },
              data: canonical,
              select: ENSURED_USER_SELECT,
            });
          }

          const membership = await tx.membership.findFirst({
            where: { userId: user.id, status: "ACTIVE" },
            select: { id: true },
          });
          if (!membership) {
            await tx.organization.create({
              data: {
                name: "My Organization",
                ownerId: user.id,
                workspaces: {
                  create: {
                    name: "Default",
                    memberships: {
                      create: { userId: user.id, role: "OWNER" },
                    },
                  },
                },
              },
            });
          }

          return user;
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        const code = (error as { code?: string }).code;
        if (["P2002", "P2034"].includes(code ?? "") && attempt < 3) continue;
        throw error;
      }
    }

    throw new ServiceUnavailableException({
      code: "IDENTITY_PROVISIONING_FAILED",
      message: "User provisioning could not be completed",
    });
  }

  private async getVerifiedClerkProfile(clerkId: string): Promise<VerifiedClerkProfile> {
    let clerkUser: Awaited<ReturnType<ReturnType<typeof createClerkClient>["users"]["getUser"]>>;
    try {
      const clerk = createClerkClient({
        secretKey: this.config.getOrThrow<string>("CLERK_SECRET_KEY"),
      });
      clerkUser = await clerk.users.getUser(clerkId);
    } catch {
      throw new ServiceUnavailableException({
        code: "IDENTITY_PROVIDER_UNAVAILABLE",
        message: "Identity verification is temporarily unavailable",
      });
    }

    const primaryEmail = clerkUser.emailAddresses.find(
      (candidate) => candidate.id === clerkUser.primaryEmailAddressId,
    );
    if (
      !primaryEmail ||
      primaryEmail.verification?.status !== "verified"
    ) {
      throw new ForbiddenException({
        code: "IDENTITY_CONFLICT",
        message: "A verified primary email is required",
      });
    }

    return {
      email: primaryEmail.emailAddress.trim().toLowerCase(),
      firstname: clerkUser.firstName?.trim() ?? "",
      lastname: clerkUser.lastName?.trim() ?? "",
    };
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
