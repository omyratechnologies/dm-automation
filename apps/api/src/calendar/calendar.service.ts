import { HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import { createHash, randomBytes, randomUUID } from "crypto";
import { DateTime } from "luxon";
import { GoogleApiClient } from "../google/google-api.client";
import { OutboxService } from "../delivery/outbox.service";
import { LeadCommandService } from "../leads/lead-command.service";
import { ProblemException } from "../common/problem-details";
import { PrismaService } from "../prisma/prisma.service";
import type { AddCalendarPoolMemberDto, BookMeetingDto, CreateBookingLinkDto, CreateCalendarPoolDto, CreateMeetingTypeDto } from "./calendar.dto";

export function isSlotReservationConflict(error: unknown): boolean {
  const candidate = error as { code?: string; message?: string; meta?: { code?: string; constraint?: string } };
  return [candidate.code, candidate.meta?.code].some((code) => ["P2002", "P2004", "23P01"].includes(code ?? ""))
    || /SlotReservation_no_overlap_excl|exclusion constraint|23P01/i.test(candidate.message ?? "")
    || /SlotReservation_no_overlap_excl/i.test(candidate.meta?.constraint ?? "");
}

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService, private readonly google: GoogleApiClient, private readonly outbox: OutboxService, private readonly leads: LeadCommandService, private readonly config: ConfigService) {}

  list(workspaceId: string) {
    return this.prisma.calendarPool.findMany({ where: { workspaceId }, include: { members: true, meetingTypes: true }, orderBy: { name: "asc" } });
  }

  listMeetings(workspaceId: string, cursor?: string, limit = 50) {
    const take = Math.min(Math.max(limit, 1), 100);
    return this.prisma.leadMeeting.findMany({
      where: { workspaceId },
      include: { meetingType: { select: { name: true } }, lead: { select: { id: true, contact: { select: { name: true, username: true } } } }, hostMembership: { include: { user: { select: { firstname: true, lastname: true, email: true } } } } },
      orderBy: [{ startsAt: "asc" }, { id: "asc" }], take: take + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    }).then((items) => ({ items: items.slice(0, take), nextCursor: items.length > take ? items[take - 1]?.id ?? null : null }));
  }

  createPool(workspaceId: string, input: CreateCalendarPoolDto) {
    return this.prisma.calendarPool.create({ data: { workspaceId, name: input.name } });
  }

  async addMember(workspaceId: string, poolId: string, input: AddCalendarPoolMemberDto) {
    const [pool, member, binding] = await Promise.all([
      this.prisma.calendarPool.findUnique({ where: { id_workspaceId: { id: poolId, workspaceId } } }),
      this.prisma.membership.findUnique({ where: { id_workspaceId: { id: input.membershipId, workspaceId } } }),
      this.prisma.googleBinding.findUnique({ where: { id_workspaceId: { id: input.googleBindingId, workspaceId } } }),
    ]);
    if (!pool || !member || !binding || binding.status !== "ACTIVE" || binding.ownership !== "MEMBER" || binding.authorizedMembershipId !== member.id || !binding.capabilities.includes("CALENDAR")) {
      throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "GOOGLE_BINDING_INVALID", "Calendar member invalid", "The host must authorize their own active Calendar binding");
    }
    const created = await this.prisma.calendarPoolMember.create({ data: { workspaceId, poolId, ...input } });
    await this.ensureCalendarWatch(created.id);
    return created;
  }

  createMeetingType(workspaceId: string, input: CreateMeetingTypeDto) {
    return this.prisma.meetingType.create({ data: { workspaceId, ...input, availabilityRules: input.availabilityRules as Prisma.InputJsonValue } });
  }

  async createBookingLink(workspaceId: string, input: CreateBookingLinkDto) {
    const lead = await this.prisma.lead.findUnique({ where: { id_workspaceId: { id: input.leadId, workspaceId } } });
    const meetingType = await this.prisma.meetingType.findUnique({ where: { id_workspaceId: { id: input.meetingTypeId, workspaceId } } });
    if (!lead || !meetingType?.active) throw new ProblemException(HttpStatus.NOT_FOUND, "BOOKING_RESOURCE_NOT_FOUND", "Booking resource not found", "The lead or active meeting type is unavailable");
    const publicId = randomBytes(12).toString("base64url");
    const secret = randomBytes(32).toString("base64url");
    const link = await this.prisma.bookingLink.create({ data: {
      publicId, workspaceId, leadId: lead.id, meetingTypeId: meetingType.id,
      secretHash: createHash("sha256").update(secret).digest("hex"),
      expiresAt: new Date(Date.now() + input.expiresInDays * 86_400_000),
    } });
    return { id: link.id, publicId, expiresAt: link.expiresAt, url: `${this.config.get("WEB_ORIGIN")}/book/${publicId}#${secret}` };
  }

  async availability(booking: { workspaceId: string; meetingTypeId: string }, fromIso?: string) {
    const type = await this.prisma.meetingType.findUnique({ where: { id_workspaceId: { id: booking.meetingTypeId, workspaceId: booking.workspaceId } }, include: { calendarPool: { include: { members: { where: { enabled: true } } } } } });
    if (!type?.active) throw new ProblemException(HttpStatus.NOT_FOUND, "BOOKING_RESOURCE_NOT_FOUND", "Meeting type unavailable", "This meeting type is not active");
    const now = DateTime.utc();
    const start = fromIso ? DateTime.fromISO(fromIso, { zone: type.timezone }).startOf("day") : now.setZone(type.timezone).startOf("day");
    const end = DateTime.min(start.plus({ days: 14 }), now.plus({ days: type.bookingHorizonDays }));
    const rules = type.availabilityRules as Record<string, Array<{ start: string; end: string }>>;
    const slots: Array<{ startsAt: string; endsAt: string }> = [];
    for (let day = start; day < end && slots.length < 60; day = day.plus({ days: 1 })) {
      const windows = rules[String(day.weekday)] ?? rules[day.toFormat("ccc").toLowerCase()] ?? [];
      for (const window of windows) {
        let cursor = DateTime.fromISO(`${day.toISODate()}T${window.start}`, { zone: type.timezone });
        const windowEnd = DateTime.fromISO(`${day.toISODate()}T${window.end}`, { zone: type.timezone });
        while (cursor.plus({ minutes: type.durationMinutes }) <= windowEnd && slots.length < 60) {
          if (cursor.toUTC() >= now.plus({ minutes: type.minimumNoticeMinutes })) slots.push({ startsAt: cursor.toUTC().toISO()!, endsAt: cursor.plus({ minutes: type.durationMinutes }).toUTC().toISO()! });
          cursor = cursor.plus({ minutes: type.intervalMinutes });
        }
      }
    }
    if (!type.calendarPool.members.length || !slots.length) return { timezone: type.timezone, slots: [] };
    const timeMin = slots[0]!.startsAt;
    const timeMax = slots[slots.length - 1]!.endsAt;
    const busyByMember = await Promise.all(type.calendarPool.members.map(async (member) => ({ member, result: await this.google.freeBusy(booking.workspaceId, member.googleBindingId, timeMin, timeMax, [member.calendarId, ...member.conflictCalendarIds]) })));
    const available = slots.filter((slot) => busyByMember.some(({ result }) => Object.values(result.calendars).every((calendar) => !(calendar.busy ?? []).some((busy) => new Date(busy.start).getTime() < new Date(slot.endsAt).getTime() + type.bufferAfterMinutes * 60_000 && new Date(busy.end).getTime() > new Date(slot.startsAt).getTime() - type.bufferBeforeMinutes * 60_000))));
    return { timezone: type.timezone, slots: available };
  }

  async book(booking: { id: string; workspaceId: string; leadId: string; meetingTypeId: string }, input: BookMeetingDto) {
    const type = await this.prisma.meetingType.findUnique({ where: { id_workspaceId: { id: booking.meetingTypeId, workspaceId: booking.workspaceId } } });
    const lead = await this.prisma.lead.findUnique({ where: { id_workspaceId: { id: booking.leadId, workspaceId: booking.workspaceId } } });
    if (!type?.active || !lead) throw new ProblemException(HttpStatus.NOT_FOUND, "BOOKING_RESOURCE_NOT_FOUND", "Booking unavailable", "The lead or meeting type is unavailable");
    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(startsAt.getTime() + type.durationMinutes * 60_000);
    if (startsAt.getTime() < Date.now() + type.minimumNoticeMinutes * 60_000 || startsAt.getTime() > Date.now() + type.bookingHorizonDays * 86_400_000) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "SLOT_UNAVAILABLE", "Slot unavailable", "The slot is outside the booking window");
    const host = await this.selectHost(booking.workspaceId, type.calendarPoolId, lead.ownerMembershipId);
    if (!host) throw new ProblemException(HttpStatus.CONFLICT, "SLOT_UNAVAILABLE", "No host available", "No eligible calendar host is available");
    try {
      const meeting = await this.prisma.$transaction(async (tx) => {
        const claimed = await tx.bookingLink.updateMany({ where: { id: booking.id, workspaceId: booking.workspaceId, status: "ACTIVE" }, data: { status: "BOOKED" } });
        if (claimed.count !== 1) throw new ProblemException(HttpStatus.CONFLICT, "BOOKING_TOKEN_EXPIRED", "Booking link unavailable", "This booking link was already used");
        const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: booking.workspaceId }, select: { organizationId: true } });
        const meeting = await tx.leadMeeting.create({ data: { workspaceId: booking.workspaceId, leadId: lead.id, meetingTypeId: type.id, hostMembershipId: host.membershipId, startsAt, endsAt, timezone: type.timezone, inviteeEmail: input.inviteeEmail } });
        await tx.slotReservation.create({ data: { workspaceId: booking.workspaceId, googleBindingId: host.googleBindingId, meetingId: meeting.id, startsAt: new Date(startsAt.getTime() - type.bufferBeforeMinutes * 60_000), endsAt: new Date(endsAt.getTime() + type.bufferAfterMinutes * 60_000), expiresAt: new Date(Date.now() + 120_000) } });
        await tx.bookingLink.update({ where: { id: booking.id }, data: { meetingId: meeting.id } });
        await this.outbox.append(tx, { type: "MeetingChanged", organizationId: workspace.organizationId, workspaceId: booking.workspaceId, aggregateType: "LeadMeeting", aggregateId: meeting.id, aggregateVersion: meeting.version, actorType: "SYSTEM", correlationId: randomUUID(), payload: { meetingId: meeting.id, meetingVersion: meeting.version } });
        return meeting;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      if (!lead.ownerMembershipId) {
        const current = await this.prisma.lead.findUnique({ where: { id_workspaceId: { id: lead.id, workspaceId: booking.workspaceId } }, select: { version: true, ownerMembershipId: true } });
        if (current && !current.ownerMembershipId) await this.leads.assign(booking.workspaceId, lead.id, current.version, { membershipId: host.membershipId }, { actorType: "SYSTEM", correlationId: randomUUID() });
      }
      return meeting;
    } catch (error) {
      if (isSlotReservationConflict(error)) throw new ProblemException(HttpStatus.CONFLICT, "SLOT_UNAVAILABLE", "Slot unavailable", "Another booking reserved this slot");
      throw error;
    }
  }

  async reschedule(workspaceId: string, meetingId: string, expectedVersion: number, startsAtIso: string, actorType: "USER" | "SYSTEM") {
    const meeting = await this.prisma.leadMeeting.findUnique({ where: { id_workspaceId: { id: meetingId, workspaceId } }, include: { meetingType: true } });
    if (!meeting) throw new ProblemException(HttpStatus.NOT_FOUND, "MEETING_NOT_FOUND", "Meeting not found", "The meeting does not exist in this workspace");
    if (meeting.version !== expectedVersion) throw this.meetingVersionConflict();
    if (!["CONFIRMED", "CONFLICTED"].includes(meeting.status)) throw new ProblemException(HttpStatus.CONFLICT, "INVALID_MEETING_TRANSITION", "Meeting cannot be rescheduled", "Only confirmed or conflicted meetings can be rescheduled");
    const startsAt = new Date(startsAtIso);
    const endsAt = new Date(startsAt.getTime() + meeting.meetingType.durationMinutes * 60_000);
    if (startsAt.getTime() < Date.now() + meeting.meetingType.minimumNoticeMinutes * 60_000 || startsAt.getTime() > Date.now() + meeting.meetingType.bookingHorizonDays * 86_400_000) throw new ProblemException(HttpStatus.UNPROCESSABLE_ENTITY, "SLOT_UNAVAILABLE", "Slot unavailable", "The slot is outside the booking window");
    const host = await this.prisma.calendarPoolMember.findFirst({ where: { workspaceId, poolId: meeting.meetingType.calendarPoolId, membershipId: meeting.hostMembershipId, enabled: true } });
    if (!host) throw new ProblemException(HttpStatus.CONFLICT, "HOST_UNAVAILABLE", "Host unavailable", "The assigned host is no longer eligible");
    try {
      return await this.prisma.$transaction(async (tx) => {
        const updated = await tx.leadMeeting.updateMany({ where: { id: meeting.id, workspaceId, version: expectedVersion }, data: { startsAt, endsAt, status: "PENDING", failureCode: null, version: { increment: 1 } } });
        if (updated.count !== 1) throw this.meetingVersionConflict();
        await tx.slotReservation.updateMany({ where: { meetingId: meeting.id, workspaceId }, data: { status: "RELEASED" } });
        await tx.slotReservation.create({ data: { workspaceId, googleBindingId: host.googleBindingId, meetingId: meeting.id, startsAt: new Date(startsAt.getTime() - meeting.meetingType.bufferBeforeMinutes * 60_000), endsAt: new Date(endsAt.getTime() + meeting.meetingType.bufferAfterMinutes * 60_000), expiresAt: new Date(Date.now() + 120_000) } });
        const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
        await this.outbox.append(tx, { type: "MeetingChanged", organizationId: workspace.organizationId, workspaceId, aggregateType: "LeadMeeting", aggregateId: meeting.id, aggregateVersion: expectedVersion + 1, actorType, correlationId: randomUUID(), payload: { meetingId: meeting.id, meetingVersion: expectedVersion + 1 } });
        return tx.leadMeeting.findUniqueOrThrow({ where: { id: meeting.id } });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (isSlotReservationConflict(error)) throw new ProblemException(HttpStatus.CONFLICT, "SLOT_UNAVAILABLE", "Slot unavailable", "Another booking reserved this slot");
      throw error;
    }
  }

  async cancel(workspaceId: string, meetingId: string, expectedVersion: number, actorType: "USER" | "SYSTEM") {
    return this.prisma.$transaction(async (tx) => {
      const meeting = await tx.leadMeeting.findUnique({ where: { id_workspaceId: { id: meetingId, workspaceId } } });
      if (!meeting) throw new ProblemException(HttpStatus.NOT_FOUND, "MEETING_NOT_FOUND", "Meeting not found", "The meeting does not exist in this workspace");
      if (meeting.version !== expectedVersion) throw this.meetingVersionConflict();
      if (["CANCELED", "COMPLETED", "NO_SHOW"].includes(meeting.status)) throw new ProblemException(HttpStatus.CONFLICT, "INVALID_MEETING_TRANSITION", "Meeting cannot be canceled", "This meeting is already terminal");
      const updated = await tx.leadMeeting.update({ where: { id_workspaceId: { id: meetingId, workspaceId } }, data: { status: "CANCELED", canceledAt: new Date(), version: { increment: 1 } } });
      await tx.slotReservation.updateMany({ where: { meetingId, workspaceId }, data: { status: "RELEASED" } });
      await tx.bookingLink.updateMany({ where: { meetingId, workspaceId }, data: { status: "REVOKED" } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
      await this.outbox.append(tx, { type: "MeetingChanged", organizationId: workspace.organizationId, workspaceId, aggregateType: "LeadMeeting", aggregateId: meetingId, aggregateVersion: updated.version, actorType, correlationId: randomUUID(), payload: { meetingId, meetingVersion: updated.version } });
      return updated;
    });
  }

  async setOutcome(workspaceId: string, meetingId: string, expectedVersion: number, status: "COMPLETED" | "NO_SHOW") {
    return this.prisma.$transaction(async (tx) => {
      const changed = await tx.leadMeeting.updateMany({ where: { id: meetingId, workspaceId, version: expectedVersion, status: "CONFIRMED" }, data: { status, version: { increment: 1 } } });
      if (changed.count !== 1) throw this.meetingVersionConflict();
      const meeting = await tx.leadMeeting.findUniqueOrThrow({ where: { id_workspaceId: { id: meetingId, workspaceId } } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: workspaceId }, select: { organizationId: true } });
      await this.outbox.append(tx, { type: "MeetingChanged", organizationId: workspace.organizationId, workspaceId, aggregateType: "LeadMeeting", aggregateId: meetingId, aggregateVersion: meeting.version, actorType: "USER", correlationId: randomUUID(), payload: { meetingId, meetingVersion: meeting.version } });
      return meeting;
    });
  }

  private async selectHost(workspaceId: string, poolId: string, ownerMembershipId: string | null) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "CalendarPool" WHERE "id" = ${poolId}::uuid AND "workspaceId" = ${workspaceId}::uuid FOR UPDATE`;
      if (ownerMembershipId) {
        const owner = await tx.calendarPoolMember.findFirst({ where: { workspaceId, poolId, membershipId: ownerMembershipId, enabled: true, googleBinding: { status: "ACTIVE" } } });
        if (owner) return owner;
      }
      const member = await tx.calendarPoolMember.findFirst({ where: { workspaceId, poolId, enabled: true, googleBinding: { status: "ACTIVE" } }, orderBy: [{ lastAssignedSequence: "asc" }, { id: "asc" }] });
      if (!member) return null;
      const pool = await tx.calendarPool.update({ where: { id_workspaceId: { id: poolId, workspaceId } }, data: { routingCursor: { increment: 1 } } });
      return tx.calendarPoolMember.update({ where: { id: member.id }, data: { lastAssignedSequence: pool.routingCursor } });
    });
  }

  private meetingVersionConflict(): ProblemException {
    return new ProblemException(HttpStatus.PRECONDITION_FAILED, "VERSION_CONFLICT", "Version conflict", "The meeting changed after it was loaded; refresh and retry");
  }

  async ensureCalendarWatch(poolMemberId: string): Promise<void> {
    const member = await this.prisma.calendarPoolMember.findUnique({ where: { id: poolMemberId } });
    if (!member) return;
    const active = await this.prisma.googleWatchChannel.findFirst({ where: { bindingId: member.googleBindingId, workspaceId: member.workspaceId, type: "CALENDAR_EVENTS", calendarId: member.calendarId, status: "ACTIVE", expiresAt: { gt: new Date(Date.now() + 30 * 60 * 60 * 1000) } } });
    if (active) return;
    const webhookBase = this.config.get<string>("GOOGLE_WEBHOOK_BASE_URL");
    if (!webhookBase) throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "GOOGLE_UNAVAILABLE", "Google webhook unavailable", "GOOGLE_WEBHOOK_BASE_URL is required for Calendar synchronization");
    const channelId = randomUUID();
    const secret = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + 7 * 86_400_000);
    const watched = await this.google.watchCalendar(member.workspaceId, member.googleBindingId, member.calendarId, { id: channelId, token: secret, address: `${webhookBase.replace(/\/$/, "")}/v1/google/webhooks/calendar`, expiration: expiresAt.getTime() });
    await this.prisma.googleWatchChannel.create({ data: { bindingId: member.googleBindingId, workspaceId: member.workspaceId, type: "CALENDAR_EVENTS", calendarId: member.calendarId, channelId, resourceId: watched.resourceId, resourceUri: watched.resourceUri, secretHash: createHash("sha256").update(secret).digest("hex"), expiresAt: watched.expiration ? new Date(Number(watched.expiration)) : expiresAt } });
  }

  async syncCalendarChannel(channelId: string): Promise<void> {
    const channel = await this.prisma.googleWatchChannel.findUnique({ where: { id: channelId } });
    if (!channel?.calendarId || channel.status !== "ACTIVE") return;
    let syncToken = channel.syncToken ?? undefined;
    let pageToken: string | undefined;
    let nextSyncToken: string | undefined;
    const items: NonNullable<Awaited<ReturnType<GoogleApiClient["listCalendarEvents"]>>["items"]> = [];
    for (let page = 0; page < 100; page += 1) {
      let result;
      try {
        result = await this.google.listCalendarEvents(channel.workspaceId, channel.bindingId, channel.calendarId, syncToken, pageToken);
      } catch (error) {
        const code = error instanceof ProblemException ? (error.getResponse() as { code?: string }).code : undefined;
        if (code !== "CALENDAR_SYNC_TOKEN_GONE" || page > 0) throw error;
        syncToken = undefined;
        pageToken = undefined;
        continue;
      }
      items.push(...(result.items ?? []));
      nextSyncToken = result.nextSyncToken ?? nextSyncToken;
      pageToken = result.nextPageToken;
      if (!pageToken) break;
    }
    for (const event of items) {
      const meetingId = event.extendedProperties?.private?.gemaiMeetingId;
      if (!meetingId) continue;
      const meeting = await this.prisma.leadMeeting.findUnique({ where: { id_workspaceId: { id: meetingId, workspaceId: channel.workspaceId } } });
      if (!meeting) continue;
      if (event.status === "cancelled") {
        await this.prisma.$transaction([this.prisma.leadMeeting.update({ where: { id: meeting.id }, data: { status: "CANCELED", canceledAt: new Date(), providerEtag: event.etag, version: { increment: 1 } } }), this.prisma.slotReservation.updateMany({ where: { meetingId: meeting.id }, data: { status: "RELEASED" } })]);
      } else if (event.start?.dateTime && event.end?.dateTime && (event.start.dateTime !== meeting.startsAt.toISOString() || event.end.dateTime !== meeting.endsAt.toISOString())) {
        try {
          await this.prisma.$transaction([this.prisma.leadMeeting.update({ where: { id: meeting.id }, data: { startsAt: new Date(event.start.dateTime), endsAt: new Date(event.end.dateTime), providerEtag: event.etag, version: { increment: 1 } } }), this.prisma.slotReservation.updateMany({ where: { meetingId: meeting.id }, data: { startsAt: new Date(event.start.dateTime), endsAt: new Date(event.end.dateTime) } })]);
        } catch { await this.prisma.leadMeeting.update({ where: { id: meeting.id }, data: { status: "CONFLICTED", failureCode: "EXTERNAL_RESCHEDULE_CONFLICT" } }); }
      }
    }
    await this.prisma.googleWatchChannel.update({ where: { id: channel.id }, data: { syncToken: nextSyncToken ?? channel.syncToken } });
  }
}
