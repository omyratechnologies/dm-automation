"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApi } from "@/hooks/use-api";
import {
  ApiError,
  type FlowDetail,
  type FlowRun,
  type FlowStatus,
  type Page,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import type { FlowDefinition } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addEdge,
  Background,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { format } from "date-fns";
import {
  ArrowLeft,
  History,
  Pause,
  Play,
  Rocket,
  Save,
} from "lucide-react";
import Link from "next/link";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { v4 as uuid } from "uuid";
import { FlowStatusChip } from "../../_components/flows-list";
import { FlowNodeContext, nodeTypes } from "./flow-nodes";

/* ------------------------------------------------------------------ */
/* Palette definitions                                                 */
/* ------------------------------------------------------------------ */

type PaletteItem = {
  type: "trigger" | "condition" | "action";
  label: string;
  data: Record<string, unknown>;
};

const PALETTE: { group: string; items: PaletteItem[] }[] = [
  {
    group: "Triggers",
    items: [
      {
        type: "trigger",
        label: "Keyword DM",
        data: { kind: "keyword", keywords: [], matchType: "contains" },
      },
      {
        type: "trigger",
        label: "Post comment",
        data: {
          kind: "comment",
          keywords: [],
          matchType: "contains",
          postIds: [],
        },
      },
      {
        type: "trigger",
        label: "Story reply",
        data: { kind: "story_reply", keywords: [], matchType: "contains" },
      },
      { type: "trigger", label: "Any message", data: { kind: "any_message" } },
    ],
  },
  {
    group: "Conditions",
    items: [
      {
        type: "condition",
        label: "Text matches",
        data: { kind: "text_matches", keywords: [], matchType: "contains" },
      },
      { type: "condition", label: "Has tag", data: { kind: "has_tag", tag: "" } },
      {
        type: "condition",
        label: "Inside 24h window",
        data: { kind: "within_window" },
      },
    ],
  },
  {
    group: "Actions",
    items: [
      {
        type: "action",
        label: "Send message",
        data: { kind: "send_message", text: "", quickReplies: [] },
      },
      { type: "action", label: "AI reply", data: { kind: "ai_reply", prompt: "" } },
      { type: "action", label: "Lead Qualifier", data: { kind: "lead_qualify", prompt: "" } },
      { type: "action", label: "Add tag", data: { kind: "add_tag", tag: "" } },
      {
        type: "action",
        label: "Remove tag",
        data: { kind: "remove_tag", tag: "" },
      },
      {
        type: "action",
        label: "Handoff to human",
        data: { kind: "handoff_human" },
      },
      { type: "action", label: "Wait", data: { kind: "wait", seconds: 60 } },
    ],
  },
];

const edgeLabel = (sourceHandle?: string | null) =>
  sourceHandle === "true" ? "✓" : sourceHandle === "false" ? "✗" : undefined;

/* ------------------------------------------------------------------ */
/* Canvas                                                              */
/* ------------------------------------------------------------------ */

const BuilderCanvas = ({ flow }: { flow: FlowDetail }) => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const [runsOpen, setRunsOpen] = useState(false);
  const [name, setName] = useState(flow.name);

  const definition = (flow.draftDefinition ??
    flow.activeDefinition) as FlowDefinition | null;

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>(
    (definition?.nodes ?? []).map((n, i) => ({
      id: n.id,
      type: n.type,
      data: { ...n.data } as Record<string, unknown>,
      position: n.position ?? {
        x: 120 + (i % 3) * 320,
        y: 80 + Math.floor(i / 3) * 260,
      },
    }))
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    (definition?.edges ?? []).map((e) => ({
      id: e.id,
      source: e.from,
      target: e.to,
      sourceHandle:
        e.branch === "true" || e.branch === "false" ? e.branch : undefined,
      label: edgeLabel(e.branch),
    }))
  );

  const hasTrigger = nodes.some((n) => n.type === "trigger");

  const updateNodeData = useCallback(
    (id: string, patch: Record<string, unknown>) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, ...patch } } : n
        )
      );
    },
    [setNodes]
  );

  const nodeContext = useMemo(() => ({ updateNodeData }), [updateNodeData]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `edge-${uuid()}`,
            label: edgeLabel(connection.sourceHandle),
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const addNode = (item: PaletteItem) => {
    if (item.type === "trigger" && hasTrigger) return;
    const id = `${(item.data.kind as string) ?? item.type}-${uuid().slice(0, 8)}`;
    setNodes((nds) => [
      ...nds,
      {
        id,
        type: item.type,
        data: { ...item.data },
        position: {
          x: 160 + ((nds.length * 40) % 240),
          y: 100 + ((nds.length * 60) % 360),
        },
      },
    ]);
  };

  const toDefinition = () => ({
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type as "trigger" | "condition" | "action",
      data: n.data,
      position: { x: n.position.x, y: n.position.y },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      from: e.source,
      to: e.target,
      branch:
        e.sourceHandle === "true"
          ? ("true" as const)
          : e.sourceHandle === "false"
            ? ("false" as const)
            : ("default" as const),
    })),
  });

  const invalidateFlow = () => {
    queryClient.invalidateQueries({ queryKey: ["flow", workspaceId, flow.id] });
    queryClient.invalidateQueries({ queryKey: ["flows", workspaceId] });
  };

  const saveMutation = useMutation({
    mutationFn: () =>
      api(wsPath(`/flows/${flow.id}/draft`), {
        method: "PUT",
        body: { definition: toDefinition() },
      }),
    onSuccess: () => {
      toast.success("Draft saved");
      invalidateFlow();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to save draft"
      ),
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      await api(wsPath(`/flows/${flow.id}/draft`), {
        method: "PUT",
        body: { definition: toDefinition() },
      });
      return api(wsPath(`/flows/${flow.id}/publish`), { method: "POST" });
    },
    onSuccess: () => {
      toast.success("Flow published");
      invalidateFlow();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.issues?.length) {
        for (const issue of error.issues as {
          path?: string;
          message?: string;
        }[]) {
          toast.error(
            issue.path
              ? `${issue.path}: ${issue.message ?? "invalid"}`
              : (issue.message ?? "Validation error")
          );
        }
      } else {
        toast.error(
          error instanceof Error ? error.message : "Failed to publish flow"
        );
      }
    },
  });

  const patchMutation = useMutation({
    mutationFn: (body: { name?: string; status?: FlowStatus }) =>
      api(wsPath(`/flows/${flow.id}`), { method: "PATCH", body }),
    onSuccess: (_data, body) => {
      if (body.status) {
        toast.success(
          body.status === "ACTIVE" ? "Flow activated" : "Flow paused"
        );
      }
      invalidateFlow();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update flow"
      ),
  });

  const runsQuery = useQuery({
    queryKey: ["flow-runs", workspaceId, flow.id],
    queryFn: () => api<Page<FlowRun>>(wsPath(`/flows/${flow.id}/runs`)),
    enabled: !!workspaceId && runsOpen,
  });

  return (
    <FlowNodeContext.Provider value={nodeContext}>
      <div className="flex flex-col gap-y-3 h-[calc(100vh-140px)] min-h-[600px]">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
          <Link
            href="/dashboard/flows"
            className="text-muted-foreground hover:text-foreground transition-colors duration-quiet"
            aria-label="Back to flows"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const trimmed = name.trim();
              if (trimmed && trimmed !== flow.name) {
                patchMutation.mutate({ name: trimmed });
              }
            }}
            className="h-8 w-[200px] font-medium"
          />
          <FlowStatusChip status={flow.status} />

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Sheet open={runsOpen} onOpenChange={setRunsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <History className="h-3.5 w-3.5 mr-1.5" />
                  Runs
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Flow runs</SheetTitle>
                  <SheetDescription>
                    Recent executions of this flow.
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-4">
                  {runsQuery.isLoading ? (
                    <div className="space-y-2">
                      {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                      ))}
                    </div>
                  ) : (runsQuery.data?.items ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground py-8 text-center">
                      No runs yet.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(runsQuery.data?.items ?? []).map((run: FlowRun) => (
                          <TableRow key={run.id}>
                            <TableCell>
                              <span
                                className={cn(
                                  "px-2 py-0.5 rounded-full text-[11px] font-medium",
                                  run.status === "COMPLETED"
                                    ? "bg-success/10 text-success"
                                    : run.status === "FAILED"
                                      ? "bg-destructive/10 text-destructive"
                                      : "bg-muted text-muted-foreground"
                                )}
                              >
                                {run.status ?? "—"}
                              </span>
                            </TableCell>
                            <TableCell className="text-xs">
                              {run.contact?.username
                                ? `@${run.contact.username}`
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {run.startedAt
                                ? format(
                                    new Date(run.startedAt),
                                    "MMM d, HH:mm"
                                  )
                                : "—"}
                            </TableCell>
                            <TableCell className="text-xs text-destructive max-w-[160px] truncate">
                              {run.error ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {flow.status === "ACTIVE" ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={patchMutation.isPending}
                onClick={() => patchMutation.mutate({ status: "PAUSED" })}
              >
                <Pause className="h-3.5 w-3.5 mr-1.5" />
                Pause
              </Button>
            ) : flow.status === "PAUSED" ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8"
                disabled={patchMutation.isPending}
                onClick={() => patchMutation.mutate({ status: "ACTIVE" })}
              >
                <Play className="h-3.5 w-3.5 mr-1.5" />
                Activate
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate()}
            >
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saveMutation.isPending ? "Saving…" : "Save draft"}
            </Button>
            <Button
              size="sm"
              className="h-8"
              disabled={publishMutation.isPending}
              onClick={() => publishMutation.mutate()}
            >
              <Rocket className="h-3.5 w-3.5 mr-1.5" />
              {publishMutation.isPending ? "Publishing…" : "Publish"}
            </Button>
          </div>
        </div>

        {/* Palette + canvas */}
        <div className="flex flex-col md:flex-row flex-1 gap-3 min-h-0">
          <div className="w-full md:w-52 shrink-0 rounded-xl border border-border bg-card p-3 overflow-y-auto space-y-4">
            {PALETTE.map((group) => (
              <div key={group.group}>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                  {group.group}
                </p>
                <div className="space-y-1 flex flex-row md:flex-col gap-1.5 md:gap-1 flex-wrap md:flex-nowrap">
                  {group.items.map((item) => {
                    const disabled = item.type === "trigger" && hasTrigger;
                    return (
                      <button
                        key={item.label}
                        onClick={() => addNode(item)}
                        disabled={disabled}
                        title={
                          disabled
                            ? "A flow can only have one trigger"
                            : `Add ${item.label}`
                        }
                        className={cn(
                          "px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors duration-quiet text-left shrink-0 md:shrink md:w-full",
                          disabled
                            ? "border-border text-muted-foreground/50 cursor-not-allowed"
                            : "border-border text-foreground hover:border-hairline-strong hover:bg-accent"
                        )}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-y-2 min-h-[400px]">
            <div className="md:hidden p-3 rounded-lg bg-warning/10 border border-warning/20 text-warning text-xs font-medium">
              Canvas is optimized for larger screens. Use a desktop to build complex flows.
            </div>
            <div className="flex-1 rounded-xl border border-border overflow-hidden bg-card relative">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                proOptions={{ hideAttribution: true }}
                deleteKeyCode={["Backspace", "Delete"]}
              >
                <Background gap={20} />
                <Controls />
              </ReactFlow>
            </div>
          </div>
        </div>
      </div>
    </FlowNodeContext.Provider>
  );
};

/* ------------------------------------------------------------------ */
/* Loader wrapper                                                      */
/* ------------------------------------------------------------------ */

const FlowBuilder = ({ flowId }: { flowId: string }) => {
  const { api, wsPath, workspaceId } = useApi();

  const flowQuery = useQuery({
    queryKey: ["flow", workspaceId, flowId],
    queryFn: () => api<FlowDetail>(wsPath(`/flows/${flowId}`)),
    enabled: !!workspaceId,
  });

  if (flowQuery.isLoading || !workspaceId) {
    return (
      <div className="flex flex-col gap-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="flex gap-3">
          <Skeleton className="h-[520px] w-52 rounded-xl" />
          <Skeleton className="h-[520px] flex-1 rounded-xl" />
        </div>
      </div>
    );
  }

  if (flowQuery.isError || !flowQuery.data) {
    return (
      <div className="p-8 rounded-xl border border-destructive/20 bg-card text-center">
        <p className="text-sm text-muted-foreground mb-4">
          Failed to load this flow.
        </p>
        <Button variant="outline" onClick={() => flowQuery.refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return <BuilderCanvas key={flowQuery.data.id} flow={flowQuery.data} />;
};

export default FlowBuilder;
