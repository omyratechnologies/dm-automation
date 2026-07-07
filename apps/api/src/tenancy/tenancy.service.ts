import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";
import type { Role } from "@repo/shared";

@Injectable()
export class TenancyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstname: true,
        lastname: true,
        memberships: {
          select: {
            role: true,
            workspace: {
              select: {
                id: true,
                name: true,
                organization: { select: { id: true, name: true, plan: true } },
              },
            },
          },
        },
      },
    });
  }

  async createOrganization(userId: string, name: string) {
    const org = await this.prisma.organization.create({
      data: {
        name,
        ownerId: userId,
        workspaces: {
          create: {
            name: "Default",
            memberships: { create: { userId, role: "OWNER" } },
          },
        },
      },
      include: { workspaces: true },
    });
    this.audit.log({
      organizationId: org.id,
      actorUserId: userId,
      action: "org.created",
      targetType: "Organization",
      targetId: org.id,
    });
    return org;
  }

  async createWorkspace(userId: string, organizationId: string, name: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new NotFoundException("Organization not found");
    if (org.ownerId !== userId) {
      throw new ForbiddenException("Only the organization owner can add workspaces");
    }
    const ws = await this.prisma.workspace.create({
      data: {
        organizationId,
        name,
        memberships: { create: { userId, role: "OWNER" } },
      },
    });
    this.audit.log({
      organizationId,
      workspaceId: ws.id,
      actorUserId: userId,
      action: "workspace.created",
      targetType: "Workspace",
      targetId: ws.id,
    });
    return ws;
  }

  async listMembers(workspaceId: string) {
    return this.prisma.membership.findMany({
      where: { workspaceId },
      select: {
        id: true,
        role: true,
        createdAt: true,
        user: {
          select: { id: true, email: true, firstname: true, lastname: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async addMember(
    actorId: string,
    organizationId: string,
    workspaceId: string,
    email: string,
    role: Role,
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException(
        "No user with that email — they must sign up first",
      );
    }
    const membership = await this.prisma.membership.upsert({
      where: { userId_workspaceId: { userId: user.id, workspaceId } },
      create: { userId: user.id, workspaceId, role },
      update: { role },
    });
    this.audit.log({
      organizationId,
      workspaceId,
      actorUserId: actorId,
      action: "member.added",
      targetType: "Membership",
      targetId: membership.id,
      meta: { email, role },
    });
    return membership;
  }

  async updateMemberRole(
    actorId: string,
    organizationId: string,
    workspaceId: string,
    membershipId: string,
    role: Role,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, workspaceId },
    });
    if (!membership) throw new NotFoundException("Member not found");
    const updated = await this.prisma.membership.update({
      where: { id: membershipId },
      data: { role },
    });
    this.audit.log({
      organizationId,
      workspaceId,
      actorUserId: actorId,
      action: "member.role_changed",
      targetType: "Membership",
      targetId: membershipId,
      meta: { role },
    });
    return updated;
  }

  async updateProfile(
    userId: string,
    data: { firstname?: string; lastname?: string; email?: string },
  ) {
    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          firstname: true,
          lastname: true,
        },
      });
      return user;
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        const target = (err.meta?.target as string[])?.[0] ?? "field";
        throw new ConflictException(`${target} already taken`);
      }
      throw err;
    }
  }

  async deleteAccount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, clerkId: true },
    });
    if (!user) throw new NotFoundException("User not found");

    await this.prisma.user.delete({ where: { id: userId } });

    return { ok: true };
  }

  async removeMember(
    actorId: string,
    organizationId: string,
    workspaceId: string,
    membershipId: string,
  ) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, workspaceId },
    });
    if (!membership) throw new NotFoundException("Member not found");
    if (membership.role === "OWNER") {
      throw new ForbiddenException("Cannot remove the workspace owner");
    }
    await this.prisma.membership.delete({ where: { id: membershipId } });
    this.audit.log({
      organizationId,
      workspaceId,
      actorUserId: actorId,
      action: "member.removed",
      targetType: "Membership",
      targetId: membershipId,
    });
    return { ok: true };
  }
}
