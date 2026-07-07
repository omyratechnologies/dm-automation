"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { useWorkspace } from "@/providers/workspace-provider";
import { Check, ChevronsUpDown, Layers } from "lucide-react";
import React from "react";

const WorkspaceSwitcher = () => {
  const { workspace, workspaces, isLoading, switchWorkspace, error } =
    useWorkspace();

  if (isLoading) {
    return <Skeleton className="h-11 w-full rounded-xl" />;
  }

  if (error || !workspace) {
    return (
      <div className="w-full rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {error ? "Workspace unavailable" : "No workspace"}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="w-full flex items-center gap-x-2 rounded-xl border border-border bg-muted/50 hover:bg-accent transition-colors px-3 py-2 text-left"
          aria-label="Switch workspace"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#3352CC] to-[#1C2D70] text-white">
            <Layers className="h-4 w-4" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block truncate text-sm font-medium text-foreground">
              {workspace.name}
            </span>
            <span className="block truncate text-[11px] text-muted-foreground">
              {workspace.orgName}
            </span>
          </span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            {workspace.plan}
          </Badge>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {workspaces.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onClick={() => switchWorkspace(w.id)}
            className="flex items-center gap-x-2"
          >
            <span className="flex-1 min-w-0">
              <span className="block truncate text-sm">{w.name}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {w.orgName} · {w.role.toLowerCase()}
              </span>
            </span>
            {w.id === workspace.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default WorkspaceSwitcher;
