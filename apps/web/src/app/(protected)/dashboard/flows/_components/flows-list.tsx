"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import type { FlowStatus, FlowSummary } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Plus, Workflow } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

export const FLOW_STATUS_STYLES: Record<FlowStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  ACTIVE: "bg-success/10 text-success",
  PAUSED: "bg-warning/10 text-warning",
};

export const FlowStatusChip = ({ status }: { status: FlowStatus }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium capitalize",
      FLOW_STATUS_STYLES[status] ?? FLOW_STATUS_STYLES.DRAFT
    )}
  >
    <span
      className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "ACTIVE"
          ? "bg-success"
          : status === "PAUSED"
            ? "bg-warning"
            : "bg-muted-foreground"
      )}
    />
    {status.toLowerCase()}
  </span>
);

const FlowsList = () => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const flowsQuery = useQuery({
    queryKey: ["flows", workspaceId],
    queryFn: () => api<FlowSummary[]>(wsPath("/flows")),
    enabled: !!workspaceId,
  });

  const createMutation = useMutation({
    mutationFn: (flowName: string) =>
      api<FlowSummary>(wsPath("/flows"), {
        method: "POST",
        body: { name: flowName },
      }),
    onSuccess: (flow) => {
      queryClient.invalidateQueries({ queryKey: ["flows", workspaceId] });
      toast.success("Flow created");
      setOpen(false);
      setName("");
      router.push(`/dashboard/flows/${flow.id}`);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to create flow"
      ),
  });

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New flow
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create a flow</DialogTitle>
              <DialogDescription>
                Give your flow a name — you can build it in the editor next.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="flow-name">Name</Label>
              <Input
                id="flow-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Comment to DM funnel"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) {
                    createMutation.mutate(name.trim());
                  }
                }}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={() => createMutation.mutate(name.trim())}
                disabled={!name.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating…" : "Create flow"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {flowsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : flowsQuery.isError ? (
        <div className="p-8 rounded-xl border border-destructive/20 bg-card text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Failed to load flows.
          </p>
          <Button variant="outline" onClick={() => flowsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : (flowsQuery.data ?? []).length === 0 ? (
        <div className="p-12 rounded-xl border border-border bg-card text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
            <Workflow className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            No flows yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Create your first flow to start automating replies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {(flowsQuery.data ?? []).map((flow) => (
            <Link
              key={flow.id}
              href={`/dashboard/flows/${flow.id}`}
              className="group flex flex-col gap-y-3 p-4 rounded-xl border border-border bg-card
                transition-all duration-quiet ease-quiet
                hover:border-hairline-strong hover:bg-accent"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <Workflow className="h-4 w-4" />
                </div>
                <FlowStatusChip status={flow.status} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors duration-quiet">
                  {flow.name}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {flow.updatedAt
                    ? `Updated ${formatDistanceToNow(new Date(flow.updatedAt), {
                        addSuffix: true,
                      })}`
                    : "Never updated"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default FlowsList;
