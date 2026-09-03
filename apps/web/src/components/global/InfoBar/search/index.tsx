"use client";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useState } from "react";

function Search() {
  const router = useRouter();
  const params = useParams<{ workspaceId?: string }>();
  const [query, setQuery] = useState("");

  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(event) => {
        event.preventDefault();
        const workspaceId = params.workspaceId;
        if (!workspaceId) return;
        const search = query.trim();
        router.push(`/dashboard/${workspaceId}/leads${search ? `?search=${encodeURIComponent(search)}` : ""}`);
        window.dispatchEvent(new CustomEvent("gemai:lead-search", { detail: search }));
      }}
    >
      <label htmlFor="workspace-lead-search" className="sr-only">Search workspace leads</label>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="workspace-lead-search"
        type="search"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search leads…"
        className="h-11 w-full border-border bg-card pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/30"
      />
    </form>
  );
}

export default Search;
