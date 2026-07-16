"use client";

import { useApi } from "@/hooks/use-api";
import { useInboxSocket } from "@/hooks/use-inbox-socket";
import type { Conversation, ConversationStatus, Member, Page } from "@/lib/api";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import ContactPanel from "./contact-panel";
import ConversationList from "./conversation-list";
import MessageThread from "./message-thread";

const InboxView = () => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<ConversationStatus>("OPEN");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const conversationsQuery = useInfiniteQuery({
    queryKey: ["conversations", workspaceId, status],
    queryFn: ({ pageParam }) =>
      api<Page<Conversation>>(
        wsPath(
          `/conversations?status=${status}${
            pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""
          }`
        )
      ),
    initialPageParam: "",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!workspaceId,
  });

  const conversations = useMemo(
    () => (conversationsQuery.data?.pages ?? []).flatMap((p) => p.items) ?? [],
    [conversationsQuery.data]
  );

  const membersQuery = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: () => api<Member[]>(wsPath("/members")),
    enabled: !!workspaceId,
  });

  useInboxSocket(workspaceId, {
    onMessageCreated: (payload) => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", workspaceId],
      });
      if (payload?.conversationId) {
        queryClient.invalidateQueries({
          queryKey: ["messages", payload.conversationId],
        });
      }
    },
    onConversationUpdated: () => {
      queryClient.invalidateQueries({
        queryKey: ["conversations", workspaceId],
      });
    },
  });

  const markRead = useMutation({
    mutationFn: (conversationId: string) =>
      api(wsPath(`/conversations/${conversationId}`), {
        method: "PATCH",
        body: { markRead: true },
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["conversations", workspaceId],
      }),
  });

  const handleSelect = (conversation: Conversation) => {
    setSelectedId(conversation.id);
    if (conversation.unreadCount > 0) {
      markRead.mutate(conversation.id);
    }
  };

  const selected =
    conversations.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:h-[calc(100vh-190px)] min-h-[560px]">
      <div className={cn("lg:col-span-3 h-full min-h-0", selected && "hidden lg:block")}>
        <ConversationList
          conversations={conversations}
          isLoading={conversationsQuery.isLoading}
          status={status}
          onStatusChange={(s) => {
            setStatus(s);
            setSelectedId(null);
          }}
          selectedId={selectedId}
          onSelect={handleSelect}
          hasNextPage={!!conversationsQuery.hasNextPage}
          isFetchingNextPage={conversationsQuery.isFetchingNextPage}
          fetchNextPage={() => conversationsQuery.fetchNextPage()}
        />
      </div>

      <div className={cn("lg:col-span-6 h-full min-h-0", !selected && "hidden lg:block")}>
        {selected ? (
          <MessageThread
            key={selected.id}
            conversation={selected}
            members={membersQuery.data ?? []}
            onBack={() => setSelectedId(null)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center rounded-xl border border-border bg-card text-center p-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              Select a conversation
            </h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Pick a conversation on the left to view messages.
            </p>
          </div>
        )}
      </div>

      <div className="hidden lg:block lg:col-span-3 h-full min-h-0">
        {selected ? (
          <ContactPanel conversation={selected} />
        ) : (
          <div className="h-full rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Contact details will appear here.
          </div>
        )}
      </div>
    </div>
  );
};

export default InboxView;
