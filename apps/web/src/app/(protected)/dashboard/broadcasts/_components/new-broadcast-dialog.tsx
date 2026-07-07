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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import type { IgAccount, Segment, SegmentPreview } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

const ALL_CONTACTS = "__all__";
const MAX_LENGTH = 1000;

type Props = {
  igAccounts: IgAccount[];
  segments: Segment[];
};

const NewBroadcastDialog = ({ igAccounts, segments }: Props) => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [igAccountId, setIgAccountId] = useState<string>("");
  const [segmentId, setSegmentId] = useState<string>(ALL_CONTACTS);
  const [messageText, setMessageText] = useState("");

  const previewQuery = useQuery({
    queryKey: ["segment-preview", workspaceId, segmentId, igAccountId],
    queryFn: () =>
      api<SegmentPreview>(
        wsPath(`/segments/${segmentId}/preview?igAccountId=${igAccountId}`)
      ),
    enabled:
      !!workspaceId && open && segmentId !== ALL_CONTACTS && !!igAccountId,
  });

  const reset = () => {
    setName("");
    setIgAccountId("");
    setSegmentId(ALL_CONTACTS);
    setMessageText("");
  };

  const createMutation = useMutation({
    mutationFn: () =>
      api(wsPath("/broadcasts"), {
        method: "POST",
        body: {
          name: name.trim(),
          igAccountId,
          segmentId: segmentId === ALL_CONTACTS ? null : segmentId,
          messageText: messageText.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("Broadcast created as draft — press Send when ready");
      queryClient.invalidateQueries({ queryKey: ["broadcasts", workspaceId] });
      setOpen(false);
      reset();
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to create broadcast"
      ),
  });

  const canCreate =
    name.trim().length > 0 &&
    !!igAccountId &&
    messageText.trim().length > 0 &&
    messageText.length <= MAX_LENGTH;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90">
          <Plus className="h-4 w-4 mr-2" />
          New broadcast
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New broadcast</DialogTitle>
          <DialogDescription>
            Broadcasts are only delivered to contacts inside the 24-hour
            messaging window.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="broadcast-name">Name</Label>
            <Input
              id="broadcast-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Flash sale announcement"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>IG account</Label>
              <Select value={igAccountId} onValueChange={setIgAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  {igAccounts.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      No connected accounts
                    </div>
                  ) : (
                    igAccounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        @{a.username}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Audience</Label>
              <Select value={segmentId} onValueChange={setSegmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_CONTACTS}>All contacts</SelectItem>
                  {segments.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="broadcast-message">Message</Label>
              <span
                className={
                  messageText.length > MAX_LENGTH
                    ? "text-xs text-red-500"
                    : "text-xs text-muted-foreground"
                }
              >
                {messageText.length}/{MAX_LENGTH}
              </span>
            </div>
            <Textarea
              id="broadcast-message"
              value={messageText}
              onChange={(e) =>
                setMessageText(e.target.value.slice(0, MAX_LENGTH))
              }
              placeholder="What do you want to say?"
              className="min-h-[110px]"
              maxLength={MAX_LENGTH}
            />
          </div>

          {segmentId !== ALL_CONTACTS && igAccountId && (
            <p className="text-xs text-muted-foreground rounded-lg bg-muted border border-border px-3 py-2">
              {previewQuery.isLoading
                ? "Checking audience…"
                : previewQuery.data
                  ? `${previewQuery.data.eligible} of ${previewQuery.data.total} contacts are inside the 24-hour window.`
                  : "Audience preview unavailable."}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!canCreate || createMutation.isPending}
            className="bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
          >
            {createMutation.isPending ? "Creating…" : "Create draft"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewBroadcastDialog;
