"use client";
import { usePaths } from "@/hooks/user-nav";
import GemaiLogo from "@/components/global/gemai-logo";
import React, { useEffect, useState } from "react";
import Items from "./items";
import WorkspaceSwitcher from "@/components/global/workspace-switcher";
import { Separator } from "@/components/ui/separator";
import { SubscriptionPlan } from "../subscription-plan";
import UpgradeCard from "./upgrade";
import Link from "next/link";
import { ChevronLeft, ChevronRight, HelpCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "gemai-sidebar-collapsed";

const Sidebar = () => {
  const { page } = usePaths();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setCollapsed(true);
    } catch {
      // ignore
    }
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      // Notify layout about width change
      window.dispatchEvent(
        new CustomEvent("sidebar-collapse", { detail: { collapsed: next } })
      );
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 bottom-0 z-40 hidden lg:flex flex-col",
        "border-r border-border bg-sidebar text-sidebar-foreground",
        "transition-[width] duration-200 ease-quiet",
        collapsed ? "w-[64px]" : "w-[248px]"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div
          className={cn(
            "flex items-center h-14 border-b border-border shrink-0",
            collapsed ? "justify-center px-2" : "justify-between px-3"
          )}
        >
          {!collapsed && <GemaiLogo size="lg" className="h-6" />}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
              G
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground"
              onClick={toggle}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Workspace */}
        {!collapsed && (
          <div className="px-2 py-3 border-b border-border">
            <WorkspaceSwitcher />
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <Items page={page} collapsed={collapsed} />
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-2 py-2 space-y-0.5">
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-9 text-muted-foreground"
              onClick={toggle}
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          <Link
            href="/dashboard/settings"
            title={collapsed ? "Profile" : undefined}
            className={cn(
              "flex items-center rounded-md text-sm text-muted-foreground",
              "hover:bg-accent hover:text-foreground transition-all duration-quiet",
              collapsed ? "justify-center px-2 py-2" : "gap-x-2.5 px-2.5 py-2"
            )}
          >
            <User className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="font-medium">Profile</span>}
          </Link>

          <Link
            href="/dashboard/help"
            title={collapsed ? "Help" : undefined}
            className={cn(
              "flex items-center rounded-md text-sm text-muted-foreground",
              "hover:bg-accent hover:text-foreground transition-all duration-quiet",
              collapsed ? "justify-center px-2 py-2" : "gap-x-2.5 px-2.5 py-2"
            )}
          >
            <HelpCircle className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="font-medium">Help</span>}
          </Link>

          {!collapsed && (
            <SubscriptionPlan type="FREE">
              <div className="pt-2 pb-1">
                <UpgradeCard />
              </div>
            </SubscriptionPlan>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
