"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import type {
  Broadcast,
  IgAccount,
  Segment,
  SegmentPreview,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Megaphone, Send, XCircle } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import NewBroadcastDialog from "./new-broadcast-dialog";

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  QUEUED: "bg-blue-500/10 text-blue-500",
  SENDING: "bg-blue-500/10 text-blue-500",
  COMPLETED: "bg-green-500/10 text-green-500",
  CANCELED: "bg-red-500/10 text-red-500",
};

const StatusChip = ({ status }: { status: string }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize",
      STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT
    )}
  >
    {status === "SENDING" && (
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
    )}
    {status.toLowerCase()}
  </span>
);

const BroadcastsView = () => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const [confirmSend, setConfirmSend] = useState<Broadcast | null>(null);

  const broadcastsQuery = useQuery({
    queryKey: ["broadcasts", workspaceId],
    queryFn: () => api<Broadcast[]>(wsPath("/broadcasts")),
    enabled: !!workspaceId,
    refetchInterval: (query) => {
      const data = query.state.data;
      return data?.some((b) => b.status === "SENDING" || b.status === "QUEUED")
        ? 5000
        : false;
    },
  });

  const igAccountsQuery = useQuery({
    queryKey: ["ig-accounts", workspaceId],
    queryFn: () => api<IgAccount[]>(wsPath("/ig-accounts")),
    enabled: !!workspaceId,
  });

  const segmentsQuery = useQuery({
    queryKey: ["segments", workspaceId],
    queryFn: () => api<Segment[]>(wsPath("/segments")),
    enabled: !!workspaceId,
  });

  const previewQuery = useQuery({
    queryKey: [
      "segment-preview",
      workspaceId,
      confirmSend?.segmentId,
      confirmSend?.igAccountId,
    ],
    queryFn: () =>
      api<SegmentPreview>(
        wsPath(
          `/segments/${confirmSend!.segmentId}/preview?igAccountId=${confirmSend!.igAccountId}`
        )
      ),
    enabled: !!workspaceId && !!confirmSend?.segmentId,
  });

  const sendMutation = useMutation({
    mutationFn: (id: string) =>
      api(wsPath(`/broadcasts/${id}/send`), { method: "POST" }),
    onSuccess: () => {
      toast.success("Broadcast queued for sending");
      queryClient.invalidateQueries({ queryKey: ["broadcasts", workspaceId] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to send broadcast"
      ),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) =>
      api(wsPath(`/broadcasts/${id}/cancel`), { method: "POST" }),
    onSuccess: () => {
      toast.success("Broadcast canceled");
      queryClient.invalidateQueries({ queryKey: ["broadcasts", workspaceId] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel broadcast"
      ),
  });

  const igUsername = (id: string) =>
    igAccountsQuery.data?.find((a) => a.id === id)?.username ?? "—";

  const segmentName = (id: string | null) =>
    id
      ? (segmentsQuery.data?.find((s) => s.id === id)?.name ?? "Segment")
      : "All contacts";

  const broadcasts = broadcastsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-end">
        <NewBroadcastDialog
          igAccounts={igAccountsQuery.data ?? []}
          segments={segmentsQuery.data ?? []}
        />
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        {broadcastsQuery.isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : broadcasts.length === 0 ? (
          <div className="p-12 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3352CC] to-[#1C2D70] mb-4">
              <Megaphone className="h-6 w-6 text-white" />
            </span>
            <h3 className="text-base font-semibold text-foreground mb-1">
              No broadcasts yet
            </h3>
            <p className="text-sm text-muted-foreground">
              Create a broadcast to message many contacts at once.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>IG account</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {broadcasts.map((b) => (
                <TableRow key={b.id} className="hover:bg-accent/50">
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">
                      {b.name}
                    </p>
                    {b.createdAt && (
                      <p className="text-[11px] text-muted-foreground">
                        {formatDistanceToNow(new Date(b.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    @{igUsername(b.igAccountId)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {segmentName(b.segmentId)}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={b.status} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {b.status === "DRAFT"
                      ? "—"
                      : `${b.sentCount ?? 0} sent / ${b.failedCount ?? 0} failed / ${b.skippedCount ?? 0} skipped of ${b.totalTargets ?? 0}`}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {b.status === "DRAFT" && (
                        <Button
                          size="sm"
                          className="h-7 bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
                          onClick={() => setConfirmSend(b)}
                        >
                          <Send className="h-3 w-3 mr-1.5" />
                          Send
                        </Button>
                      )}
                      {(b.status === "QUEUED" || b.status === "SENDING") && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-red-500 hover:text-red-600"
                          disabled={cancelMutation.isPending}
                          onClick={() => cancelMutation.mutate(b.id)}
                        >
                          <XCircle className="h-3 w-3 mr-1.5" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <AlertDialog
        open={!!confirmSend}
        onOpenChange={(open) => !open && setConfirmSend(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send &quot;{confirmSend?.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmSend?.segmentId ? (
                previewQuery.isLoading ? (
                  "Checking audience size…"
                ) : previewQuery.data ? (
                  <>
                    {previewQuery.data.eligible} of {previewQuery.data.total}{" "}
                    contacts are inside the 24-hour window and will receive this
                    message. The rest will be skipped.
                  </>
                ) : (
                  "This broadcast will be sent to the selected segment."
                )
              ) : (
                "This broadcast will be sent to all contacts currently inside the 24-hour messaging window."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
              onClick={() => {
                if (confirmSend) sendMutation.mutate(confirmSend.id);
                setConfirmSend(null);
              }}
            >
              Send broadcast
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BroadcastsView;
