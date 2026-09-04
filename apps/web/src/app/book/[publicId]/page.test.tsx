import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BookingPage from "./page";

const { apiFetch } = vi.hoisted(() => ({ apiFetch: vi.fn() }));

vi.mock("@/lib/api", () => ({ apiFetch }));
vi.mock("next/navigation", () => ({ useParams: () => ({ publicId: "public-booking-id" }) }));

describe("public booking page", () => {
  let resolvedOptionsSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    window.location.hash = "booking-secret";
    const originalResolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
    resolvedOptionsSpy = vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(function (this: Intl.DateTimeFormat) {
      return { ...originalResolvedOptions.call(this), timeZone: "America/New_York" };
    });
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
    resolvedOptionsSpy.mockRestore();
    window.location.hash = "";
  });

  it("shows slots in the visitor timezone while booking the original UTC instant", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><BookingPage /></QueryClientProvider>);

    const slot = await screen.findByRole("radio");
    expect(screen.getByLabelText("Timezone for available meeting times")).toHaveValue("America/New_York");
    expect(slot).toHaveTextContent("12:30 AM EDT");
    expect(screen.getByText(/All times are shown in America \/ New York/)).toBeInTheDocument();
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

  it("formats slots correctly across daylight-saving time changes", async () => {
    apiFetch.mockResolvedValueOnce({
      timezone: "UTC",
      slots: [
        { startsAt: "2026-03-08T06:30:00.000Z", endsAt: "2026-03-08T07:00:00.000Z" },
        { startsAt: "2026-03-08T07:30:00.000Z", endsAt: "2026-03-08T08:00:00.000Z" },
      ],
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    render(<QueryClientProvider client={client}><BookingPage /></QueryClientProvider>);

    const slots = await screen.findAllByRole("radio");
    expect(slots[0]).toHaveTextContent("1:30 AM EST");
    expect(slots[1]).toHaveTextContent("3:30 AM EDT");
  });
});
