"use client";

import React, { useState, useTransition } from "react";
import { getWebhookEventsList, retryWebhookEvent } from "@/actions/admin";
import type { WebhookEventListItem } from "@/actions/admin";
import { 
  Activity, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
  X,
  Code
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Props = {
  initialData: { items: WebhookEventListItem[]; total: number };
};

export default function AdminWebhooksClient({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventListItem | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isActionPending, startActionTransition] = useTransition();

  const fetchWebhooks = (pageNum: number, status: string) => {
    startTransition(async () => {
      const res = await getWebhookEventsList(pageNum, 15, status || undefined);
      if (res.status === 200) {
        setData(res.data);
      }
    });
  };

  const handleStatusChange = (status: string) => {
    setStatusFilter(status);
    setPage(1);
    fetchWebhooks(1, status);
  };

  const handlePageChange = (direction: "prev" | "next") => {
    const newPage = direction === "prev" ? page - 1 : page + 1;
    setPage(newPage);
    fetchWebhooks(newPage, statusFilter);
  };

  const handleRetry = (eventId: string) => {
    startActionTransition(async () => {
      const res = await retryWebhookEvent(eventId);
      if (res.status === 200) {
        toast.success("Webhook event re-enqueued successfully!");
        // Refresh list
        fetchWebhooks(page, statusFilter);
        // Refresh detail overlay if matching
        if (selectedEventId === eventId) {
          setSelectedEvent((prev) => prev ? { ...prev, status: "RECEIVED", error: null } : null);
        }
      } else {
        toast.error("Failed to retry webhook event");
      }
    });
  };

  const totalPages = Math.ceil(data.total / 15);

  return (
    <div className="flex gap-x-6 relative min-h-[500px]">
      {/* Logs Table */}
      <div className="flex-1 flex flex-col gap-y-4">
        {/* Filters */}
        <div className="flex items-center justify-between">
          <div className="flex gap-x-2">
            {["", "RECEIVED", "PROCESSED", "FAILED", "DUPLICATE"].map((status) => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={cn(
                  "px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all",
                  statusFilter === status 
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                {status === "" ? "All Events" : status}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchWebhooks(page, statusFilter)}
            disabled={isPending}
            className="flex items-center gap-x-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-all cursor-pointer"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} />
            Refresh Logs
          </button>
        </div>

        {/* Table */}
        <div className="border border-border bg-card/50 rounded-2xl overflow-hidden shadow-sm">
          {isPending ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : data.items.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              No webhook events found matching selected filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                    <th className="p-4">Event Key / ID</th>
                    <th className="p-4">Provider</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Received At</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => {
                        setSelectedEvent(item);
                        setSelectedEventId(item.id);
                      }}
                      className={cn(
                        "border-b border-border/60 hover:bg-muted/30 transition-colors cursor-pointer",
                        selectedEventId === item.id && "bg-primary/5 hover:bg-primary/5"
                      )}
                    >
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-mono text-xs font-bold text-foreground max-w-[200px] truncate">
                            {item.eventKey}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.id}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-muted-foreground uppercase">
                        {item.provider}
                      </td>
                      <td className="p-4">
                        <span className={cn(
                          "inline-flex items-center gap-x-1.5 text-xs px-2 py-0.5 rounded-full border font-semibold uppercase",
                          item.status === "PROCESSED" && "bg-green-500/10 border-green-500/20 text-green-400",
                          item.status === "RECEIVED" && "bg-blue-500/10 border-blue-500/20 text-blue-400",
                          item.status === "FAILED" && "bg-red-500/10 border-red-500/20 text-red-400",
                          item.status === "DUPLICATE" && "bg-neutral-500/10 border-neutral-500/20 text-neutral-400"
                        )}>
                          {item.status === "PROCESSED" && <CheckCircle2 className="h-3 w-3" />}
                          {item.status === "FAILED" && <XCircle className="h-3 w-3" />}
                          {item.status === "RECEIVED" && <Loader2 className="h-3 w-3 animate-spin" />}
                          {item.status === "DUPLICATE" && <AlertTriangle className="h-3 w-3" />}
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-muted-foreground">
                        {new Date(item.receivedAt).toLocaleString()}
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleRetry(item.id)}
                          disabled={isActionPending}
                          className="inline-flex items-center gap-x-1 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 text-xs font-bold text-primary transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Play className="h-3 w-3 fill-primary" />
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border p-4 bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} ({data.total} total webhook logs)
              </span>
              <div className="flex gap-x-2">
                <button
                  onClick={() => handlePageChange("prev")}
                  disabled={page === 1 || isPending}
                  className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handlePageChange("next")}
                  disabled={page === totalPages || isPending}
                  className="p-1.5 rounded-lg border border-border hover:bg-accent disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Overlay / Terminal payload */}
      {selectedEventId && selectedEvent && (
        <div className="w-[500px] border border-border bg-card rounded-2xl p-6 shadow-2xl flex flex-col gap-y-6 animate-slide-in">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-x-2">
              <Code className="h-5 w-5 text-primary" />
              Event Inspector
            </h2>
            <button
              onClick={() => {
                setSelectedEventId(null);
                setSelectedEvent(null);
              }}
              className="p-1 hover:bg-accent rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-y-5 overflow-y-auto max-h-[700px] pr-2">
            {/* Status overview */}
            <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 border border-border rounded-xl text-sm">
              <div>
                <span className="text-muted-foreground text-xs block">Provider</span>
                <strong className="font-bold uppercase text-foreground">{selectedEvent.provider}</strong>
              </div>
              <div>
                <span className="text-muted-foreground text-xs block">Status</span>
                <strong className="font-bold uppercase text-foreground">{selectedEvent.status}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground text-xs block">Event Key</span>
                <code className="font-mono text-xs font-semibold bg-background p-1 border border-border rounded block mt-1 overflow-x-auto">
                  {selectedEvent.eventKey}
                </code>
              </div>
            </div>

            {/* Error Message */}
            {selectedEvent.error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs flex gap-x-2.5">
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold block mb-1">Execution Failure:</strong>
                  <pre className="font-mono whitespace-pre-wrap">{selectedEvent.error}</pre>
                </div>
              </div>
            )}

            {/* Event JSON Terminal */}
            <div className="flex flex-col gap-y-2">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                Raw Database Fields & Payload
              </p>
              <div className="font-mono text-xs text-emerald-400 bg-neutral-900 border border-neutral-800 p-4 rounded-xl overflow-x-auto shadow-inner max-h-[400px]">
                <pre>{JSON.stringify(selectedEvent, null, 2)}</pre>
              </div>
            </div>

            {/* Redelivery Trigger */}
            <div className="border-t border-border pt-4 mt-2">
              <button
                onClick={() => handleRetry(selectedEvent.id)}
                disabled={isActionPending}
                className="flex items-center justify-center gap-x-2 w-full px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-bold text-sm cursor-pointer disabled:opacity-50"
              >
                {isActionPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4 fill-primary-foreground" />
                )}
                Manual Queue Redelivery
              </button>
              <p className="text-[11px] text-muted-foreground mt-2 text-center leading-relaxed">
                Kicks this webhook back into the active `webhook-events` BullMQ queue. Processing worker will re-attempt extraction, contact updates, and automations triggers.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
