"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarDays, CheckCircle2, ExternalLink, FileSpreadsheet, Instagram, ShieldCheck, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import PageHeader from "@/components/global/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";

type Binding = { id: string; ownership: "MEMBER" | "WORKSPACE"; capabilities: Array<"CALENDAR" | "SHEETS">; status: string; version: number; lastHealthAt: string | null; lastErrorCode: string | null; grant: { email: string | null; scopes: string[] } };
type Destination = { id: string; name: string; status: string; spreadsheetId: string; sheetTitle: string; lastSyncedAt: string | null; lastErrorCode: string | null; _count: { conflicts: number; rows: number } };

export default function IntegrationsPage() {
  const { api, wsPath, workspaceId, workspace } = useApi();
  const canManage = workspace?.role === "OWNER" || workspace?.role === "ADMIN";
  const bindings = useQuery<Binding[]>({ queryKey: ["google-bindings", workspaceId], queryFn: () => api(wsPath("/google/bindings")), enabled: !!workspaceId });
  const destinations = useQuery<Destination[]>({ queryKey: ["sheet-destinations", workspaceId], queryFn: () => api(wsPath("/sheets/destinations")), enabled: !!workspaceId });
  const connect = useMutation({ mutationFn: (capabilities: Array<"CALENDAR" | "SHEETS">) => api<{ authorizationUrl: string }>(wsPath("/google/oauth-sessions"), { method: "POST", body: { ownership: capabilities.includes("SHEETS") ? "WORKSPACE" : "MEMBER", capabilities, returnPath: `/dashboard/${workspaceId}/integrations` } }), onSuccess: ({ authorizationUrl }) => window.location.assign(authorizationUrl), onError: (error) => toast.error(error instanceof Error ? error.message : "Could not start Google connection") });
  const calendarBindings = bindings.data?.filter((binding) => binding.capabilities.includes("CALENDAR")) ?? [];
  const sheetBindings = bindings.data?.filter((binding) => binding.capabilities.includes("SHEETS")) ?? [];
  return <div className="space-y-5 pb-10"><PageHeader title="Integrations" description="One secure Google connection center with independent Calendar and Sheets controls." icon={<ShieldCheck className="h-5 w-5" />} />
    {bindings.isLoading ? <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72 rounded-xl" /><Skeleton className="h-72 rounded-xl" /></div> : <div className="grid gap-4 lg:grid-cols-2">
      <IntegrationCard icon={<CalendarDays className="h-5 w-5" />} title="Google Calendar" description="Availability, owner-first host routing, Meet links and conflict reconciliation." bindings={calendarBindings} canManage={canManage} onConnect={() => connect.mutate(["CALENDAR"])} consequences="Disconnecting stops new routing immediately. Existing Google invitations remain with attendees." />
      <IntegrationCard icon={<FileSpreadsheet className="h-5 w-5" />} title="Google Sheets" description="Controlled two-way lead views with version checks and inspectable conflicts." bindings={sheetBindings} canManage={canManage} onConnect={() => connect.mutate(["SHEETS"])} consequences="Disconnecting pauses projections. Sheet rows and Google version history are not automatically erased." />
    </div>}
    <Card><CardHeader><CardTitle className="text-base">Managed Sheet destinations</CardTitle><CardDescription>Publicly shared files are blocked. Sensitive fields remain export-denied until an Admin explicitly approves them.</CardDescription></CardHeader><CardContent>{destinations.data?.length ? <div className="divide-y divide-border">{destinations.data.map((destination) => <div key={destination.id} className="flex min-h-14 flex-col justify-between gap-2 py-3 sm:flex-row sm:items-center"><div><p className="text-sm font-medium">{destination.name} · {destination.sheetTitle}</p><p className="text-xs text-muted-foreground">{destination._count.rows.toLocaleString()} managed rows · {destination._count.conflicts} open conflicts</p></div><div className="flex items-center gap-2"><Badge variant={destination._count.conflicts ? "destructive" : "secondary"}>{destination.status}</Badge><a className="inline-flex h-11 items-center gap-2 rounded-md px-3 text-sm text-primary hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`https://docs.google.com/spreadsheets/d/${destination.spreadsheetId}`} target="_blank" rel="noreferrer">Open <ExternalLink className="h-4 w-4" /></a></div></div>)}</div> : <p className="py-8 text-center text-sm text-muted-foreground">No Sheet destinations configured.</p>}</CardContent></Card>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><Instagram className="h-5 w-5" />Instagram</CardTitle><CardDescription>Instagram account and webhook settings remain available during the compatibility release.</CardDescription></CardHeader><CardContent><Button variant="outline" className="h-11" asChild><Link href={workspaceId ? `/dashboard/${workspaceId}/connections` : "/dashboard/connections"}>Manage Instagram connection</Link></Button></CardContent></Card>
  </div>;
}

function IntegrationCard({ icon, title, description, bindings, canManage, onConnect, consequences }: { icon: React.ReactNode; title: string; description: string; bindings: Binding[]; canManage: boolean; onConnect: () => void; consequences: string }) {
  const healthy = bindings.some((binding) => binding.status === "ACTIVE");
  return <Card><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base">{icon}{title}</CardTitle><Badge variant={healthy ? "default" : "secondary"}>{healthy ? "Connected" : "Not connected"}</Badge></div><CardDescription>{description}</CardDescription></CardHeader><CardContent className="space-y-4">{bindings.map((binding) => <div key={binding.id} className="rounded-lg border border-border p-3"><p className="flex items-center gap-2 text-sm font-medium">{binding.status === "ACTIVE" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <TriangleAlert className="h-4 w-4 text-amber-600" />}{binding.grant.email ?? "Google account"}</p><p className="mt-1 text-xs text-muted-foreground">{binding.ownership.toLowerCase()} authorization · {binding.status.replace("_", " ").toLowerCase()}</p></div>)}<p className="text-xs leading-5 text-muted-foreground">{consequences}</p>{canManage && <Button className="h-11 w-full" onClick={onConnect}>Connect or expand access</Button>}{!canManage && <p className="text-xs text-muted-foreground">An Owner or Admin manages this connection.</p>}</CardContent></Card>;
}
