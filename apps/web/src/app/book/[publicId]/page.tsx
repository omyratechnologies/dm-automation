"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertCircle, CalendarCheck, Clock, LoaderCircle } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Availability = {
  timezone: string;
  slots: Array<{ startsAt: string; endsAt: string }>;
};

type BookingResult = {
  id: string;
  status: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
};

export default function BookingPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params.publicId;
  const [secret, setSecret] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const value = window.location.hash.slice(1);
    setSecret(value || "");
  }, []);

  const availabilityQuery = useQuery({
    queryKey: ["public-booking-availability", publicId],
    queryFn: () =>
      apiFetch<Availability>(`/public/booking-links/${encodeURIComponent(publicId)}/availability`, {
        headers: { Authorization: `Booking ${secret}` },
      }),
    enabled: Boolean(secret),
    retry: false,
  });

  useEffect(() => {
    if (!selectedSlot && availabilityQuery.data?.slots[0]) {
      setSelectedSlot(availabilityQuery.data.slots[0].startsAt);
    }
  }, [availabilityQuery.data, selectedSlot]);

  const bookMutation = useMutation({
    mutationFn: () =>
      apiFetch<BookingResult>(`/public/booking-links/${encodeURIComponent(publicId)}/book`, {
        method: "POST",
        headers: { Authorization: `Booking ${secret}` },
        body: { startsAt: selectedSlot, inviteeEmail: email.trim() },
      }),
  });

  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", timeZone: availabilityQuery.data?.timezone }),
    [availabilityQuery.data?.timezone],
  );
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone: availabilityQuery.data?.timezone, timeZoneName: "short" }),
    [availabilityQuery.data?.timezone],
  );

  if (bookMutation.isSuccess) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <Card className="w-full max-w-xl border-border shadow-sm">
          <CardHeader className="items-center text-center">
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
              <CalendarCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <CardTitle className="text-2xl">Your meeting is reserved</CardTitle>
            <CardDescription>
              {dateFormatter.format(new Date(bookMutation.data.startsAt))} at {timeFormatter.format(new Date(bookMutation.data.startsAt))}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-sm text-muted-foreground" role="status">
              A calendar invitation with the meeting details will be sent to {email.trim()} after confirmation.
            </p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 px-4 py-8 sm:py-12">
      <Card className="mx-auto w-full max-w-2xl border-border shadow-sm">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <CalendarCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Choose a meeting time</CardTitle>
          <CardDescription>Select an available time and enter the email address that should receive the calendar invitation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {secret === "" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Booking link incomplete</AlertTitle>
              <AlertDescription>Open the complete booking link from your Instagram conversation.</AlertDescription>
            </Alert>
          )}

          {secret === null || availabilityQuery.isLoading ? (
            <div className="flex min-h-48 items-center justify-center" role="status">
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
              Loading available times…
            </div>
          ) : availabilityQuery.isError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>Booking link unavailable</AlertTitle>
              <AlertDescription>
                {availabilityQuery.error instanceof Error ? availabilityQuery.error.message : "This link may be expired or already used."}
              </AlertDescription>
            </Alert>
          ) : availabilityQuery.data?.slots.length ? (
            <form
              className="space-y-6"
              onSubmit={(event) => {
                event.preventDefault();
                if (selectedSlot && email.trim()) bookMutation.mutate();
              }}
            >
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold">Available times</legend>
                <div className="grid max-h-80 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                  {availabilityQuery.data.slots.map((slot) => {
                    const selected = selectedSlot === slot.startsAt;
                    return (
                      <button
                        key={slot.startsAt}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        className={`min-h-14 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${selected ? "border-primary bg-primary/10 text-foreground" : "border-border bg-background hover:bg-muted"}`}
                        onClick={() => setSelectedSlot(slot.startsAt)}
                      >
                        <span className="block text-sm font-medium">{dateFormatter.format(new Date(slot.startsAt))}</span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                          {timeFormatter.format(new Date(slot.startsAt))}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="space-y-2">
                <Label htmlFor="invitee-email">Email for your invitation</Label>
                <Input
                  id="invitee-email"
                  type="email"
                  autoComplete="email"
                  required
                  className="h-11"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              {bookMutation.isError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" aria-hidden="true" />
                  <AlertTitle>Meeting could not be booked</AlertTitle>
                  <AlertDescription>
                    {bookMutation.error instanceof Error ? bookMutation.error.message : "Choose another time and try again."}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="h-11 w-full" disabled={!selectedSlot || !email.trim() || bookMutation.isPending}>
                {bookMutation.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Confirm meeting
              </Button>
              <p className="text-center text-xs text-muted-foreground">Times are displayed in {availabilityQuery.data.timezone}.</p>
            </form>
          ) : secret ? (
            <Alert>
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>No available times</AlertTitle>
              <AlertDescription>Please ask the sender for more availability.</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
