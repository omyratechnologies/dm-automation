"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Columns3, List, Search, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { useApi } from "@/hooks/use-api";
import type { Page } from "@/lib/api";
import PageHeader from "@/components/global/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

type Stage = { id: string; name: string; funnelCategory: string; position: number; color: string };
type Pipeline = { id: string; name: string; isDefault: boolean; stages: Stage[] };
type Lead = {
  id: string; version: number; score: number; priority: string; source: string;
  ownerMembershipId: string | null; nextActionAt: string | null; createdAt: string; updatedAt: string;
  pipeline: { id: string; name: string }; stage: Stage;
  owner: { user: { firstname: string | null; lastname: string | null; email: string } } | null;
  contact: { name: string | null; username: string | null; profilePicUrl: string | null; tags: string[]; fieldValues: Array<{ id: string; value: string; field: { id: string; key: string; label: string } }> };
};

const stageTone: Record<string, string> = {
  NEW: "border-slate-300", ENGAGING: "border-blue-400", QUALIFIED: "border-violet-400",
  MEETING_BOOKED: "border-cyan-400", PROPOSAL: "border-amber-400", WON: "border-emerald-400", LOST: "border-rose-400",
};

export default function LeadsPage() {
  const { api, wsPath, workspaceId } = useApi();
  const searchParams = useSearchParams();
  const routeSearch = searchParams.get("search") ?? "";
  const queryClient = useQueryClient();
  const [view, setView] = useState<"board" | "list">("board");
  const [needsAttention, setNeedsAttention] = useState(true);
  const [search, setSearch] = useState(routeSearch);
  const [pipelineId, setPipelineId] = useState<string>("all");
  const [selected, setSelected] = useState<Lead | null>(null);
  const leadSearchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const applySearch = (value: string) => {
      setSearch(value);
      // Browsers can restore a previous form value after hydration. Keep the
      // visible filter aligned with the URL even when React state is unchanged.
      if (leadSearchRef.current) leadSearchRef.current.value = value;
    };
    const syncFromUrl = () => applySearch(new URLSearchParams(window.location.search).get("search") ?? "");
    const syncFromGlobalSearch = (event: Event) => applySearch((event as CustomEvent<string>).detail ?? "");
    syncFromUrl();
    const restoreTimer = window.setTimeout(() => {
      // Chromium may restore form controls after hydration. Do one late repair,
      // but never replace text while the user is already editing this field.
      if (document.activeElement !== leadSearchRef.current) syncFromUrl();
    }, 1_000);
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("pageshow", syncFromUrl);
    window.addEventListener("gemai:lead-search", syncFromGlobalSearch);
    return () => {
      window.clearTimeout(restoreTimer);
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("pageshow", syncFromUrl);
      window.removeEventListener("gemai:lead-search", syncFromGlobalSearch);
    };
  }, [routeSearch]);

  const { data: pipelines = [] } = useQuery<Pipeline[]>({ queryKey: ["lead-pipelines", workspaceId], queryFn: () => api(wsPath("/pipelines")), enabled: !!workspaceId });
  const query = new URLSearchParams({ limit: "100", ...(search ? { search } : {}), ...(pipelineId !== "all" ? { pipelineId } : {}), ...(needsAttention ? { view: "needs-attention" } : {}) });
  const { data, isLoading } = useQuery<Page<Lead>>({ queryKey: ["leads", workspaceId, search, pipelineId, needsAttention], queryFn: () => api(wsPath(`/leads?${query}`)), enabled: !!workspaceId });
  const leads = useMemo(() => data?.items ?? [], [data?.items]);
  const pipeline = pipelines.find((item) => item.id === pipelineId) ?? pipelines.find((item) => item.isDefault) ?? pipelines[0];

  const transition = useMutation({
    mutationFn: ({ lead, stageId }: { lead: Lead; stageId: string }) => api(wsPath(`/leads/${lead.id}/stage-transitions`), { method: "POST", headers: { "If-Match": String(lead.version) }, body: { stageId, reopen: false } }),
    onSuccess: () => { toast.success("Lead stage updated"); queryClient.invalidateQueries({ queryKey: ["leads", workspaceId] }); },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not move lead"),
  });

  const grouped = useMemo(() => new Map((pipeline?.stages ?? []).map((stage) => [stage.id, leads.filter((lead) => lead.stage.id === stage.id)])), [pipeline, leads]);

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader title="Leads" description="Qualify, assign and advance every opportunity from one workspace pipeline." icon={<UserCheck className="h-5 w-5" />} />

      <section aria-label="Lead controls" className="flex flex-col gap-3 rounded-xl border border-border bg-card p-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1 lg:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input ref={leadSearchRef} autoComplete="off" aria-label="Search leads" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, handle, email or phone" className="h-11 pl-9" />
        </div>
        <Select value={pipelineId} onValueChange={setPipelineId}>
          <SelectTrigger aria-label="Select pipeline" className="h-11 w-full lg:w-52"><SelectValue placeholder="All pipelines" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All pipelines</SelectItem>{pipelines.map((item) => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
        <Button variant={needsAttention ? "default" : "outline"} className="h-11" onClick={() => setNeedsAttention((value) => !value)} aria-pressed={needsAttention}><AlertCircle className="mr-2 h-4 w-4" />Needs attention</Button>
        <div className="flex rounded-lg border border-border p-1" aria-label="Lead view">
          <Button size="icon" variant={view === "board" ? "secondary" : "ghost"} className="h-11 w-11" onClick={() => setView("board")} aria-label="Board view" aria-pressed={view === "board"}><Columns3 className="h-4 w-4" /></Button>
          <Button size="icon" variant={view === "list" ? "secondary" : "ghost"} className="h-11 w-11" onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"}><List className="h-4 w-4" /></Button>
        </div>
      </section>

      {isLoading ? <Loading /> : view === "board" ? (
        <div className="grid auto-cols-[minmax(280px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-3" role="region" aria-label="Lead pipeline board" tabIndex={0}>
          {(pipeline?.stages ?? []).map((stage) => <section key={stage.id} className="min-h-[520px] rounded-xl border border-border bg-muted/30 p-3" aria-labelledby={`stage-${stage.id}`}>
            <div className={cn("mb-3 flex items-center justify-between border-t-2 pt-3", stageTone[stage.funnelCategory] ?? "border-slate-300")}><h2 id={`stage-${stage.id}`} className="text-sm font-semibold">{stage.name}</h2><Badge variant="secondary">{grouped.get(stage.id)?.length ?? 0}</Badge></div>
            <div className="space-y-2">{(grouped.get(stage.id) ?? []).map((lead) => <LeadCard key={lead.id} lead={lead} stages={pipeline?.stages ?? []} onOpen={setSelected} onMove={(stageId) => transition.mutate({ lead, stageId })} />)}</div>
          </section>)}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card"><div className="hidden grid-cols-[2fr_1fr_100px_1fr_160px] gap-4 border-b border-border px-4 py-3 text-xs font-medium text-muted-foreground md:grid"><span>Lead</span><span>Stage</span><span>Score</span><span>Owner</span><span>Updated</span></div>{leads.map((lead) => <button key={lead.id} className="grid min-h-14 w-full grid-cols-1 gap-2 border-b border-border px-4 py-3 text-left last:border-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring md:grid-cols-[2fr_1fr_100px_1fr_160px] md:items-center" onClick={() => setSelected(lead)}><LeadIdentity lead={lead} /><span className="text-sm">{lead.stage.name}</span><span className="text-sm font-semibold">{lead.score}</span><span className="truncate text-sm text-muted-foreground">{ownerName(lead)}</span><span className="text-xs text-muted-foreground">{new Date(lead.updatedAt).toLocaleString()}</span></button>)}</div>
      )}

      {!isLoading && leads.length === 0 && <div className="rounded-xl border border-dashed border-border py-16 text-center"><UserCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">No leads match this view</p><p className="mt-1 text-sm text-muted-foreground">Change the filters or capture a new lead through Instagram, API or Sheets.</p></div>}

      <LeadDrawer lead={selected} open={!!selected} onOpenChange={(open) => !open && setSelected(null)} />
    </div>
  );
}

function LeadCard({ lead, stages, onOpen, onMove }: { lead: Lead; stages: Stage[]; onOpen: (lead: Lead) => void; onMove: (stageId: string) => void }) {
  return <article className="rounded-lg border border-border bg-background p-3 shadow-sm"><button onClick={() => onOpen(lead)} className="flex min-h-11 w-full items-center gap-3 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><LeadIdentity lead={lead} /></button><div className="mt-3 flex items-center justify-between"><Badge variant={lead.score >= 80 ? "default" : "secondary"}>Score {lead.score}</Badge><span className="text-xs text-muted-foreground">{ownerName(lead)}</span></div><Select value={lead.stage.id} onValueChange={onMove}><SelectTrigger className="mt-3 h-11" aria-label={`Move ${displayName(lead)} to stage`}><SelectValue /></SelectTrigger><SelectContent>{stages.map((stage) => <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>)}</SelectContent></Select></article>;
}

function LeadIdentity({ lead }: { lead: Lead }) { const name = displayName(lead); return <div className="flex min-w-0 items-center gap-3"><Avatar className="h-9 w-9"><AvatarImage src={lead.contact.profilePicUrl ?? undefined} /><AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0"><span className="block truncate text-sm font-medium">{name}</span><span className="block truncate text-xs text-muted-foreground">{lead.contact.username ? `@${lead.contact.username}` : lead.source.toLowerCase()}</span></span></div>; }
function displayName(lead: Lead) { return lead.contact.name || lead.contact.username || "Unnamed lead"; }
function ownerName(lead: Lead) { return lead.owner ? [lead.owner.user.firstname, lead.owner.user.lastname].filter(Boolean).join(" ") || lead.owner.user.email : "Unassigned"; }

function LeadDrawer({ lead, open, onOpenChange }: { lead: Lead | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-full overflow-y-auto p-5 sm:max-w-[700px]"><SheetHeader><SheetTitle>{lead ? displayName(lead) : "Lead"}</SheetTitle><SheetDescription>{lead ? `${lead.pipeline.name} · ${lead.stage.name} · revision ${lead.version}` : "Lead details"}</SheetDescription></SheetHeader>{lead && <Tabs defaultValue="overview" className="mt-6"><TabsList className="grid h-auto w-full grid-cols-4"><TabsTrigger className="min-h-11" value="overview">Overview</TabsTrigger><TabsTrigger className="min-h-11" value="activity">Activity</TabsTrigger><TabsTrigger className="min-h-11" value="conversation">Conversation</TabsTrigger><TabsTrigger className="min-h-11" value="sync">Sync</TabsTrigger></TabsList><TabsContent value="overview" className="space-y-4 pt-4"><Detail label="Owner" value={ownerName(lead)} /><Detail label="Score" value={`${lead.score}/100`} /><Detail label="Priority" value={lead.priority} /><Detail label="Source" value={lead.source} /><Detail label="Next action" value={lead.nextActionAt ? new Date(lead.nextActionAt).toLocaleString() : "Not scheduled"} /></TabsContent><TabsContent value="activity" className="py-8 text-sm text-muted-foreground">Open the activity stream to inspect immutable changes and decisions.</TabsContent><TabsContent value="conversation" className="py-8 text-sm text-muted-foreground">The Instagram conversation remains linked to this lead.</TabsContent><TabsContent value="sync" className="py-8 text-sm text-muted-foreground">Calendar and Sheet projection health appears here when connected.</TabsContent></Tabs>}</SheetContent></Sheet>;
}
function Detail({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium">{value}</span></div>; }
function Loading() { return <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-[520px] rounded-xl" />)}</div>; }
