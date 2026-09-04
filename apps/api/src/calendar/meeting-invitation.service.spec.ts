import { HUMAN_AGENT_WINDOW_MS } from "@repo/shared";
import { MeetingInvitationService } from "./meeting-invitation.service";

const WORKSPACE_ID = "886fec7c-d45e-4657-9e8a-a424cc5c8f30";
const ORGANIZATION_ID = "8db94a2b-2229-45ca-a70b-9eaecf11cc23";
const CONVERSATION_ID = "f7e8453c-5f16-46a1-8959-6e5ff3a64b1e";
const CONTACT_ID = "0a658318-bb97-4094-bb07-ca218a57f8d4";
const LEAD_ID = "dc0300c0-4378-47c7-a62e-a9e8a1d66ed5";
const MEETING_TYPE_ID = "e2282b45-bbec-42ab-a8d0-026003fa58a2";
const USER_ID = "34c64238-66e0-45bd-a870-136395bc35cc";

function fixture(overrides: { lastInboundAt?: Date | null; lead?: unknown; meetingType?: unknown } = {}) {
  const conversation = {
    id: CONVERSATION_ID,
    workspaceId: WORKSPACE_ID,
    igAccountId: "9dbd28af-bdf0-4998-863c-53a43e43c936",
    contactId: CONTACT_ID,
    contact: {
      id: CONTACT_ID,
      lastInboundAt: overrides.lastInboundAt === undefined ? new Date() : overrides.lastInboundAt,
    },
  };
  const lead = overrides.lead === undefined
    ? { id: LEAD_ID, contactId: CONTACT_ID, pipeline: { name: "Sales" }, stage: { name: "Qualified" } }
    : overrides.lead;
  const meetingType = overrides.meetingType === undefined
    ? { id: MEETING_TYPE_ID, name: "Discovery call", durationMinutes: 30, timezone: "Asia/Kolkata" }
    : overrides.meetingType;
  const tx = {
    conversation: { findFirst: jest.fn().mockResolvedValue(conversation) },
    lead: { findFirst: jest.fn().mockResolvedValue(lead), findMany: jest.fn().mockResolvedValue(lead ? [lead] : []) },
    meetingType: { findFirst: jest.fn().mockResolvedValue(meetingType), findMany: jest.fn().mockResolvedValue(meetingType ? [meetingType] : []) },
    bookingLink: {
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({
        id: "b7f687aa-3a48-472f-aa15-5ae41af4c6af",
        ...data,
      })),
    },
  };
  const prisma = {
    $transaction: jest.fn().mockImplementation((callback) => callback(tx)),
    conversation: tx.conversation,
    lead: tx.lead,
    meetingType: tx.meetingType,
  };
  const messaging = {
    createQueuedMessage: jest.fn().mockResolvedValue({
      id: "82609420-5db1-41f2-899d-d667fd47c8eb",
      conversationId: CONVERSATION_ID,
      status: "QUEUED",
    }),
    enqueueQueuedMessage: jest.fn().mockResolvedValue(undefined),
    emitMessageCreated: jest.fn(),
  };
  const outbox = { append: jest.fn().mockResolvedValue({ eventId: "0ece59e5-8495-401a-8a43-12bb0fce4d4e" }) };
  const audit = { logInTransaction: jest.fn().mockResolvedValue({}) };
  const config = { getOrThrow: jest.fn().mockReturnValue("https://gemai.example") };
  const leadCommands = { ensureLeadForContact: jest.fn().mockResolvedValue({ id: LEAD_ID }) };
  const calendar = { ensureDefaultBookingSetup: jest.fn().mockResolvedValue({ meetingType }) };
  const service = new MeetingInvitationService(prisma as never, messaging as never, outbox as never, audit as never, config as never, leadCommands as never, calendar as never);
  return { service, prisma, tx, messaging, outbox, audit, leadCommands, calendar };
}

describe("MeetingInvitationService", () => {
  it("atomically creates a secure booking link, queued DM, outbox event and audit record", async () => {
    const f = fixture();

    const result = await f.service.send(WORKSPACE_ID, ORGANIZATION_ID, USER_ID, CONVERSATION_ID, {
      leadId: LEAD_ID,
      meetingTypeId: MEETING_TYPE_ID,
      expiresInDays: 7,
      introduction: "Choose a convenient time for our call.",
    }, "correlation-1");

    expect(f.prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(f.tx.bookingLink.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ workspaceId: WORKSPACE_ID, leadId: LEAD_ID, meetingTypeId: MEETING_TYPE_ID, status: "ACTIVE" }),
    }));
    expect(f.messaging.createQueuedMessage).toHaveBeenCalledWith(f.tx, expect.objectContaining({
      workspaceId: WORKSPACE_ID,
      conversationId: CONVERSATION_ID,
      source: "AGENT",
      text: expect.stringMatching(/^Choose a convenient time[\s\S]+https:\/\/gemai\.example\/book\//),
    }));
    expect(f.outbox.append).toHaveBeenCalledWith(f.tx, expect.objectContaining({
      type: "MessageQueued",
      aggregateType: "Message",
      payload: { messageId: "82609420-5db1-41f2-899d-d667fd47c8eb" },
    }));
    expect(f.audit.logInTransaction).toHaveBeenCalled();
    expect(f.messaging.enqueueQueuedMessage).toHaveBeenCalledWith(
      expect.objectContaining({ humanAgent: true, source: "AGENT" }),
      "82609420-5db1-41f2-899d-d667fd47c8eb",
      "send-messages:0ece59e5-8495-401a-8a43-12bb0fce4d4e",
    );
    expect(f.messaging.emitMessageCreated).toHaveBeenCalled();
    expect(result).toMatchObject({ messageId: "82609420-5db1-41f2-899d-d667fd47c8eb", meetingType: { name: "Discovery call" } });
    expect(result).not.toHaveProperty("bookingUrl");
  });

  it("rejects a lead that is not an active lead for the conversation contact", async () => {
    const f = fixture({ lead: null });

    await expect(f.service.send(WORKSPACE_ID, ORGANIZATION_ID, USER_ID, CONVERSATION_ID, {
      leadId: LEAD_ID,
      meetingTypeId: MEETING_TYPE_ID,
      expiresInDays: 7,
    }, "correlation-2")).rejects.toMatchObject({ status: 422 });
    expect(f.tx.bookingLink.create).not.toHaveBeenCalled();
    expect(f.messaging.createQueuedMessage).not.toHaveBeenCalled();
  });

  it("rejects an invitation outside Meta's seven-day human-agent window", async () => {
    const f = fixture({ lastInboundAt: new Date(Date.now() - HUMAN_AGENT_WINDOW_MS - 1) });

    await expect(f.service.send(WORKSPACE_ID, ORGANIZATION_ID, USER_ID, CONVERSATION_ID, {
      leadId: LEAD_ID,
      meetingTypeId: MEETING_TYPE_ID,
      expiresInDays: 7,
    }, "correlation-3")).rejects.toMatchObject({ status: 409 });
    expect(f.tx.bookingLink.create).not.toHaveBeenCalled();
  });

  it("only returns active meeting types with an eligible connected host", async () => {
    const f = fixture();

    const result = await f.service.options(WORKSPACE_ID, CONVERSATION_ID);

    expect(f.tx.meetingType.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        workspaceId: WORKSPACE_ID,
        active: true,
        calendarPool: { status: "ACTIVE", members: { some: expect.objectContaining({ enabled: true }) } },
      }),
    }));
    expect(result).toMatchObject({
      leads: [{ id: LEAD_ID }],
      meetingTypes: [{ id: MEETING_TYPE_ID }],
      messagingEligible: true,
    });
  });

  it("repairs a legacy conversation lead and provisions the member's default booking setup", async () => {
    const f = fixture();

    const result = await f.service.prepare(WORKSPACE_ID, "member-1", USER_ID, CONVERSATION_ID, "correlation-prepare");

    expect(f.leadCommands.ensureLeadForContact).toHaveBeenCalledWith(CONTACT_ID, expect.objectContaining({
      actorType: "USER",
      actorId: USER_ID,
      membershipId: "member-1",
      correlationId: "correlation-prepare",
    }), "INSTAGRAM");
    expect(f.calendar.ensureDefaultBookingSetup).toHaveBeenCalledWith(WORKSPACE_ID, "member-1");
    expect(result).toMatchObject({ leads: [{ id: LEAD_ID }], meetingTypes: [{ id: MEETING_TYPE_ID }] });
  });

  it("keeps the accepted invitation recoverable when immediate Redis delivery fails", async () => {
    const f = fixture();
    f.messaging.enqueueQueuedMessage.mockRejectedValueOnce(new Error("Redis unavailable"));

    await expect(f.service.send(WORKSPACE_ID, ORGANIZATION_ID, USER_ID, CONVERSATION_ID, {
      leadId: LEAD_ID,
      meetingTypeId: MEETING_TYPE_ID,
      expiresInDays: 7,
    }, "correlation-4")).resolves.toMatchObject({ messageId: "82609420-5db1-41f2-899d-d667fd47c8eb" });

    expect(f.outbox.append).toHaveBeenCalledWith(f.tx, expect.objectContaining({ type: "MessageQueued" }));
    expect(f.messaging.emitMessageCreated).toHaveBeenCalled();
  });
});
