import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { QUEUES, type GoogleCalendarJob } from "@repo/shared";
import { PrismaService } from "../prisma/prisma.service";
import { GoogleApiClient } from "../google/google-api.client";
import { CalendarService } from "./calendar.service";
import { ProblemException } from "../common/problem-details";
import { OutboxService } from "../delivery/outbox.service";
import { LeadCommandService } from "../leads/lead-command.service";
import { randomUUID } from "crypto";

@Processor(QUEUES.GOOGLE_CALENDAR, { concurrency: 5 })
export class GoogleCalendarProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService, private readonly google: GoogleApiClient, private readonly calendar: CalendarService, private readonly outbox: OutboxService, private readonly leads: LeadCommandService) { super(); }

  async process(job: Job<GoogleCalendarJob>): Promise<void> {
    if (job.data.operation === "SYNC_CALENDAR") {
      await this.calendar.syncCalendarChannel(job.data.meetingId);
      return;
    }
    const consumer = "google-calendar";
    const done = await this.prisma.processedEvent.findUnique({ where: { consumer_eventId: { consumer, eventId: job.data.eventId } } });
    if (done) return;
    const meeting = await this.prisma.leadMeeting.findUnique({
      where: { id_workspaceId: { id: job.data.meetingId, workspaceId: job.data.workspaceId } },
      include: { meetingType: true, lead: { select: { id: true } } },
    });
    if (!meeting) return;
    const host = await this.prisma.calendarPoolMember.findFirst({ where: { workspaceId: meeting.workspaceId, poolId: meeting.meetingType.calendarPoolId, membershipId: meeting.hostMembershipId, ...(job.data.operation === "CANCEL" ? {} : { enabled: true }) } });
    if (!host) {
      await this.prisma.leadMeeting.update({ where: { id: meeting.id }, data: job.data.operation === "CANCEL" ? { failureCode: "GOOGLE_CANCEL_REQUIRES_RECONCILIATION" } : { status: "FAILED", failureCode: "HOST_UNAVAILABLE" } });
      return;
    }
    if (job.data.operation === "CANCEL") {
      if (meeting.providerCalendarId && meeting.providerEventId) await this.google.deleteCalendarEvent(meeting.workspaceId, host.googleBindingId, meeting.providerCalendarId, meeting.providerEventId, meeting.providerEtag ?? undefined);
      await this.prisma.processedEvent.upsert({ where: { consumer_eventId: { consumer, eventId: job.data.eventId } }, create: { consumer, eventId: job.data.eventId }, update: {} });
      return;
    }
    if (meeting.status !== "PENDING") return;
    const freeBusy = await this.google.freeBusy(meeting.workspaceId, host.googleBindingId, meeting.startsAt.toISOString(), meeting.endsAt.toISOString(), [host.calendarId, ...host.conflictCalendarIds]);
    const busy = Object.values(freeBusy.calendars).some((calendar) => (calendar.busy ?? []).some((period) => new Date(period.start).getTime() < meeting.endsAt.getTime() && new Date(period.end).getTime() > meeting.startsAt.getTime()));
    if (busy) {
      await this.prisma.$transaction([
        this.prisma.leadMeeting.update({ where: { id: meeting.id }, data: { status: "CONFLICTED", failureCode: "SLOT_UNAVAILABLE" } }),
        this.prisma.slotReservation.updateMany({ where: { meetingId: meeting.id }, data: { status: "RELEASED" } }),
        this.prisma.processedEvent.create({ data: { consumer, eventId: job.data.eventId } }),
      ]);
      return;
    }
    const providerEventId = meeting.id.replaceAll("-", "");
    const eventPayload = {
      id: providerEventId,
      summary: meeting.meetingType.name,
      description: `Gemai lead reference: ${meeting.lead.id}`,
      start: { dateTime: meeting.startsAt.toISOString(), timeZone: meeting.timezone },
      end: { dateTime: meeting.endsAt.toISOString(), timeZone: meeting.timezone },
      attendees: [{ email: meeting.inviteeEmail }],
      conferenceData: { createRequest: { requestId: `gemai-${providerEventId}`, conferenceSolutionKey: { type: "hangoutsMeet" } } },
      extendedProperties: { private: { gemaiMeetingId: meeting.id, gemaiWorkspaceId: meeting.workspaceId } },
    };
    let created;
    try {
      created = meeting.providerEventId
        ? await this.google.updateCalendarEvent(meeting.workspaceId, host.googleBindingId, meeting.providerCalendarId ?? host.calendarId, meeting.providerEventId, eventPayload, meeting.providerEtag ?? undefined)
        : await this.google.createEvent(meeting.workspaceId, host.googleBindingId, host.calendarId, eventPayload);
    } catch (error) {
      const code = error instanceof ProblemException ? (error.getResponse() as { code?: string }).code : undefined;
      if (code !== "GOOGLE_RESOURCE_EXISTS") throw error;
      created = await this.google.getCalendarEvent(meeting.workspaceId, host.googleBindingId, host.calendarId, providerEventId);
    }
    await this.prisma.$transaction(async (tx) => {
      const confirmed = await tx.leadMeeting.update({ where: { id: meeting.id }, data: { status: "CONFIRMED", providerCalendarId: host.calendarId, providerEventId: created.id, providerEtag: created.etag, conferenceUrl: created.hangoutLink, version: { increment: 1 } } });
      await tx.slotReservation.updateMany({ where: { meetingId: meeting.id }, data: { status: "CONFIRMED" } });
      await tx.processedEvent.create({ data: { consumer, eventId: job.data.eventId } });
      const workspace = await tx.workspace.findUniqueOrThrow({ where: { id: meeting.workspaceId }, select: { organizationId: true } });
      await this.outbox.append(tx, { type: "MeetingConfirmed", organizationId: workspace.organizationId, workspaceId: meeting.workspaceId, aggregateType: "LeadMeeting", aggregateId: meeting.id, aggregateVersion: confirmed.version, actorType: "GOOGLE_CALENDAR", correlationId: job.data.eventId, causationId: job.data.eventId, payload: { meetingId: meeting.id, meetingVersion: confirmed.version } });
    });
    if (meeting.meetingType.stageOnBookId) {
      const lead = await this.prisma.lead.findUnique({ where: { id_workspaceId: { id: meeting.leadId, workspaceId: meeting.workspaceId } }, select: { version: true, stageId: true } });
      if (lead && lead.stageId !== meeting.meetingType.stageOnBookId) {
        try {
          await this.leads.transition(meeting.workspaceId, meeting.leadId, lead.version, { stageId: meeting.meetingType.stageOnBookId, reopen: false }, { actorType: "GOOGLE_CALENDAR", correlationId: randomUUID(), causationId: job.data.eventId });
        } catch {
          await this.prisma.leadMeeting.update({ where: { id: meeting.id }, data: { failureCode: "STAGE_TRANSITION_REQUIRES_ATTENTION" } });
        }
      }
    }
  }
}
