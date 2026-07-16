"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import type { Contact, Page } from "@/lib/api";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Plus, Search, Tags, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const ALL_TAGS = "__all__";

const initials = (contact: Contact) => {
  const source = (contact.name ?? contact.username ?? "?").trim();
  return source.slice(0, 2).toUpperCase() || "?";
};

const RowTagEditor = ({ contact }: { contact: Contact }) => {
  const { api, wsPath, workspaceId } = useApi();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");

  const mutation = useMutation({
    mutationFn: (tags: string[]) =>
      api(wsPath(`/contacts/${contact.id}`), {
        method: "PATCH",
        body: { tags },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts", workspaceId] });
      queryClient.invalidateQueries({
        queryKey: ["contact-tags", workspaceId],
      });
    },
    onError: (error) =>
      toast.error(
        error instanceof Error ? error.message : "Failed to update tags"
      ),
  });

  const add = () => {
    const tag = draft.trim();
    if (!tag) return;
    if (!contact.tags.includes(tag)) {
      mutation.mutate([...contact.tags, tag]);
    }
    setDraft("");
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground"
          aria-label={`Edit tags for ${contact.username}`}
        >
          <Tags className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {contact.tags.length === 0 && (
            <p className="text-xs text-muted-foreground">No tags yet.</p>
          )}
          {contact.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-xs"
            >
              {tag}
              <button
                onClick={() =>
                  mutation.mutate(contact.tags.filter((t) => t !== tag))
                }
                disabled={mutation.isPending}
                className="text-muted-foreground hover:text-destructive transition-colors duration-quiet"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Add a tag"
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2 shrink-0"
            onClick={add}
            disabled={!draft.trim() || mutation.isPending}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ContactsTable = () => {
  const { api, wsPath, workspaceId } = useApi();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [tag, setTag] = useState<string>(ALL_TAGS);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const tagsQuery = useQuery({
    queryKey: ["contact-tags", workspaceId],
    queryFn: () => api<string[]>(wsPath("/contacts/tags")),
    enabled: !!workspaceId,
  });

  const contactsQuery = useInfiniteQuery({
    queryKey: ["contacts", workspaceId, debouncedSearch, tag],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (tag !== ALL_TAGS) params.set("tag", tag);
      if (pageParam) params.set("cursor", pageParam);
      const qs = params.toString();
      return api<Page<Contact>>(wsPath(`/contacts${qs ? `?${qs}` : ""}`));
    },
    initialPageParam: "",
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled: !!workspaceId,
  });

  const contacts = useMemo(
    () => (contactsQuery.data?.pages ?? []).flatMap((p) => p.items) ?? [],
    [contactsQuery.data]
  );

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by username or name…"
            className="pl-9"
          />
        </div>
        <Select value={tag} onValueChange={setTag}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by tag" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_TAGS}>All tags</SelectItem>
            {(tagsQuery.data ?? []).map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {contactsQuery.isLoading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-base font-semibold text-foreground mb-1">
              {debouncedSearch || tag !== ALL_TAGS
                ? "No matching contacts"
                : "No contacts yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {debouncedSearch || tag !== ALL_TAGS
                ? "Try a different search or tag filter."
                : "Contacts appear here once people DM your connected accounts."}
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contact</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Last inbound</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow
                  key={contact.id}
                  className="hover:bg-accent/50 transition-colors duration-quiet"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={contact.profilePicUrl ?? undefined}
                          alt={contact.username}
                        />
                        <AvatarFallback className="bg-primary/15 text-primary text-xs font-medium">
                          {initials(contact)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {contact.name ?? contact.username}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{contact.username}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {contact.tags.length === 0 ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        contact.tags.slice(0, 4).map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full bg-primary/10 text-[11px]"
                          >
                            {t}
                          </span>
                        ))
                      )}
                      {contact.tags.length > 4 && (
                        <span className="text-[11px] text-muted-foreground">
                          +{contact.tags.length - 4}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {contact.lastInboundAt
                      ? formatDistanceToNow(new Date(contact.lastInboundAt), {
                          addSuffix: true,
                        })
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    {contact.optedOut ? (
                      <Badge
                        variant="outline"
                        className="border-destructive/40 text-destructive text-[11px]"
                      >
                        Opted out
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="border-success/40 text-success text-[11px]"
                      >
                        Subscribed
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <RowTagEditor contact={contact} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {contactsQuery.hasNextPage && (
          <div className="p-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={contactsQuery.isFetchingNextPage}
              onClick={() => contactsQuery.fetchNextPage()}
            >
              {contactsQuery.isFetchingNextPage ? "Loading…" : "Load more"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContactsTable;
