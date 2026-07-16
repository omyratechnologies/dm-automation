"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useApi } from "@/hooks/use-api";
import type { Contact, Conversation, Page } from "@/lib/api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Clock, Plus, X } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { initialsOf } from "./conversation-list";

type Props = {
  conversation: Conversation;
};

const WINDOW_MS = 24 * 60 * 60 * 1000;

const ContactPanel = ({ conversation }: Props) => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");
  const summary = conversation.contact;

  const contactQuery = useQuery({
    queryKey: ["contact", workspaceId, summary.id],
    queryFn: async () => {
      const page = await api<Page<Contact>>(
        wsPath(`/contacts?search=${encodeURIComponent(summary.username)}`)
      );
      return page.items.find((c) => c.id === summary.id) ?? null;
    },
    enabled: !!workspaceId,
  });

  const contact = contactQuery.data;
  const tags = contact?.tags ?? [];

  const tagsMutation = useMutation({
    mutationFn: (nextTags: string[]) =>
      api(wsPath(`/contacts/${summary.id}`), {
        method: "PATCH",
        body: { tags: nextTags },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["contact", workspaceId, summary.id],
      });
      queryClient.invalidateQueries({ queryKey: ["contacts", workspaceId] });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update tags"
      ),
  });

  const addTag = () => {
    const tag = newTag.trim();
    if (!tag) return;
    if (tags.includes(tag)) {
      setNewTag("");
      return;
    }
    tagsMutation.mutate([...tags, tag]);
    setNewTag("");
  };

  const removeTag = (tag: string) => {
    tagsMutation.mutate(tags.filter((t) => t !== tag));
  };

  const lastInboundAt = contact?.lastInboundAt ?? summary.lastInboundAt;
  const withinWindow =
    !!lastInboundAt &&
    Date.now() - new Date(lastInboundAt).getTime() < WINDOW_MS;

  return (
    <div className="h-full flex flex-col rounded-xl border border-border bg-card overflow-y-auto">
      {/* Profile */}
      <div className="flex flex-col items-center text-center p-5 border-b border-border">
        <Avatar className="h-14 w-14 mb-3">
          <AvatarImage
            src={summary.profilePicUrl ?? undefined}
            alt={summary.username}
          />
          <AvatarFallback className="bg-primary/15 text-primary text-base font-medium">
            {initialsOf(summary.name, summary.username)}
          </AvatarFallback>
        </Avatar>
        <p className="text-sm font-semibold text-foreground">
          {summary.name ?? summary.username}
        </p>
        <p className="text-xs text-muted-foreground">@{summary.username}</p>
        {contact?.optedOut && (
          <Badge
            variant="outline"
            className="mt-2 border-destructive/40 text-destructive"
          >
            Opted out
          </Badge>
        )}
      </div>

      {/* Messaging window */}
      <div className="p-4 border-b border-border space-y-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Messaging window
        </p>
        {withinWindow ? (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            In 24h window
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            Window expired
          </span>
        )}
        {lastInboundAt && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            Last inbound{" "}
            {formatDistanceToNow(new Date(lastInboundAt), { addSuffix: true })}
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="p-4 space-y-2.5">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Tags
        </p>
        {contactQuery.isLoading ? (
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {tags.length === 0 && (
              <p className="text-xs text-muted-foreground">No tags yet.</p>
            )}
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs text-foreground"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  disabled={tagsMutation.isPending}
                  className="text-muted-foreground hover:text-destructive transition-colors duration-quiet"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add a tag"
            className="h-8 text-xs"
            disabled={contactQuery.isLoading || tagsMutation.isPending}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 shrink-0"
            onClick={addTag}
            disabled={
              !newTag.trim() || contactQuery.isLoading || tagsMutation.isPending
            }
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ContactPanel;
