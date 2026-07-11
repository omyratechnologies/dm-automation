import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { AuditService } from "../audit/audit.service";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { PrismaService } from "../prisma/prisma.service";

const AUTOMATION_INCLUDE = {
  keywords: true,
  trigger: true,
  posts: true,
  listener: true,
  User: {
    select: {
      clerkId: true,
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
    },
  },
} as const;

@Injectable()
export class AutomationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async assertUserInWorkspace(
    userId: string,
    workspace: WorkspaceContext,
  ) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId_workspaceId: { userId, workspaceId: workspace.id } },
      select: { id: true },
    });
    if (!membership) {
      throw new NotFoundException("User not found in workspace");
    }
  }

  async list(userId: string, workspace: WorkspaceContext) {
    await this.assertUserInWorkspace(userId, workspace);
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        automations: {
          orderBy: { createdAt: "asc" },
          include: { keywords: true, listener: true },
        },
      },
    });
  }

  async create(userId: string, workspace: WorkspaceContext, id?: string) {
    await this.assertUserInWorkspace(userId, workspace);
    const result = await this.prisma.user.update({
      where: { id: userId },
      data: {
        automations: {
          create: {
            ...(id && { id }),
          },
        },
      },
      select: { automations: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    return result.automations[0];
  }

  async get(userId: string, id: string) {
    const automation = await this.prisma.automation.findUnique({
      where: { id },
      include: AUTOMATION_INCLUDE,
    });
    if (!automation || automation.userId !== userId) {
      throw new NotFoundException("Automation not found");
    }
    return {
      ...automation,
      User: automation.User
        ? {
            ...automation.User,
            integrations: automation.User.integrations,
          }
        : null,
    };
  }

  async update(
    userId: string,
    id: string,
    data: { name?: string; active?: boolean },
  ) {
    const automation = await this.prisma.automation.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!automation || automation.userId !== userId) {
      throw new NotFoundException("Automation not found");
    }

    return this.prisma.automation.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.active !== undefined && { active: data.active }),
      },
    });
  }

  async remove(userId: string, id: string) {
    const automation = await this.prisma.automation.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!automation || automation.userId !== userId) {
      throw new NotFoundException("Automation not found");
    }

    await this.prisma.automation.delete({ where: { id } });
    return { ok: true };
  }

  async saveListener(
    userId: string,
    automationId: string,
    data: { listener: "SMARTAI" | "MESSAGE"; prompt: string; reply?: string },
  ) {
    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
      select: { userId: true },
    });
    if (!automation || automation.userId !== userId) {
      throw new NotFoundException("Automation not found");
    }

    return this.prisma.automation.update({
      where: { id: automationId },
      data: {
        listener: {
          upsert: {
            create: {
              listener: data.listener,
              prompt: data.prompt,
              commentReply: data.reply,
            },
            update: {
              listener: data.listener,
              prompt: data.prompt,
              commentReply: data.reply,
            },
          },
        },
      },
    });
  }

  async saveTriggers(userId: string, automationId: string, triggers: string[]) {
    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
      select: { userId: true },
    });
    if (!automation || automation.userId !== userId) {
      throw new NotFoundException("Automation not found");
    }

    await this.prisma.trigger.deleteMany({ where: { automationId } });

    return this.prisma.automation.update({
      where: { id: automationId },
      data: {
        trigger: {
          createMany: {
            data: triggers.map((t) => ({ type: t })),
          },
        },
      },
    });
  }

  async addKeyword(userId: string, automationId: string, word: string) {
    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
      select: { userId: true },
    });
    if (!automation || automation.userId !== userId) {
      throw new NotFoundException("Automation not found");
    }

    try {
      return await this.prisma.automation.update({
        where: { id: automationId },
        data: {
          keywords: { create: { word } },
        },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        throw new ConflictException("Keyword already exists");
      }
      throw err;
    }
  }

  async removeKeyword(userId: string, keywordId: string) {
    const keyword = await this.prisma.keyword.findUnique({
      where: { id: keywordId },
      include: { Automation: { select: { userId: true } } },
    });
    if (
      !keyword ||
      keyword.Automation?.userId !== userId
    ) {
      throw new NotFoundException("Keyword not found");
    }

    await this.prisma.keyword.delete({ where: { id: keywordId } });
    return { ok: true };
  }

  async savePosts(
    userId: string,
    automationId: string,
    posts: { postid: string; caption?: string; media: string; mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM"; requireFollow?: boolean }[],
  ) {
    const automation = await this.prisma.automation.findUnique({
      where: { id: automationId },
      select: { userId: true },
    });
    if (!automation || automation.userId !== userId) {
      throw new NotFoundException("Automation not found");
    }

    // Clean up old post attachments first
    await this.prisma.post.deleteMany({ where: { automationId } });

    return this.prisma.automation.update({
      where: { id: automationId },
      data: {
        posts: { createMany: { data: posts.map(({ requireFollow, ...rest }) => ({ ...rest, requireFollow: requireFollow ?? false })) } },
      },
    });
  }
}
