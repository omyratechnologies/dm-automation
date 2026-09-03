import { Body, Controller, Get, Headers, HttpStatus, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { Queue } from "bullmq";
import { createHash, randomUUID, timingSafeEqual } from "crypto";
import { z } from "zod";
import { QUEUES, type GoogleCalendarJob } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import type { Request } from "express";
import { CurrentUser, CurrentWorkspace } from "../auth/decorators";
import type { AuthedRequestUser } from "../auth/clerk-auth.guard";
import { RequireCapabilities, WorkspaceScoped } from "../auth/capabilities.decorator";
import type { WorkspaceContext } from "../auth/workspace.guard";
import { Public } from "../auth/public.decorator";
import { IdempotentCommand } from "../common/idempotency";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { BookingLinkGuard, type BookingRequest } from "./booking-link.guard";
import { CalendarService } from "./calendar.service";
import {
  addCalendarPoolMemberSchema, AddCalendarPoolMemberDto,
  bookMeetingSchema, BookMeetingDto,
  createBookingLinkSchema, CreateBookingLinkDto,
  createCalendarPoolSchema, CreateCalendarPoolDto,
  createMeetingTypeSchema, CreateMeetingTypeDto,
  rescheduleMeetingSchema, RescheduleMeetingDto,
  sendMeetingInvitationSchema, SendMeetingInvitationDto,
} from "./calendar.dto";
import { ProblemException } from "../common/problem-details";
import { FeatureFlag } from "../common/feature-flag";
import { MeetingInvitationService } from "./meeting-invitation.service";

const meetingInvitationOptionsQuerySchema = z.object({ conversationId: z.string().uuid() }).strict();
type MeetingInvitationOptionsQuery = z.infer<typeof meetingInvitationOptionsQuerySchema>;

@Controller("workspaces/:workspaceId/calendar")
@WorkspaceScoped()
@FeatureFlag("FEATURE_GOOGLE_CALENDAR")
export class CalendarController {
  constructor(
    private readonly calendar: CalendarService,
    private readonly meetingInvitations: MeetingInvitationService,
  ) {}

  @Get("meeting-invitation-options")
  @RequireCapabilities("leads.write", "calendar.read")
  @ApiOperation({ summary: "List eligible leads and meeting types for an Inbox invitation" })
  @ApiQuery({ name: "conversationId", required: true, format: "uuid" })
  @ApiOkResponse({ description: "Eligible meeting invitation options and messaging-window status" })
  @ApiResponse({ status: 404, description: "Conversation not found in this workspace" })
  invitationOptions(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @Query(new ZodValidationPipe(meetingInvitationOptionsQuerySchema)) query: MeetingInvitationOptionsQuery,
  ) {
    return this.meetingInvitations.options(workspace.id, query.conversationId);
  }

  @Post("meeting-invitations")
  @RequireCapabilities("leads.write", "calendar.read")
  @IdempotentCommand()
  @ApiOperation({ summary: "Create a secure booking link and queue it as an Inbox message" })
  @ApiHeader({ name: "Idempotency-Key", required: true, description: "Unique retry key for this command" })
  @ApiBody({
    schema: {
      type: "object",
      required: ["conversationId", "leadId", "meetingTypeId"],
      properties: {
        conversationId: { type: "string", format: "uuid" },
        leadId: { type: "string", format: "uuid" },
        meetingTypeId: { type: "string", format: "uuid" },
        expiresInDays: { type: "integer", minimum: 1, maximum: 30, default: 7 },
        introduction: { type: "string", minLength: 1, maxLength: 600 },
      },
    },
  })
  @ApiOkResponse({ description: "Booking link and outbound Inbox message created" })
  @ApiResponse({ status: 409, description: "The Instagram human-agent messaging window has expired" })
  @ApiResponse({ status: 422, description: "The selected lead or meeting type is unavailable" })
  sendInvitation(
    @CurrentWorkspace() workspace: WorkspaceContext,
    @CurrentUser() user: AuthedRequestUser,
    @Req() request: Request,
    @Body(new ZodValidationPipe(sendMeetingInvitationSchema)) body: SendMeetingInvitationDto,
  ) {
    const { conversationId, ...input } = body;
    return this.meetingInvitations.send(
      workspace.id,
      workspace.organizationId,
      user.id,
      conversationId,
      input,
      String(request.headers["x-correlation-id"] ?? randomUUID()),
    );
  }

  @Get("pools") @RequireCapabilities("calendar.read")
  list(@CurrentWorkspace() workspace: WorkspaceContext) { return this.calendar.list(workspace.id); }

  @Get("meetings") @RequireCapabilities("calendar.read")
  meetings(@CurrentWorkspace() workspace: WorkspaceContext, @Query("cursor") cursor?: string, @Query("limit") limit?: string) { return this.calendar.listMeetings(workspace.id, cursor, limit ? Number(limit) : 50); }

  @Post("pools") @RequireCapabilities("calendar.manage") @IdempotentCommand()
  createPool(@CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(createCalendarPoolSchema)) input: CreateCalendarPoolDto) { return this.calendar.createPool(workspace.id, input); }

  @Post("pools/:poolId/members") @RequireCapabilities("calendar.manage") @IdempotentCommand()
  addMember(@CurrentWorkspace() workspace: WorkspaceContext, @Param("poolId") poolId: string, @Body(new ZodValidationPipe(addCalendarPoolMemberSchema)) input: AddCalendarPoolMemberDto) { return this.calendar.addMember(workspace.id, poolId, input); }

  @Post("meeting-types") @RequireCapabilities("calendar.manage") @IdempotentCommand()
  createMeetingType(@CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(createMeetingTypeSchema)) input: CreateMeetingTypeDto) { return this.calendar.createMeetingType(workspace.id, input); }

  @Post("booking-links") @RequireCapabilities("calendar.manage") @IdempotentCommand()
  createBookingLink(@CurrentWorkspace() workspace: WorkspaceContext, @Body(new ZodValidationPipe(createBookingLinkSchema)) input: CreateBookingLinkDto) { return this.calendar.createBookingLink(workspace.id, input); }

  @Post("meetings/:meetingId/reschedule") @RequireCapabilities("calendar.manage") @IdempotentCommand()
  reschedule(@CurrentWorkspace() workspace: WorkspaceContext, @Param("meetingId") meetingId: string, @Headers("if-match") ifMatch: string | undefined, @Body(new ZodValidationPipe(rescheduleMeetingSchema)) input: RescheduleMeetingDto) { return this.calendar.reschedule(workspace.id, meetingId, this.version(ifMatch), input.startsAt, "USER"); }

  @Post("meetings/:meetingId/cancel") @RequireCapabilities("calendar.manage") @IdempotentCommand()
  cancel(@CurrentWorkspace() workspace: WorkspaceContext, @Param("meetingId") meetingId: string, @Headers("if-match") ifMatch: string | undefined) { return this.calendar.cancel(workspace.id, meetingId, this.version(ifMatch), "USER"); }

  @Post("meetings/:meetingId/complete") @RequireCapabilities("calendar.manage") @IdempotentCommand()
  complete(@CurrentWorkspace() workspace: WorkspaceContext, @Param("meetingId") meetingId: string, @Headers("if-match") ifMatch: string | undefined) { return this.calendar.setOutcome(workspace.id, meetingId, this.version(ifMatch), "COMPLETED"); }

  @Post("meetings/:meetingId/no-show") @RequireCapabilities("calendar.manage") @IdempotentCommand()
  noShow(@CurrentWorkspace() workspace: WorkspaceContext, @Param("meetingId") meetingId: string, @Headers("if-match") ifMatch: string | undefined) { return this.calendar.setOutcome(workspace.id, meetingId, this.version(ifMatch), "NO_SHOW"); }

  private version(value?: string): number {
    if (!value) throw new ProblemException(HttpStatus.PRECONDITION_REQUIRED, "PRECONDITION_REQUIRED", "Precondition required", "Provide If-Match with the current meeting version");
    const version = Number(value.replace(/^W\//, "").replaceAll('"', ""));
    if (!Number.isInteger(version) || version < 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "INVALID_IF_MATCH", "Invalid If-Match", "If-Match must contain a positive integer version");
    return version;
  }
}

@Controller("public/booking-links/:publicId")
@FeatureFlag("FEATURE_GOOGLE_CALENDAR")
export class PublicBookingController {
  constructor(private readonly calendar: CalendarService) {}

  @Get("availability") @Public() @UseGuards(BookingLinkGuard)
  availability(@Req() request: BookingRequest, @Query("from") from?: string) { return this.calendar.availability(request.booking, from); }

  @Post("book") @Public() @UseGuards(BookingLinkGuard) @IdempotentCommand()
  book(@Req() request: BookingRequest, @Body(new ZodValidationPipe(bookMeetingSchema)) input: BookMeetingDto) { return this.calendar.book(request.booking, input); }

  @Post("reschedule") @Public() @UseGuards(BookingLinkGuard) @IdempotentCommand()
  reschedule(@Req() request: BookingRequest, @Headers("if-match") ifMatch: string | undefined, @Body(new ZodValidationPipe(rescheduleMeetingSchema)) input: RescheduleMeetingDto) {
    if (!request.booking.meetingId) throw new ProblemException(HttpStatus.CONFLICT, "MEETING_NOT_FOUND", "Meeting unavailable", "This booking link has no meeting");
    return this.calendar.reschedule(request.booking.workspaceId, request.booking.meetingId, this.version(ifMatch), input.startsAt, "SYSTEM");
  }

  @Post("cancel") @Public() @UseGuards(BookingLinkGuard) @IdempotentCommand()
  cancel(@Req() request: BookingRequest, @Headers("if-match") ifMatch: string | undefined) {
    if (!request.booking.meetingId) throw new ProblemException(HttpStatus.CONFLICT, "MEETING_NOT_FOUND", "Meeting unavailable", "This booking link has no meeting");
    return this.calendar.cancel(request.booking.workspaceId, request.booking.meetingId, this.version(ifMatch), "SYSTEM");
  }

  private version(value?: string): number {
    if (!value) throw new ProblemException(HttpStatus.PRECONDITION_REQUIRED, "PRECONDITION_REQUIRED", "Precondition required", "Provide If-Match with the current meeting version");
    const version = Number(value.replace(/^W\//, "").replaceAll('"', ""));
    if (!Number.isInteger(version) || version < 1) throw new ProblemException(HttpStatus.BAD_REQUEST, "INVALID_IF_MATCH", "Invalid If-Match", "If-Match must contain a positive integer version");
    return version;
  }
}

@Controller("google/webhooks/calendar")
@FeatureFlag("FEATURE_GOOGLE_CALENDAR")
export class GoogleCalendarWebhookController {
  constructor(private readonly prisma: PrismaService, @InjectQueue(QUEUES.GOOGLE_CALENDAR) private readonly queue: Queue<GoogleCalendarJob>) {}

  @Post()
  @Public()
  async wake(@Headers("x-goog-channel-id") channelId?: string, @Headers("x-goog-channel-token") token?: string, @Headers("x-goog-message-number") messageNumber?: string) {
    if (!channelId || !token) return { accepted: false };
    const channel = await this.prisma.googleWatchChannel.findUnique({ where: { channelId } });
    const actual = createHash("sha256").update(token).digest();
    const expected = channel ? Buffer.from(channel.secretHash, "hex") : Buffer.alloc(32);
    if (!channel || actual.length !== expected.length || !timingSafeEqual(actual, expected) || channel.status !== "ACTIVE") return { accepted: false };
    const number = messageNumber ? BigInt(messageNumber) : BigInt(0);
    if (channel.messageNumber !== null && number <= channel.messageNumber) return { accepted: true, duplicate: true };
    await this.prisma.googleWatchChannel.update({ where: { id: channel.id }, data: { messageNumber: number } });
    await this.queue.add("calendar-change", { eventId: randomUUID(), workspaceId: channel.workspaceId, meetingId: channel.id, operation: "SYNC_CALENDAR" }, { jobId: `google-calendar-sync:${channel.id}:${number}` });
    return { accepted: true };
  }
}
