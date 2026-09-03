"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock3, List, Users } from "lucide-react";
import PageHeader from "@/components/global/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import type { Page } from "@/lib/api";

type Meeting = { id: string; status: string; startsAt: string; endsAt: string; timezone: string; conferenceUrl: string | null; meetingType: { name: string }; lead: { id: string; contact: { name: string | null; username: string | null } }; hostMembership: { user: { firstname: string | null; lastname: string | null; email: string } } };

export default function AppointmentsPage() {
  const { api, wsPath, workspaceId } = useApi();
  const [status, setStatus] = useState("ALL");
  const { data, isLoading } = useQuery<Page<Meeting>>({ queryKey: ["meetings", workspaceId], queryFn: () => api(wsPath("/calendar/meetings?limit=100")), enabled: !!workspaceId });
  const meetings = (data?.items ?? []).filter((meeting) => status === "ALL" || meeting.status === status);
  return <div className="space-y-5 pb-10"><PageHeader title="Appointments" description="A conflict-aware agenda across every connected host calendar." icon={<CalendarDays className="h-5 w-5" />} />
    <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-card p-3" role="group" aria-label="Appointment status filter">{["ALL", "PENDING", "CONFIRMED", "CONFLICTED", "COMPLETED", "NO_SHOW", "CANCELED"].map((item) => <Button key={item} variant={status === item ? "default" : "outline"} className="h-11" onClick={() => setStatus(item)} aria-pressed={status === item}>{item.replace("_", " ")}</Button>)}</div>
    {isLoading ? <Skeleton className="h-96 rounded-xl" /> : meetings.length ? <div className="overflow-hidden rounded-xl border border-border bg-card">{meetings.map((meeting) => { const start = new Date(meeting.startsAt); const host = [meeting.hostMembership.user.firstname, meeting.hostMembership.user.lastname].filter(Boolean).join(" ") || meeting.hostMembership.user.email; return <article key={meeting.id} className="grid gap-3 border-b border-border p-4 last:border-0 md:grid-cols-[160px_1fr_1fr_auto] md:items-center"><div><p className="text-sm font-semibold">{start.toLocaleDateString()}</p><p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div><div><p className="text-sm font-medium">{meeting.meetingType.name}</p><p className="text-xs text-muted-foreground">{meeting.lead.contact.name || meeting.lead.contact.username || "Lead"}</p></div><p className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="h-4 w-4" />{host}</p><Badge variant={meeting.status === "CONFLICTED" ? "destructive" : meeting.status === "CONFIRMED" ? "default" : "secondary"}>{meeting.status.replace("_", " ")}</Badge></article>; })}</div> : <div className="rounded-xl border border-dashed border-border py-16 text-center"><List className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No appointments in this view</p><p className="mt-1 text-sm text-muted-foreground">Create a meeting type and booking link to schedule the first one.</p></div>}
  </div>;
}
