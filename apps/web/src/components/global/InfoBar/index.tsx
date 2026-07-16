"use client";

import { usePaths } from "@/hooks/user-nav";
import { Menu } from "lucide-react";
import React from "react";
import Sheet from "../sheet";
import Items from "../sidebar/items";
import { Separator } from "@/components/ui/separator";
import ClerkAuthState from "../clerk-auth-state";
import { SubscriptionPlan } from "../subscription-plan";
import UpgradeCard from "../sidebar/upgrade";
import GemaiLogo from "@/components/global/gemai-logo";
import Search from "./search";
import { Notifications } from "./notifications";
import { ThemeToggle } from "../theme-toggle";
import WorkspaceSwitcher from "../workspace-switcher";

/**
 * Global product header chrome.
 * Page titles live in page content — not here.
 */
const InfoBar = () => {
  const { page } = usePaths();

  return (
    <div className="flex w-full items-center gap-3">
      {/* Mobile menu */}
      <div className="lg:hidden">
        <Sheet
          trigger={
            <button className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card hover:bg-accent transition-colors duration-quiet">
              <Menu className="h-4 w-4" />
            </button>
          }
          className="lg:hidden"
          side="left"
        >
          <div className="flex h-full flex-col bg-background p-4">
            <div className="flex items-center py-3 mb-2">
              <GemaiLogo size="lg" className="h-6" />
            </div>
            <div className="mb-3">
              <WorkspaceSwitcher />
            </div>
            <nav className="flex-1 overflow-y-auto">
              <Items page={page} />
            </nav>
            <Separator className="my-3" />
            <div className="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground">
              <ClerkAuthState />
              <span>Account</span>
            </div>
            <SubscriptionPlan type="FREE">
              <div className="mt-3">
                <UpgradeCard />
              </div>
            </SubscriptionPlan>
          </div>
        </Sheet>
      </div>

      {/* Search — primary header action */}
      <div className="flex-1 max-w-md">
        <Search />
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />
        <Notifications />
        <div className="hidden sm:block pl-1">
          <ClerkAuthState />
        </div>
      </div>
    </div>
  );
};

export default InfoBar;
