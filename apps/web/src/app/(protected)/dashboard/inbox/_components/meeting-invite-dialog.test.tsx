import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MeetingInviteDialog from "./meeting-invite-dialog";

const api = vi.fn();

vi.mock("@/hooks/use-api", () => ({
  useApi: () => ({
    api,
    workspaceId: "886fec7c-d45e-4657-9e8a-a424cc5c8f30",
    wsPath: (path: string) => `/workspaces/886fec7c-d45e-4657-9e8a-a424cc5c8f30${path}`,
  }),
}));

function renderDialog() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(<QueryClientProvider client={client}><MeetingInviteDialog conversationId="f7e8453c-5f16-46a1-8959-6e5ff3a64b1e" contactName="Sai Krishna" /></QueryClientProvider>);
}

describe("MeetingInviteDialog", () => {
  beforeEach(() => {
    api.mockReset();
    api.mockImplementation(async (_path: string, options?: { method?: string }) => {
      if (options?.method === "POST") {
        return { messageId: "82609420-5db1-41f2-899d-d667fd47c8eb", bookingLinkId: "b7f687aa-3a48-472f-aa15-5ae41af4c6af", expiresAt: "2026-09-11T00:00:00.000Z", meetingType: { id: "e2282b45-bbec-42ab-a8d0-026003fa58a2", name: "Discovery call", durationMinutes: 30, timezone: "Asia/Kolkata" } };
      }
      return {
        messagingEligible: true,
        messagingReason: null,
        leads: [{ id: "dc0300c0-4378-47c7-a62e-a9e8a1d66ed5", pipelineName: "Sales", stageName: "Qualified" }],
        meetingTypes: [{ id: "e2282b45-bbec-42ab-a8d0-026003fa58a2", name: "Discovery call", durationMinutes: 30, timezone: "Asia/Kolkata" }],
      };
    });
  });

  afterEach(cleanup);

  it("loads invitation options and sends the selected secure booking link", async () => {
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Send meeting invite" }));

    expect(await screen.findByRole("dialog", { name: "Send meeting invite" })).toBeInTheDocument();
    expect(await screen.findByText("Discovery call")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Send invitation" }));

    await waitFor(() => expect(api).toHaveBeenCalledWith(
      "/workspaces/886fec7c-d45e-4657-9e8a-a424cc5c8f30/calendar/meeting-invitations",
      expect.objectContaining({
        method: "POST",
        body: expect.objectContaining({
          conversationId: "f7e8453c-5f16-46a1-8959-6e5ff3a64b1e",
          leadId: "dc0300c0-4378-47c7-a62e-a9e8a1d66ed5",
          meetingTypeId: "e2282b45-bbec-42ab-a8d0-026003fa58a2",
        }),
      }),
    ));
  });

  it("shows an actionable disabled state when Calendar setup is incomplete", async () => {
    api.mockResolvedValueOnce({ messagingEligible: true, messagingReason: null, leads: [], meetingTypes: [] });
    renderDialog();
    fireEvent.click(screen.getByRole("button", { name: "Send meeting invite" }));

    expect(await screen.findByText(/No active meeting types with an eligible host/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send invitation" })).toBeDisabled();
  });
});
