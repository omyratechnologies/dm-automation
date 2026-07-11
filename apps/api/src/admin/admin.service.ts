import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { QUEUES } from "@repo/shared";
import type { WebhookEventJob } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @InjectQueue(QUEUES.WEBHOOK_EVENTS)
    private readonly webhookQueue: Queue<WebhookEventJob>,
  ) {}

  async listUsers(page = 1, limit = 10, search = "") {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: "insensitive" as const } },
            { firstname: { contains: search, mode: "insensitive" as const } },
            { lastname: { contains: search, mode: "insensitive" as const } },
            { clerkId: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {};

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          clerkId: true,
          email: true,
          firstname: true,
          lastname: true,
          createdAt: true,
          memberships: {
            select: {
              role: true,
              workspace: {
                select: {
                  id: true,
                  name: true,
                  organization: { select: { plan: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async getUserDetails(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        memberships: {
          include: {
            workspace: {
              include: {
                organization: true,
                igAccounts: {
                  select: {
                    id: true,
                    igUserId: true,
                    username: true,
                    status: true,
                    createdAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  async overrideSubscription(adminUserId: string, organizationId: string, plan: "FREE" | "PRO") {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: { plan },
    });

    // Write audit log entry
    this.audit.logAdminAction(
      adminUserId,
      "subscription_override",
      "Organization",
      organizationId,
      { previousPlan: org.plan, newPlan: plan },
      organizationId,
    );

    return updated;
  }

  async listWebhookEvents(page = 1, limit = 15, status?: string) {
    const skip = (page - 1) * limit;
    const where = status ? { status: status as any } : {};

    const [items, total] = await Promise.all([
      this.prisma.webhookEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { receivedAt: "desc" },
      }),
      this.prisma.webhookEvent.count({ where }),
    ]);

    return { items, total };
  }

  async retryWebhookEvent(adminUserId: string, webhookEventId: string) {
    const event = await this.prisma.webhookEvent.findUnique({
      where: { id: webhookEventId },
    });
    if (!event) {
      throw new NotFoundException("Webhook event not found");
    }

    // Reset status to RECEIVED
    const updated = await this.prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { status: "RECEIVED", error: null },
    });

    // Enqueue job back to BullMQ
    await this.webhookQueue.add("webhook", {
      webhookEventId: event.id,
    });

    // Write admin audit log
    if (event.igAccountId) {
      const igAcc = await this.prisma.igAccount.findUnique({
        where: { id: event.igAccountId },
        select: { workspace: { select: { organizationId: true } } },
      });
      if (igAcc) {
        this.audit.logAdminAction(
          adminUserId,
          "webhook_retry",
          "WebhookEvent",
          webhookEventId,
          { eventKey: event.eventKey },
          igAcc.workspace.organizationId,
        );
      }
    }

    return updated;
  }

  async getPlatformStats() {
    const [totalUsers, activeIgAccounts, totalWebhookEvents, failedWebhookEvents] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.igAccount.count({ where: { status: "ACTIVE" } }),
      this.prisma.webhookEvent.count(),
      this.prisma.webhookEvent.count({ where: { status: "FAILED" } }),
    ]);

    return {
      totalUsers,
      activeIgAccounts,
      totalWebhookEvents,
      failedWebhookEvents,
    };
  }
}
