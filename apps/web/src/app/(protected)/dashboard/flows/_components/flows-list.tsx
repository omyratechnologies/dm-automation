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
  ACTIVE: "bg-green-500/10 text-green-500",
  PAUSED: "bg-amber-500/10 text-amber-500",
};

export const FlowStatusChip = ({ status }: { status: FlowStatus }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
      FLOW_STATUS_STYLES[status] ?? FLOW_STATUS_STYLES.DRAFT
    )}
  >
    <span
      className={cn(
        "w-1.5 h-1.5 rounded-full",
        status === "ACTIVE"
          ? "bg-green-500"
          : status === "PAUSED"
            ? "bg-amber-500"
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
            <Button className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90">
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
                className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
              >
                {createMutation.isPending ? "Creating…" : "Create flow"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {flowsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : flowsQuery.isError ? (
        <div className="p-8 rounded-xl bg-card border border-red-500/20 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Failed to load flows.
          </p>
          <Button variant="outline" onClick={() => flowsQuery.refetch()}>
            Retry
          </Button>
        </div>
      ) : (flowsQuery.data ?? []).length === 0 ? (
        <div className="p-12 rounded-2xl bg-card border border-border text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3352CC] to-[#1C2D70] mb-4">
            <Workflow className="h-7 w-7 text-white" />
          </span>
          <h3 className="text-lg font-semibold text-foreground mb-1">
            No flows yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Create your first flow to start automating replies.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(flowsQuery.data ?? []).map((flow) => (
            <Link
              key={flow.id}
              href={`/dashboard/flows/${flow.id}`}
              className="group flex flex-col gap-y-3 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#3352CC] to-[#1C2D70] shrink-0">
                  <Workflow className="h-5 w-5 text-white" />
                </span>
                <FlowStatusChip status={flow.status} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
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
