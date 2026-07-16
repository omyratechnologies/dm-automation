"use client";
import { usePaths } from "@/hooks/user-nav";
import GemaiLogo from "@/components/global/gemai-logo";
import React from "react";
import Items from "./items";
import WorkspaceSwitcher from "@/components/global/workspace-switcher";
import { Separator } from "@/components/ui/separator";
import { HelpDuoToneWhite } from "@/icons";
import { SubscriptionPlan } from "../subscription-plan";
import UpgradeCard from "./upgrade";
import Link from "next/link";
import { User } from "lucide-react";

const Sidebar = () => {
  const { page } = usePaths();

  return (
    <aside
      className="w-[240px] fixed left-0 top-0 bottom-0 z-40
        hidden lg:flex flex-col
        border-r border-border
        bg-sidebar
        text-sidebar-foreground"
    >
      <div className="flex flex-col h-full p-3">
        {/* Logo */}
        <div className="flex items-center gap-x-2.5 px-2 py-3 mb-1">
          <GemaiLogo size="lg" className="h-7" />
        </div>

        {/* Workspace Switcher */}
        <div className="px-1 pb-3">
          <WorkspaceSwitcher />
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto py-1">
          <Items page={page} />
        </nav>

        <div className="px-2 my-3">
          <Separator className="bg-border" />
        </div>

        {/* Utility links */}
        <div className="px-1 flex flex-col gap-0.5 pb-2">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-x-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground
              hover:bg-accent hover:text-foreground transition-all duration-quiet ease-quiet"
          >
            <User className="h-4 w-4 shrink-0" />
            <span className="font-medium">Profile</span>
          </Link>

          <Link
            href="/dashboard/help"
            className="flex items-center gap-x-2.5 rounded-md px-2.5 py-2 text-sm text-muted-foreground
              hover:bg-accent hover:text-foreground transition-all duration-quiet ease-quiet"
          >
            <HelpDuoToneWhite />
            <span className="font-medium">Help</span>
          </Link>
        </div>

        {/* Upgrade card for free plan */}
        <SubscriptionPlan type="FREE">
          <div className="mt-auto pt-2">
            <UpgradeCard />
          </div>
        </SubscriptionPlan>
      </div>
    </aside>
  );
};

export default Sidebar;
