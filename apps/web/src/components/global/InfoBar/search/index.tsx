"use client";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import React from "react";

function Search() {
  return (
    <div className="relative w-full">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        placeholder="Search…"
        className="h-9 w-full border-border bg-card pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-primary/30"
      />
    </div>
  );
}

export default Search;
