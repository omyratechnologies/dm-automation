"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { GoogleIntegrationReadiness } from "@repo/shared";
import { CalendarDays, CheckCircle2, ExternalLink, FileSpreadsheet, Instagram, Loader2, ShieldCheck, TriangleAlert, Unplug } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import PageHeader from "@/components/global/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import { googleAvailabilityBadge, googleAvailabilityCopy, type GoogleAvailability } from "@/lib/google-integration-readiness";

type Capability = "CALENDAR" | "SHEETS";
type Binding = {
  id: string;
  ownership: "MEMBER" | "WORKSPACE";
  capabilities: Capability[];
  status: string;
  version: number;
  lastHealthAt: string | null;
  lastErrorCode: string | null;
  canDisconnect: boolean;
  grant: { email: string | null; scopes: string[] };
};
type Destination = { id: string; name: string; status: string; spreadsheetId: string; sheetTitle: string; lastSyncedAt: string | null; lastErrorCode: string | null; _count: { conflicts: number; rows: number } };
type CalendarList = { items?: Array<{ id: string; summary: string; primary?: boolean; accessRole?: string; timeZone?: string }> };
type SpreadsheetList = { files?: Array<{ id: string; name: string; mimeType: string; modifiedTime?: string }>; nextPageToken?: string };

export default function IntegrationsPage() {
  const { api, wsPath, workspaceId, workspace } = useApi();
  const queryClient = useQueryClient();
  const canManageWorkspace = workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  const canConnectCalendar = Boolean(workspaceId);
  const readiness = useQuery<GoogleIntegrationReadiness>({ queryKey: ["google-readiness", workspaceId], queryFn: () => api(wsPath("/google/readiness")), enabled: !!workspaceId });
  const bindings = useQuery<Binding[]>({ queryKey: ["google-bindings", workspaceId], queryFn: () => api(wsPath("/google/bindings")), enabled: !!workspaceId });
  const destinations = useQuery<Destination[]>({ queryKey: ["sheet-destinations", workspaceId], queryFn: () => api(wsPath("/sheets/destinations")), enabled: !!workspaceId && readiness.data?.sheets.available === true && canManageWorkspace });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const result = params.get("google");
    if (!result) return;
    if (result === "connected") toast.success("Google account connected successfully");
    else if (result === "cancelled") toast.info("Google connection was cancelled. No access was granted.");
    else toast.error("Google could not be connected. Please try again.");
    params.delete("google");
    params.delete("code");
    const query = params.toString();
    window.history.replaceState({}, "", `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`);
  }, []);

  const connect = useMutation({
    mutationFn: (capabilities: Capability[]) => api<{ authorizationUrl: string }>(wsPath("/google/oauth-sessions"), {
      method: "POST",
      body: { ownership: capabilities.includes("SHEETS") ? "WORKSPACE" : "MEMBER", capabilities, returnPath: `/dashboard/${workspaceId}/integrations` },
    }),
    onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl),
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not start Google connection"),
  });
  const disconnect = useMutation({
    mutationFn: (binding: Binding) => api(wsPath(`/google/bindings/${binding.id}`), { method: "DELETE", headers: { "If-Match": `"${binding.version}"` } }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["google-bindings", workspaceId] });
      toast.success("Google connection disconnected");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not disconnect Google"),
  });
  const testCalendar = useMutation({
    mutationFn: (binding: Binding) => api<CalendarList>(wsPath(`/google/bindings/${binding.id}/calendars`)),
    onSuccess: (result) => {
      const count = result.items?.length ?? 0;
      toast.success(`Calendar connection verified · ${count.toLocaleString()} ${count === 1 ? "calendar" : "calendars"} available`);
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Calendar connection test failed"),
  });
  const testSheets = useMutation({
    mutationFn: (binding: Binding) => api<SpreadsheetList>(wsPath(`/google/bindings/${binding.id}/spreadsheets`)),
    onSuccess: (result) => {
      const count = result.files?.length ?? 0;
      toast.success(count
        ? `Sheets access verified · ${count.toLocaleString()} app-authorized ${count === 1 ? "spreadsheet" : "spreadsheets"} available`
        : "Sheets access verified · select a spreadsheet to create the first managed destination");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Sheets connection test failed"),
  });

  const calendarBindings = bindings.data?.filter((binding) => binding.capabilities.includes("CALENDAR")) ?? [];
  const sheetBindings = bindings.data?.filter((binding) => binding.capabilities.includes("SHEETS")) ?? [];

  return <div className="space-y-5 pb-10">
    <PageHeader title="Integrations" description="Connect each team member's Calendar and one controlled Sheets account for this workspace." icon={<ShieldCheck className="h-5 w-5" />} />
    <div aria-live="polite" className="sr-only">{connect.isPending ? "Opening Google account selection" : disconnect.isPending ? "Disconnecting Google account" : ""}</div>

    {bindings.isLoading ? (
      <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div>
    ) : (
      <div className="grid gap-4 lg:grid-cols-2">
        <IntegrationCard
          icon={<CalendarDays className="h-5 w-5" />}
          title="Google Calendar"
          description="Connect your own Calendar for availability, owner-first routing, invitations and Google Meet links."
          bindings={calendarBindings}
          canConnect={canConnectCalendar}
          restrictedCopy="Every active team member can connect their own Calendar."
          availability={readiness.data?.calendar}
          readinessFailed={readiness.isError}
          isConnecting={connect.isPending}
          disconnectingId={disconnect.variables?.id}
          testingId={testCalendar.isPending ? testCalendar.variables?.id : undefined}
          onTest={(binding) => testCalendar.mutate(binding)}
          onConnect={() => connect.mutate(["CALENDAR"])}
          onDisconnect={(binding) => disconnect.mutate(binding)}
          consequences="Disconnecting stops new routing immediately. Existing Google invitations remain with attendees."
        />
        <IntegrationCard
          icon={<FileSpreadsheet className="h-5 w-5" />}
          title="Google Sheets"
          description="Connect a workspace account for controlled two-way lead views and inspectable conflicts."
          bindings={sheetBindings}
          canConnect={canManageWorkspace}
          restrictedCopy="An Owner or Admin connects Sheets for the workspace."
          availability={readiness.data?.sheets}
          readinessFailed={readiness.isError}
          isConnecting={connect.isPending}
          disconnectingId={disconnect.variables?.id}
          testingId={testSheets.isPending ? testSheets.variables?.id : undefined}
          onTest={(binding) => testSheets.mutate(binding)}
          onConnect={() => connect.mutate(["SHEETS"])}
          onDisconnect={(binding) => disconnect.mutate(binding)}
          consequences="Disconnecting pauses projections. Sheet rows and Google version history are not automatically erased."
        />
      </div>
    )}

    <Card>
      <CardHeader><CardTitle className="text-base">Managed Sheet destinations</CardTitle><CardDescription>Publicly shared files are blocked. Sensitive fields remain export-denied until an Admin explicitly approves them.</CardDescription></CardHeader>
      <CardContent>{destinations.data?.length ? <div className="divide-y divide-border">{destinations.data.map((destination) => <div key={destination.id} className="flex min-h-14 flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">{destination.name} · {destination.sheetTitle}</p><p className="text-xs text-muted-foreground">{destination._count.rows.toLocaleString()} managed rows · {destination._count.conflicts} open conflicts</p></div><div className="flex items-center gap-2"><Badge variant={destination._count.conflicts ? "destructive" : "secondary"}>{destination.status}</Badge><a className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-md px-3 text-sm text-primary transition-colors duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`https://docs.google.com/spreadsheets/d/${destination.spreadsheetId}`} target="_blank" rel="noreferrer">Open <ExternalLink className="h-4 w-4" /></a></div></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">No Sheet destinations configured.</p>}</CardContent>
    </Card>

    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Instagram className="h-5 w-5" />Instagram</CardTitle><CardDescription>Instagram account and webhook settings remain available during the compatibility release.</CardDescription></CardHeader><CardContent><Button variant="outline" className="h-11" asChild><Link href={workspaceId ? `/dashboard/${workspaceId}/connections` : "/dashboard/connections"}>Manage Instagram connection</Link></Button></CardContent></Card>
  </div>;
}

function IntegrationCard({ icon, title, description, bindings, canConnect, restrictedCopy, availability, readinessFailed, isConnecting, disconnectingId, testingId, onConnect, onDisconnect, onTest, consequences }: {
  icon: React.ReactNode;
  title: "Google Calendar" | "Google Sheets";
  description: string;
  bindings: Binding[];
  canConnect: boolean;
  restrictedCopy: string;
  availability?: GoogleAvailability;
  readinessFailed: boolean;
  isConnecting: boolean;
  disconnectingId?: string;
  testingId?: string;
  onConnect: () => void;
  onDisconnect: (binding: Binding) => void;
  onTest?: (binding: Binding) => void;
  consequences: string;
}) {
  const healthy = bindings.some((binding) => binding.status === "ACTIVE");
  const unavailableCopy = googleAvailabilityCopy(availability, readinessFailed);
  const badge = healthy ? "Connected" : googleAvailabilityBadge(availability, readinessFailed);
  return <Card>
    <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle><Badge variant={healthy ? "default" : "secondary"}>{badge}</Badge></div><CardDescription>{description}</CardDescription></CardHeader>
    <CardContent className="space-y-4">
      {bindings.map((binding) => {
        const email = binding.grant.email ?? "Google account";
        const disconnecting = disconnectingId === binding.id;
        const testing = testingId === binding.id;
        return <div key={binding.id} className="rounded-lg border border-border p-3">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="min-w-0"><p className="flex items-center gap-2 truncate text-sm font-medium">{binding.status === "ACTIVE" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <TriangleAlert className="h-4 w-4 shrink-0 text-amber-600" />}{email}</p><p className="mt-1 text-xs text-muted-foreground">{binding.ownership.toLowerCase()} authorization · {binding.status.replaceAll("_", " ").toLowerCase()}</p>{binding.lastErrorCode && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Needs attention: {binding.lastErrorCode.replaceAll("_", " ").toLowerCase()}</p>}</div>
            <div className="flex flex-wrap gap-2">
              {onTest && binding.status === "ACTIVE" && <Button type="button" variant="outline" className="h-11 shrink-0 cursor-pointer" disabled={testing} onClick={() => onTest(binding)} aria-label={`Test ${email} ${title} connection`}>{testing ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <ShieldCheck className="h-4 w-4" />} Test connection</Button>}
              {binding.canDisconnect && <Button type="button" variant="outline" className="h-11 shrink-0 cursor-pointer" disabled={disconnecting} onClick={() => onDisconnect(binding)} aria-label={`Disconnect ${email} from ${title}`}>{disconnecting ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Unplug className="h-4 w-4" />} Disconnect</Button>}
            </div>
          </div>
        </div>;
      })}
      <p className="text-xs leading-5 text-muted-foreground">{consequences}</p>
      {unavailableCopy && <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-700 dark:text-amber-300" role="status">{unavailableCopy}</p>}
      {canConnect ? <Button type="button" className="h-11 w-full cursor-pointer" disabled={!availability?.available || readinessFailed || isConnecting} onClick={onConnect} aria-label={`Connect ${title}`}>{isConnecting ? <><Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> Opening Google…</> : healthy ? `Connect another ${title}` : `Connect ${title}`}</Button> : <p className="text-xs text-muted-foreground">{restrictedCopy}</p>}
    </CardContent>
  </Card>;
}
