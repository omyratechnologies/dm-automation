"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Conversation, ConversationStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatDistanceToNowStrict } from "date-fns";
import { Bot } from "lucide-react";
import React from "react";

type Props = {
  conversations: Conversation[];
  isLoading: boolean;
  status: ConversationStatus;
  onStatusChange: (status: ConversationStatus) => void;
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
};

export const initialsOf = (name: string | null, username: string) => {
  const source = (name ?? username ?? "?").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase() || "?";
};

const ConversationList = ({
  conversations,
  isLoading,
  status,
  onStatusChange,
  selectedId,
  onSelect,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: Props) => {
  return (
    <div className="h-full flex flex-col rounded-xl border border-border bg-card overflow-hidden">
      {/* Status tabs */}
      <div className="p-2.5 border-b border-border">
        <div className="grid grid-cols-2 gap-0.5 p-0.5 rounded-md bg-muted">
          {(["OPEN", "CLOSED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(s)}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all duration-quiet ease-quiet",
                status === s
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-3 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No {status.toLowerCase()} conversations yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelect(c)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 text-left border-b border-border/50 transition-colors duration-quiet ease-quiet",
                  selectedId === c.id
                    ? "bg-primary/10"
                    : "hover:bg-accent"
                )}
              >
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarImage
                    src={c.contact.profilePicUrl ?? undefined}
                    alt={c.contact.username}
                  />
                  <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
                    {initialsOf(c.contact.name, c.contact.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {c.contact.name ?? c.contact.username}
                    </p>
                    {c.lastMessageAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {formatDistanceToNowStrict(new Date(c.lastMessageAt))}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      @{c.contact.username}
                    </p>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {c.mode === "BOT" && (
                        <Bot className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                      {c.unreadCount > 0 && (
                        <Badge className="h-5 min-w-5 px-1.5 justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium border-0 hover:bg-primary">
                          {c.unreadCount}
                        </Badge>
                      )}
                    </span>
                  </div>
                </div>
              </button>
            ))}
            {hasNextPage && (
              <div className="p-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  disabled={isFetchingNextPage}
                  onClick={fetchNextPage}
                >
                  {isFetchingNextPage ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList;
