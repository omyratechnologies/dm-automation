"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import type { IgAccount, Segment, SegmentPreview } from "@/lib/api";
import type { SegmentCondition } from "@repo/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Filter, Pencil, Plus, Trash2, Users } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

type EditableCondition = {
  field: "tag" | "last_inbound" | "username";
  op: string;
  value: string;
};

const FIELD_OPS: Record<EditableCondition["field"], { value: string; label: string }[]> = {
  tag: [
    { value: "has", label: "has tag" },
    { value: "not_has", label: "does not have tag" },
  ],
  last_inbound: [
    { value: "within_hours", label: "within last (hours)" },
    { value: "older_than_hours", label: "older than (hours)" },
  ],
  username: [{ value: "contains", label: "contains" }],
};

const toEditable = (c: SegmentCondition): EditableCondition => ({
  field: c.field,
  op: c.op,
  value: String(c.value),
});

const toApiCondition = (c: EditableCondition): SegmentCondition => {
  if (c.field === "last_inbound") {
    return {
      field: "last_inbound",
      op: c.op as "within_hours" | "older_than_hours",
      value: Math.max(1, Number(c.value) || 1),
    };
  }
  if (c.field === "tag") {
    return { field: "tag", op: c.op as "has" | "not_has", value: c.value };
  }
  return { field: "username", op: "contains", value: c.value };
};

const SegmentPreviewBadge = ({
  segment,
  igAccountId,
}: {
  segment: Segment;
  igAccountId: string | null;
}) => {
  const { api, wsPath, workspaceId } = useApi();

  const previewQuery = useQuery({
    queryKey: ["segment-preview", workspaceId, segment.id, igAccountId],
    queryFn: () =>
      api<SegmentPreview>(
        wsPath(`/segments/${segment.id}/preview?igAccountId=${igAccountId}`)
      ),
    enabled: !!workspaceId && !!igAccountId,
  });

  if (!igAccountId) {
    return (
      <span className="text-[11px] text-muted-foreground">
        Connect an IG account to preview
      </span>
    );
  }
  if (previewQuery.isLoading) {
    return <Skeleton className="h-5 w-28 rounded-full" />;
  }
  if (!previewQuery.data) return null;

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-[11px] text-foreground">
      <Users className="h-3 w-3" />
      {previewQuery.data.total} contacts · {previewQuery.data.eligible} in
      window
    </span>
  );
};

const SegmentsSection = () => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Segment | null>(null);
  const [name, setName] = useState("");
  const [conditions, setConditions] = useState<EditableCondition[]>([]);

  const segmentsQuery = useQuery({
    queryKey: ["segments", workspaceId],
    queryFn: () => api<Segment[]>(wsPath("/segments")),
    enabled: !!workspaceId,
  });

  const igAccountsQuery = useQuery({
    queryKey: ["ig-accounts", workspaceId],
    queryFn: () => api<IgAccount[]>(wsPath("/ig-accounts")),
    enabled: !!workspaceId,
  });
  const igAccountId = igAccountsQuery.data?.[0]?.id ?? null;

  const openCreate = () => {
    setEditing(null);
    setName("");
    setConditions([{ field: "tag", op: "has", value: "" }]);
    setDialogOpen(true);
  };

  const openEdit = (segment: Segment) => {
    setEditing(segment);
    setName(segment.name);
    setConditions((segment.filter?.conditions ?? []).map(toEditable));
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        name: name.trim(),
        filter: { conditions: conditions.map(toApiCondition) },
      };
      return editing
        ? api(wsPath(`/segments/${editing.id}`), { method: "PATCH", body })
        : api(wsPath("/segments"), { method: "POST", body });
    },
    onSuccess: () => {
      toast.success(editing ? "Segment updated" : "Segment created");
      queryClient.invalidateQueries({ queryKey: ["segments", workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ["segment-preview", workspaceId],
      });
      setDialogOpen(false);
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to save segment"
      ),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api(wsPath(`/segments/${id}`), { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Segment deleted");
      queryClient.invalidateQueries({ queryKey: ["segments", workspaceId] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to delete segment"
      ),
  });

  const updateCondition = (index: number, patch: Partial<EditableCondition>) => {
    setConditions((prev) =>
      prev.map((c, i) => {
        if (i !== index) return c;
        const next = { ...c, ...patch };
        if (patch.field && patch.field !== c.field) {
          next.op = FIELD_OPS[patch.field][0].value;
          next.value = "";
        }
        return next;
      })
    );
  };

  const canSave =
    name.trim().length > 0 &&
    conditions.every((c) => c.value.trim().length > 0);

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex justify-end">
        <Button
          onClick={openCreate}
          className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4 mr-2" />
          New segment
        </Button>
      </div>

      {segmentsQuery.isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (segmentsQuery.data ?? []).length === 0 ? (
        <div className="p-12 rounded-2xl bg-card border border-border text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3352CC] to-[#1C2D70] mb-4">
            <Filter className="h-6 w-6 text-white" />
          </span>
          <h3 className="text-base font-semibold text-foreground mb-1">
            No segments yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Segments let you target broadcasts at specific groups of contacts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(segmentsQuery.data ?? []).map((segment) => (
            <div
              key={segment.id}
              className="flex flex-col gap-y-3 p-5 rounded-2xl bg-card border border-border hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-foreground truncate">
                    {segment.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {segment.filter?.conditions?.length ?? 0} condition
                    {(segment.filter?.conditions?.length ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => openEdit(segment)}
                    aria-label={`Edit ${segment.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(`Delete segment "${segment.name}"?`)) {
                        deleteMutation.mutate(segment.id);
                      }
                    }}
                    aria-label={`Delete ${segment.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <SegmentPreviewBadge segment={segment} igAccountId={igAccountId} />
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? "Edit segment" : "Create segment"}
            </DialogTitle>
            <DialogDescription>
              Contacts must match all conditions to be included.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">Name</Label>
              <Input
                id="segment-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. VIP customers"
              />
            </div>

            <div className="space-y-2">
              <Label>Conditions</Label>
              {conditions.map((condition, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Select
                    value={condition.field}
                    onValueChange={(field) =>
                      updateCondition(index, {
                        field: field as EditableCondition["field"],
                      })
                    }
                  >
                    <SelectTrigger className="w-[130px] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tag">Tag</SelectItem>
                      <SelectItem value="last_inbound">Last inbound</SelectItem>
                      <SelectItem value="username">Username</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={condition.op}
                    onValueChange={(op) => updateCondition(index, { op })}
                  >
                    <SelectTrigger className="w-[160px] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPS[condition.field].map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type={condition.field === "last_inbound" ? "number" : "text"}
                    min={condition.field === "last_inbound" ? 1 : undefined}
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(index, { value: e.target.value })
                    }
                    placeholder={
                      condition.field === "last_inbound" ? "24" : "value"
                    }
                    className="h-9 text-xs flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-red-500 shrink-0"
                    onClick={() =>
                      setConditions((prev) =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                    aria-label="Remove condition"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConditions((prev) => [
                    ...prev,
                    { field: "tag", op: "has", value: "" },
                  ])
                }
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add condition
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!canSave || saveMutation.isPending}
              className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
            >
              {saveMutation.isPending
                ? "Saving…"
                : editing
                  ? "Save changes"
                  : "Create segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SegmentsSection;
