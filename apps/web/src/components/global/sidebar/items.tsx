import { SIDEBAR_GROUPS } from "@/constants/menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type Props = {
  page: string;
  collapsed?: boolean;
};

const Items = ({ page, collapsed = false }: Props) => {
  return (
    <div className="flex flex-col gap-4">
      {SIDEBAR_GROUPS.map((group) => (
        <div key={group.id} className="flex flex-col gap-0.5">
          {group.label && !collapsed && (
            <p className="px-2.5 mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
          )}
          {group.label && collapsed && (
            <div className="mx-2 my-1 border-t border-border" />
          )}
          {group.items.map((item) => {
            const isActive =
              page === item.label ||
              (page === "dashboard" && item.label === "overview");

            return (
              <Link
                key={item.id}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-x-2.5 rounded-md text-sm font-medium transition-all duration-quiet ease-quiet",
                  collapsed ? "justify-center px-2 py-2" : "px-2.5 py-2",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <span className="capitalize truncate">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default Items;
