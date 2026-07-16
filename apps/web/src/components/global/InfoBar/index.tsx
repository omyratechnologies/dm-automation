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
import Search from "./search";
import { Notifications } from "./notifications";
import MainBreadCrumb from "../bread-crumbs/main-bread-crumb";
import { ThemeToggle } from "../theme-toggle";

const InfoBar = () => {
  const { page } = usePaths();
  const currentPage = PAGE_BREAD_CRUMBS.includes(page) || page == "dashboard";

  return (
    currentPage && (
      <div className="flex flex-col gap-y-5 mb-6">
        <div className="flex items-center justify-between gap-x-3">
          {/* Mobile Menu */}
          <div className="lg:hidden flex items-center gap-x-2">
            <Sheet
              trigger={
                <button className="p-2 rounded-md border border-border bg-surface-1 hover:bg-accent transition-all duration-quiet ease-quiet">
                  <Menu className="h-4 w-4 text-foreground" />
                </button>
              }
              className="lg:hidden"
              side="left"
            >
              <div className="flex flex-col h-full p-4 bg-background">
                <div className="flex items-center justify-center py-4 mb-2">
                  <GemaiLogo size="lg" className="h-7" />
                </div>
                <nav className="flex flex-col gap-0.5 py-2">
                  <Items page={page} />
                </nav>
                <div className="my-3 px-1">
                  <Separator className="bg-border" />
                </div>
                <div className="flex flex-col gap-0.5 px-1">
                  <div className="flex items-center gap-x-2.5 px-2.5 py-2 text-sm text-muted-foreground">
                    <ClerkAuthState />
                    <span>Profile</span>
                  </div>
                  <div className="flex items-center gap-x-2.5 px-2.5 py-2 text-sm text-muted-foreground">
                    <HelpDuoToneWhite />
                    <span>Help</span>
                  </div>
                </div>
                <SubscriptionPlan type="FREE">
                  <div className="mt-auto pt-4">
                    <UpgradeCard />
                  </div>
                </SubscriptionPlan>
              </div>
            </Sheet>
          </div>

          {/* Search & Actions */}
          <div className="flex items-center gap-2 ml-auto">
            <Search />
            <ThemeToggle />
            <Notifications />
          </div>
        </div>

        {/* Breadcrumb / Page title */}
        <MainBreadCrumb page={page === "dashboard" ? "Home" : page} />
      </div>
    )
  );
};

export default InfoBar;
