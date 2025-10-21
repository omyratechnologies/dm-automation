"use client";
import { usePaths } from "@/hooks/user-nav";
import Logo from "@/svgs/logo";
import React from "react";
import Items from "./items";
import { Separator } from "@/components/ui/separator";
import ClerkAuthState from "../clerk-auth-state";
import { HelpDuoToneWhite } from "@/icons";
import { SubscriptionPlan } from "../subscription-plan";
import UpgradeCard from "./upgrade";

type Props = {
  slug: string;
};

const Sidebar = ({ slug }: Props) => {
  const { page } = usePaths();

  return (
    <div
      className="w-[280px] 
    border
    fixed 
    left-0 
    lg:inline-block
    border-border
    bg-background/95
    backdrop-blur-2xl
     hidden 
     bottom-0 
     top-0 
     m-4 
     rounded-3xl 
     overflow-hidden
     shadow-2xl shadow-primary/5"
    >
      <div
        className="flex flex-col 
       w-full 
       h-full 
       p-4"
      >
        {/* Logo Section with Enhanced Styling */}
        <div className="flex gap-x-3 items-center p-4 mb-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-brand flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-primary/30">
            S
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary via-slate-secondary to-slate-primary bg-clip-text text-transparent">
            Slate AI
          </span>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col py-4">
          <Items page={page} slug={slug} />
        </div>

        <div className="px-4 my-4">
          <Separator orientation="horizontal" className="bg-border" />
        </div>

        {/* Profile & Help Section */}
        <div className="px-3 flex flex-col gap-y-4">
          <div className="flex gap-x-3 items-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
            <ClerkAuthState />
            <p className="text-muted-foreground text-sm font-medium">Profile</p>
          </div>
          <div className="flex gap-x-3 items-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer">
            <HelpDuoToneWhite />
            <p className="text-muted-foreground text-sm font-medium">Help</p>
          </div>
        </div>

        {/* Upgrade Card */}
        <SubscriptionPlan type="FREE">
          <div className="flex-1 flex flex-col justify-end mt-4">
            <UpgradeCard />
          </div>
        </SubscriptionPlan>
      </div>
    </div>
  );
};

export default Sidebar;
