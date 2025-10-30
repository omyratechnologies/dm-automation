import { SIDEBAR_MENU } from "@/constants/menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type Props = {
  page: string;
};

const Items = ({ page }: Props) => {
  return SIDEBAR_MENU.map((item) => (
    <Link
      key={item.id}
      href={`/dashboard/${item.label === "overview" ? "" : item.label}`}
      className={cn(
        "capitalize flex gap-x-3 rounded-xl p-3 mb-1 transition-all duration-200 items-center group",
        page === item.label 
          ? "bg-primary/10 dark:bg-gradient-to-r dark:from-slate-primary/20 dark:to-primary/10 border border-primary/30 text-foreground shadow-lg shadow-primary/10" 
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        page === "dashboard" && item.label === "overview"
          ? "bg-primary/10 dark:bg-gradient-to-r dark:from-slate-primary/20 dark:to-primary/10 border border-primary/30 text-foreground shadow-lg shadow-primary/10"
          : ""
      )}
    >
      <span className={cn(
        "transition-transform duration-200",
        page === item.label || (page === "dashboard" && item.label === "overview") 
          ? "scale-110" 
          : "group-hover:scale-105"
      )}>
        {item.icon}
      </span>
      <span className="font-medium text-sm">{item.label}</span>
    </Link>
  ));
};

export default Items;
