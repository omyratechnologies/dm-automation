import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BookingPage from "./page";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("@/lib/api", () => ({ apiFetch }));
vi.mock("next/navigation", () => ({ useParams: () => ({ publicId: "public-booking-id" }) }));

describe("public booking page", () => {
  beforeEach(() => {
    window.location.hash = "booking-secret";
    apiFetch.mockReset();
    apiFetch.mockImplementation(async (_path: string, options?: { method?: string }) => {
      if (options?.method === "POST") {
        return { id: "meeting-id", status: "PENDING", startsAt: "2026-09-08T04:30:00.000Z", endsAt: "2026-09-08T05:00:00.000Z", timezone: "Asia/Kolkata" };
      }
      return { timezone: "Asia/Kolkata", slots: [{ startsAt: "2026-09-08T04:30:00.000Z", endsAt: "2026-09-08T05:00:00.000Z" }] };
    });
  });

  afterEach(() => {
    cleanup();
    window.location.hash = "";
  });

  it("keeps the secret in the authorization header and books the selected slot", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><BookingPage /></QueryClientProvider>);

    const slot = await screen.findByRole("radio");
    fireEvent.click(slot);
    fireEvent.change(screen.getByLabelText("Email for your invitation"), { target: { value: "lead@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Confirm meeting" }));

    await waitFor(() => expect(apiFetch).toHaveBeenCalledWith(
      "/public/booking-links/public-booking-id/book",
      expect.objectContaining({
        method: "POST",
        headers: { Authorization: "Booking booking-secret" },
        body: { startsAt: "2026-09-08T04:30:00.000Z", inviteeEmail: "lead@example.com" },
      }),
    ));
    expect(apiFetch.mock.calls.every(([path]) => !String(path).includes("booking-secret"))).toBe(true);
    expect(await screen.findByText("Your meeting is reserved")).toBeInTheDocument();
  });
});
