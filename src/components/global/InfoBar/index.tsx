"use client";

import { PAGE_BREAD_CRUMBS } from "@/constants/pages";
import { usePaths } from "@/hooks/user-nav";
import { Menu } from "lucide-react";
import React from "react";
import Sheet from "../sheet";
import Items from "../sidebar/items";
import { Separator } from "@/components/ui/separator";
import ClerkAuthState from "../clerk-auth-state";
import { HelpDuoToneWhite } from "@/icons";
import { SubscriptionPlan } from "../subscription-plan";
import UpgradeCard from "../sidebar/upgrade";
import GemaiLogo from "@/components/global/gemai-logo";
import CreateAutomation from "../create-automation";
import Search from "./search";
import { Notifications } from "./notifications";
import MainBreadCrumb from "../bread-crumbs/main-bread-crumb";
import GoToAutomationsButton from "../go-to-automations-button";
import { ThemeToggle } from "../theme-toggle";

type Props = {
  slug: string;
};

const InfoBar = ({ slug }: Props) => {
  const { page } = usePaths();
  const currentPage = PAGE_BREAD_CRUMBS.includes(page) || page == slug;

  return (
    currentPage && (
      <div className="flex flex-col gap-y-4 mb-6">
        <div className="flex gap-x-3 lg:gap-x-5 justify-end items-center">
          {/* Mobile Menu */}
          <span className="lg:hidden flex items-center flex-1 gap-x-2">
            <Sheet trigger={
              <div className="p-2 rounded-lg bg-muted border border-border hover:bg-muted/80 transition-colors">
                <Menu className="text-foreground" />
              </div>
            } className="lg:hidden" side="left">
              <div className="flex flex-col gap-y-5 w-full h-full p-4 bg-background/95 backdrop-blur-2xl">
                <div className="flex gap-x-3 items-center justify-center p-4">
                  <GemaiLogo size="lg" className="h-8" />
                </div>
                <div className="flex flex-col py-3">
                  <Items page={page} slug={slug} />
                </div>
                <div className="px-4">
                  <Separator orientation="horizontal" className="bg-border" />
                </div>
                <div className="px-3 flex flex-col gap-y-4">
                  <div className="flex gap-x-3 items-center">
                    <ClerkAuthState />
                    <p className="text-muted-foreground text-sm">Profile</p>
                  </div>
                  <div className="flex gap-x-3 items-center">
                    <HelpDuoToneWhite />
                    <p className="text-muted-foreground text-sm">Help</p>
                  </div>
                </div>
                <SubscriptionPlan type="FREE">
                  <div className="flex-1 flex flex-col justify-end">
                    <UpgradeCard />
                  </div>
                </SubscriptionPlan>
              </div>
            </Sheet>
          </span>
          
          {/* Search & Actions */}
          <div className="flex items-center gap-3">
            <Search />
            {/* <GoToAutomationsButton /> */}
            <ThemeToggle />
            <Notifications />
          </div>
        </div>
        
        {/* Breadcrumb */}
        <MainBreadCrumb page={page === slug ? "Home" : page} slug={slug} />
      </div>
    )
  );
};

export default InfoBar;
