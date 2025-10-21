"use client";
import { usePaths } from "@/hooks/user-nav";
import GemaiLogo from "@/components/global/gemai-logo";
import React from "react";
import Items from "./items";
import { Separator } from "@/components/ui/separator";
import { HelpDuoToneWhite } from "@/icons";
import { SubscriptionPlan } from "../subscription-plan";
import UpgradeCard from "./upgrade";
import Link from "next/link";
import { User } from "lucide-react";

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
        <div className="flex gap-x-3 items-center p-4 mb-2 justify-center">
          <GemaiLogo size="lg" className="h-8" />
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col py-4">
          <Items page={page} slug={slug} />
        </div>

        <div className="px-4 my-4">
          <Separator orientation="horizontal" className="bg-border" />
        </div>

        {/* Profile & Help Section */}
        <div className="px-3 flex flex-col gap-y-2">
          {/* Profile Link */}
          <Link 
            href={`/dashboard/${slug}/settings`}
            className="flex gap-x-3 items-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
          >
            <User className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <p className="text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">
              Profile
            </p>
          </Link>

          {/* Help Link */}
          <Link 
            href={`/dashboard/${slug}/help`}
            className="flex gap-x-3 items-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
          >
            <HelpDuoToneWhite />
            <p className="text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">
              Help
            </p>
          </Link>
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
