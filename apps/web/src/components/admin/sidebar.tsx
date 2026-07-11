"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import GemaiLogo from "@/components/global/gemai-logo";
import { Separator } from "@/components/ui/separator";
import { 
  LayoutDashboard, 
  Users, 
  Activity, 
  ArrowLeft,
  Settings,
  HelpCircle
} from "lucide-react";

const ADMIN_MENU = [
  { id: "overview", label: "overview", href: "/admin", icon: <LayoutDashboard className="h-5 w-5" /> },
  { id: "users", label: "users", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
  { id: "webhooks", label: "webhooks", href: "/admin/webhooks", icon: <Activity className="h-5 w-5" /> },
];

const AdminSidebar = () => {
  const pathname = usePathname();

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
      <div className="flex flex-col w-full h-full p-4">
        {/* Logo Section */}
        <div className="flex gap-x-3 items-center p-4 mb-2 justify-center">
          <GemaiLogo size="lg" className="h-8" />
        </div>

        {/* Console Title */}
        <div className="px-4 py-2 mb-2 text-center bg-primary/5 border border-primary/10 rounded-xl">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider">
            Admin Console
          </p>
        </div>

        {/* Navigation Items */}
        <div className="flex flex-col py-4 overflow-y-auto flex-1">
          {ADMIN_MENU.map((item) => {
            const isActive = pathname === item.href || (item.id === "overview" && pathname === "/admin");
            return (
              <Link
                key={item.id}
                href={item.href}
                className={cn(
                  "capitalize flex gap-x-3 rounded-xl p-3 mb-1 transition-all duration-200 items-center group",
                  isActive
                    ? "bg-primary/10 dark:bg-gradient-to-r dark:from-slate-primary/20 dark:to-primary/10 border border-primary/30 text-foreground shadow-lg shadow-primary/10"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <span className={cn(
                  "transition-transform duration-200",
                  isActive ? "scale-110" : "group-hover:scale-105"
                )}>
                  {item.icon}
                </span>
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="px-4 my-2">
          <Separator orientation="horizontal" className="bg-border" />
        </div>

        {/* Back to App Section */}
        <div className="px-3 flex flex-col gap-y-2">
          <Link 
            href="/dashboard"
            className="flex gap-x-3 items-center p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer group"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            <p className="text-muted-foreground text-sm font-medium group-hover:text-foreground transition-colors">
              Back to App
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
