import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { HUMAN_AGENT_WINDOW_MS } from "@repo/shared";
import { createHash, randomBytes } from "crypto";
import { AuditService } from "../audit/audit.service";
import { ProblemException } from "../common/problem-details";
import { OutboxService } from "../delivery/outbox.service";
import { MessagingService } from "../messaging/messaging.service";
import { PrismaService } from "../prisma/prisma.service";
import { LeadCommandService } from "../leads/lead-command.service";
import { CalendarService } from "./calendar.service";
import type { SendMeetingInvitationDto } from "./calendar.dto";

const DEFAULT_INVITATION = "I'd be happy to meet. Choose a time that works for you.";

@Injectable()
export class MeetingInvitationService {
  private readonly logger = new Logger(MeetingInvitationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messaging: MessagingService,
    private readonly outbox: OutboxService,
    private readonly audit: AuditService,
    private readonly config: ConfigService,
    private readonly leads: LeadCommandService,
    private readonly calendar: CalendarService,
  ) {}

  async prepare(
    workspaceId: string,
    membershipId: string,
    actorUserId: string,
    conversationId: string,
    correlationId: string,
  ) {
    const conversation = await this.findConversation(this.prisma, workspaceId, conversationId);
    await Promise.all([
      this.leads.ensureLeadForContact(conversation.contactId, {
        actorType: "USER",
        actorId: actorUserId,
        membershipId,
        correlationId,
      }, "INSTAGRAM"),
      this.calendar.ensureDefaultBookingSetup(workspaceId, membershipId),
    ]);
    return this.options(workspaceId, conversationId);
  }

  async options(workspaceId: string, conversationId: string) {
    const conversation = await this.findConversation(this.prisma, workspaceId, conversationId);
    const [leads, meetingTypes] = await Promise.all([
      this.prisma.lead.findMany({
        where: { workspaceId, contactId: conversation.contactId, recordState: "ACTIVE", outcome: "OPEN" },
        select: { id: true, pipeline: { select: { name: true } }, stage: { select: { name: true } } },
        orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      }),
      this.prisma.meetingType.findMany({
        where: {
          workspaceId,
          active: true,
          calendarPool: { status: "ACTIVE", members: { some: { enabled: true, membership: { status: "ACTIVE" }, googleBinding: { status: "ACTIVE", capabilities: { has: "CALENDAR" } } } } },
        },
        select: { id: true, name: true, durationMinutes: true, timezone: true },
        orderBy: [{ name: "asc" }, { id: "asc" }],
      }),
    ]);
    const messagingReason = this.messagingIneligibility(conversation.contact.lastInboundAt);
    return {
      messagingEligible: messagingReason === null,
      messagingReason,
      leads: leads.map((lead) => ({ id: lead.id, pipelineName: lead.pipeline.name, stageName: lead.stage.name })),
      meetingTypes,
    };
  }

  async send(
    workspaceId: string,
    organizationId: string,
    actorUserId: string,
    conversationId: string,
    input: Omit<SendMeetingInvitationDto, "conversationId">,
    correlationId: string,
  ) {
    const publicId = randomBytes(12).toString("base64url");
    const secret = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000);
    const origin = this.config.getOrThrow<string>("WEB_ORIGIN").split(",")[0]!.trim().replace(/\/$/, "");
    const bookingUrl = `${origin}/book/${publicId}#${secret}`;

    const result = await this.prisma.$transaction(async (tx) => {
      const conversation = await this.findConversation(tx, workspaceId, conversationId);
      const ineligible = this.messagingIneligibility(conversation.contact.lastInboundAt);
      if (ineligible) {
        throw new ProblemException(HttpStatus.CONFLICT, "MESSAGING_WINDOW_EXPIRED", "Meeting invitation unavailable", "A recent inbound Instagram message is required before sending an invitation");
      }
      const [lead, meetingType] = await Promise.all([
        tx.lead.findFirst({
          where: { id: input.leadId, workspaceId, contactId: conversation.contactId, recordState: "ACTIVE", outcome: "OPEN" },
          select: { id: true },
        }),
        tx.meetingType.findFirst({
          where: {
            id: input.meetingTypeId,
            workspaceId,
            active: true,
            calendarPool: { status: "ACTIVE", members: { some: { enabled: true, membership: { status: "ACTIVE" }, googleBinding: { status: "ACTIVE", capabilities: { has: "CALENDAR" } } } } },
          },
          select: { id: true, name: true, durationMinutes: true, timezone: true },
        }),
      ]);
      if (!lead) {
        throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "MEETING_INVITATION_LEAD_INVALID", "Lead unavailable", "Select an active lead belonging to this conversation");
      }
      if (!meetingType) {
        throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "MEETING_TYPE_UNAVAILABLE", "Meeting type unavailable", "Select an active meeting type with an eligible connected host");
      }
      const bookingLink = await tx.bookingLink.create({
        data: {
          publicId,
          workspaceId,
          leadId: lead.id,
          meetingTypeId: meetingType.id,
          secretHash: createHash("sha256").update(secret).digest("hex"),
          status: "ACTIVE",
          expiresAt,
        },
      });
      const introduction = input.introduction?.trim() || DEFAULT_INVITATION;
      const text = `${introduction}\n\nChoose your time: ${bookingUrl}\n\nThis booking link expires ${expiresAt.toLocaleDateString("en", { dateStyle: "medium", timeZone: "UTC" })}.`;
      const message = await this.messaging.createQueuedMessage(tx, {
        workspaceId,
        conversationId,
        text,
        source: "AGENT",
        sentById: actorUserId,
      });
      const queuedEvent = await this.outbox.append(tx, {
        type: "MessageQueued",
        organizationId,
        workspaceId,
        aggregateType: "Message",
        aggregateId: message.id,
        aggregateVersion: 1,
        actorType: "USER",
        actorId: actorUserId,
        correlationId,
        payload: { messageId: message.id },
      });
      await this.audit.logInTransaction(tx, {
        organizationId,
        workspaceId,
        actorUserId,
        correlationId,
        action: "meeting-invitation.sent",
        targetType: "BookingLink",
        targetId: bookingLink.id,
        meta: { leadId: lead.id, meetingTypeId: meetingType.id, bookingLinkId: bookingLink.id },
      });
      return { bookingLink, message, meetingType, conversation, queuedEvent };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    try {
      await this.messaging.enqueueQueuedMessage(
        {
          workspaceId,
          igAccountId: result.conversation.igAccountId,
          contactId: result.conversation.contactId,
          text: result.message.text!,
          source: "AGENT",
          humanAgent: true,
        },
        result.message.id,
        `send-messages:${result.queuedEvent.eventId}`,
      );
    } catch (error) {
      this.logger.warn(`Immediate meeting invitation delivery deferred to outbox: ${error instanceof Error ? error.message : String(error)}`);
    }
    this.messaging.emitMessageCreated(workspaceId, result.message);
    return {
      bookingLinkId: result.bookingLink.id,
      messageId: result.message.id,
      expiresAt: result.bookingLink.expiresAt,
      meetingType: result.meetingType,
    };
  }

  private async findConversation(client: Prisma.TransactionClient | PrismaService, workspaceId: string, conversationId: string) {
    const conversation = await client.conversation.findFirst({
      where: { id: conversationId, workspaceId },
      select: { id: true, contactId: true, igAccountId: true, contact: { select: { id: true, lastInboundAt: true } } },
    });
    if (!conversation) {
      throw new ProblemException(HttpStatus.NOT_FOUND, "CONVERSATION_NOT_FOUND", "Conversation not found", "The conversation does not exist in this workspace");
    }
    return conversation;
  }

  private messagingIneligibility(lastInboundAt: Date | null): "NO_PRIOR_INBOUND_MESSAGE" | "HUMAN_AGENT_WINDOW_EXPIRED" | null {
    if (!lastInboundAt) return "NO_PRIOR_INBOUND_MESSAGE";
    return Date.now() - lastInboundAt.getTime() > HUMAN_AGENT_WINDOW_MS ? "HUMAN_AGENT_WINDOW_EXPIRED" : null;
  }
}
