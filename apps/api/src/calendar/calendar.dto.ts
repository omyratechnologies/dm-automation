import { z } from "zod";
import { meetingTypeSchema, sendMeetingInvitationSchema } from "@repo/shared";

export const createCalendarPoolSchema = z.object({ name: z.string().trim().min(1).max(120) });
export const addCalendarPoolMemberSchema = z.object({
  membershipId: z.string().uuid(),
  googleBindingId: z.string().uuid(),
  calendarId: z.string().min(1).max(1024),
  conflictCalendarIds: z.array(z.string().min(1).max(1024)).max(50).default([]),
});
export const createMeetingTypeSchema = meetingTypeSchema.omit({ id: true });
export const createBookingLinkSchema = z.object({
  leadId: z.string().uuid(),
  meetingTypeId: z.string().uuid(),
  expiresInDays: z.number().int().min(1).max(30).default(7),
});
export const bookMeetingSchema = z.object({ startsAt: z.string().datetime(), inviteeEmail: z.string().email() });
export const rescheduleMeetingSchema = z.object({ startsAt: z.string().datetime() });
export type CreateCalendarPoolDto = z.infer<typeof createCalendarPoolSchema>;
export type AddCalendarPoolMemberDto = z.infer<typeof addCalendarPoolMemberSchema>;
export type CreateMeetingTypeDto = z.infer<typeof createMeetingTypeSchema>;
export type CreateBookingLinkDto = z.infer<typeof createBookingLinkSchema>;
export type BookMeetingDto = z.infer<typeof bookMeetingSchema>;
export type RescheduleMeetingDto = z.infer<typeof rescheduleMeetingSchema>;
export { sendMeetingInvitationSchema };
export type SendMeetingInvitationDto = z.infer<typeof sendMeetingInvitationSchema>;
