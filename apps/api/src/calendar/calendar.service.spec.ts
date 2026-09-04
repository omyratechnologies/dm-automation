import { CalendarService, isSlotReservationConflict } from "./calendar.service";

describe("Calendar slot conflict translation", () => {
  it.each([
    [{ code: "P2002" }],
    [{ code: "23P01" }],
    [{ meta: { code: "23P01" } }],
    [new Error('violates exclusion constraint "SlotReservation_no_overlap_excl"')],
    [new Error("PostgreSQL error 23P01")],
  ])("recognizes provider and Prisma representations of an overlap", (error) => {
    expect(isSlotReservationConflict(error)).toBe(true);
  });

  it("does not hide unrelated database failures", () => {
    expect(isSlotReservationConflict(new Error("connection lost"))).toBe(false);
  });
});

describe("CalendarService default booking setup", () => {
  it("idempotently creates an active pool, primary-calendar host, and launch-default meeting type", async () => {
    const pool = { id: "pool-1", workspaceId: "workspace-1", status: "ACTIVE" };
    const member = { id: "pool-member-1", workspaceId: "workspace-1", googleBindingId: "binding-1", calendarId: "primary" };
    const meetingType = { id: "meeting-type-1", slug: "discovery-call", active: true };
    const tx = {
      calendarPool: { upsert: jest.fn().mockResolvedValue(pool) },
      calendarPoolMember: { upsert: jest.fn().mockResolvedValue(member) },
      meetingType: { upsert: jest.fn().mockResolvedValue(meetingType) },
    };
    const prisma = {
      workspace: { findUnique: jest.fn().mockResolvedValue({ timezone: "Asia/Kolkata" }) },
      googleBinding: { findFirst: jest.fn().mockResolvedValue({ id: "binding-1" }) },
      $transaction: jest.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
    };
    const service = new CalendarService(prisma as never, {} as never, {} as never, {} as never, {} as never);
    jest.spyOn(service, "ensureCalendarWatch").mockResolvedValue();

    await expect(service.ensureDefaultBookingSetup("workspace-1", "member-1")).resolves.toEqual({ pool, member, meetingType });

    expect(tx.calendarPool.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { workspaceId_name: { workspaceId: "workspace-1", name: "Default hosts" } },
      create: expect.objectContaining({ status: "ACTIVE" }),
    }));
    expect(tx.calendarPoolMember.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({ membershipId: "member-1", googleBindingId: "binding-1", calendarId: "primary", enabled: true }),
    }));
    expect(tx.meetingType.upsert).toHaveBeenCalledWith(expect.objectContaining({
      create: expect.objectContaining({
        name: "Discovery call",
        durationMinutes: 30,
        intervalMinutes: 15,
        bufferBeforeMinutes: 15,
        bufferAfterMinutes: 15,
        minimumNoticeMinutes: 240,
        bookingHorizonDays: 30,
        timezone: "Asia/Kolkata",
        active: true,
      }),
    }));
    expect(service.ensureCalendarWatch).toHaveBeenCalledWith("pool-member-1");
  });

  it("does not provision another member's or a workspace-owned Calendar binding", async () => {
    const prisma = {
      workspace: { findUnique: jest.fn().mockResolvedValue({ timezone: "UTC" }) },
      googleBinding: { findFirst: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(),
    };
    const service = new CalendarService(prisma as never, {} as never, {} as never, {} as never, {} as never);

    await expect(service.ensureDefaultBookingSetup("workspace-1", "member-1")).rejects.toMatchObject({ status: 422 });
    expect(prisma.googleBinding.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ workspaceId: "workspace-1", authorizedMembershipId: "member-1", ownership: "MEMBER" }),
    }));
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
