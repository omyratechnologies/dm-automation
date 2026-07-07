"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useApi } from "@/hooks/use-api";
import type { Conversation, Member, Message, Page } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertTriangle, Bot, Send, UserRound } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { initialsOf } from "./conversation-list";

type Props = {
  conversation: Conversation;
  members: Member[];
};

const UNASSIGNED = "__unassigned__";

const memberName = (m: Member) =>
  [m.user.firstname, m.user.lastname].filter(Boolean).join(" ") ||
  m.user.email;

const MessageThread = ({ conversation, members }: Props) => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useInfiniteQuery({
    queryKey: ["messages", conversation.id],
    queryFn: ({ pageParam }) =>
      api<Page<Message>>(
        wsPath(
          `/conversations/${conversation.id}/messages${
            pageParam ? `?cursor=${encodeURIComponent(pageParam)}` : ""
          }`
        )
      ),
    initialPageParam: "",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!workspaceId,
  });

  const messages = useMemo(() => {
    const items = (messagesQuery.data?.pages ?? []).flatMap((p) => p.items) ?? [];
    return [...items].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [messagesQuery.data]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, conversation.id]);

  const invalidateThread = () => {
    queryClient.invalidateQueries({ queryKey: ["messages", conversation.id] });
    queryClient.invalidateQueries({ queryKey: ["conversations", workspaceId] });
  };

  const sendMutation = useMutation({
    mutationFn: (text: string) =>
      api<Message>(wsPath(`/conversations/${conversation.id}/messages`), {
        method: "POST",
        body: { text },
      }),
    onMutate: async (text) => {
      await queryClient.cancelQueries({
        queryKey: ["messages", conversation.id],
      });
      const previous = queryClient.getQueryData<InfiniteData<Page<Message>>>([
        "messages",
        conversation.id,
      ]);
      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        direction: "OUT",
        source: "AGENT",
        text,
        status: "SENDING",
        errorCode: null,
        createdAt: new Date().toISOString(),
        sentAt: null,
      };
      queryClient.setQueryData<InfiniteData<Page<Message>>>(
        ["messages", conversation.id],
        (old) =>
          old
            ? {
                ...old,
                pages: old.pages.map((page, i) =>
                  i === 0
                    ? { ...page, items: [optimistic, ...page.items] }
                    : page
                ),
              }
            : {
                pages: [{ items: [optimistic], nextCursor: null }],
                pageParams: [""],
              }
      );
      return { previous };
    },
    onError: (error, _text, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["messages", conversation.id],
          context.previous
        );
      }
      toast.error(
        error instanceof Error ? error.message : "Failed to send message"
      );
    },
    onSettled: invalidateThread,
  });

  const patchMutation = useMutation({
    mutationFn: (body: {
      status?: "OPEN" | "CLOSED";
      mode?: "BOT" | "HUMAN";
      assignedToId?: string | null;
    }) =>
      api(wsPath(`/conversations/${conversation.id}`), {
        method: "PATCH",
        body,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", workspaceId],
      });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update conversation"
      ),
  });

  const handleSend = () => {
    const text = draft.trim();
    if (!text || sendMutation.isPending) return;
    setDraft("");
    sendMutation.mutate(text);
  };

  return (
    <div className="h-full flex flex-col rounded-2xl bg-card border border-border overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border">
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={conversation.contact.profilePicUrl ?? undefined}
            alt={conversation.contact.username}
          />
          <AvatarFallback className="bg-gradient-to-br from-[#3352CC] to-[#1C2D70] text-white text-[10px] font-semibold">
            {initialsOf(conversation.contact.name, conversation.contact.username)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 mr-auto">
          <p className="text-sm font-semibold text-foreground truncate">
            {conversation.contact.name ?? conversation.contact.username}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            @{conversation.contact.username}
          </p>
        </div>

        <Select
          value={conversation.assignedToId ?? UNASSIGNED}
          onValueChange={(value) =>
            patchMutation.mutate({
              assignedToId: value === UNASSIGNED ? null : value,
            })
          }
        >
          <SelectTrigger className="h-8 w-[150px] text-xs">
            <SelectValue placeholder="Assign" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.user.id}>
                {memberName(m)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {conversation.mode === "BOT" ? (
          <Button
            size="sm"
            className="h-8 bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90"
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate({ mode: "HUMAN" })}
          >
            <UserRound className="h-3.5 w-3.5 mr-1.5" />
            Take over
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate({ mode: "BOT" })}
          >
            <Bot className="h-3.5 w-3.5 mr-1.5" />
            Return to bot
          </Button>
        )}

        {conversation.status === "OPEN" ? (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate({ status: "CLOSED" })}
          >
            Close
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="h-8"
            disabled={patchMutation.isPending}
            onClick={() => patchMutation.mutate({ status: "OPEN" })}
          >
            Reopen
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messagesQuery.hasNextPage && (
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              disabled={messagesQuery.isFetchingNextPage}
              onClick={() => messagesQuery.fetchNextPage()}
            >
              {messagesQuery.isFetchingNextPage
                ? "Loading…"
                : "Load older messages"}
            </Button>
          </div>
        )}
        {messagesQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-2/3 rounded-2xl" />
            <Skeleton className="h-12 w-1/2 rounded-2xl ml-auto" />
            <Skeleton className="h-12 w-3/5 rounded-2xl" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-10">
            No messages in this conversation yet.
          </p>
        ) : (
          messages.map((m) => {
            const isOut = m.direction === "OUT";
            const rejected = m.status === "REJECTED";
            return (
              <div
                key={m.id}
                className={cn("flex", isOut ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5",
                    isOut
                      ? "bg-gradient-to-br from-[#3352CC] to-[#1C2D70] text-white rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md",
                    rejected && "opacity-80 ring-1 ring-red-500/60"
                  )}
                  title={rejected && m.errorCode ? m.errorCode : undefined}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {m.text}
                  </p>
                  <div
                    className={cn(
                      "flex items-center gap-2 mt-1",
                      isOut ? "justify-end" : "justify-start"
                    )}
                  >
                    {isOut && m.source && (
                      <span
                        className={cn(
                          "text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                          "bg-white/15 text-white/90"
                        )}
                      >
                        {m.source}
                      </span>
                    )}
                    {rejected && (
                      <span
                        className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-200"
                        title={m.errorCode ?? "Rejected"}
                      >
                        <AlertTriangle className="h-2.5 w-2.5" />
                        Rejected
                      </span>
                    )}
                    <span
                      className={cn(
                        "text-[10px]",
                        isOut ? "text-white/60" : "text-muted-foreground"
                      )}
                    >
                      {format(new Date(m.createdAt), "MMM d, HH:mm")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-border">
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={
              conversation.mode === "BOT"
                ? "Sending will not pause the bot — use Take over for manual mode."
                : "Type a message…"
            }
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button
            onClick={handleSend}
            disabled={!draft.trim() || sendMutation.isPending}
            className="h-11 px-4 bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white hover:opacity-90 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MessageThread;
