import { SIDEBAR_MENU } from "@/constants/menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";

type Props = {
  page: string;
};

const Items = ({ page }: Props) => {
  return SIDEBAR_MENU.map((item) => {
    const isActive =
      page === item.label ||
      (page === "dashboard" && item.label === "overview");

    return (
      <Link
        key={item.id}
        href={`/dashboard/${item.label === "overview" ? "" : item.label}`}
        className={cn(
          "flex items-center gap-x-2.5 rounded-md px-2.5 py-2 text-sm font-medium transition-all duration-quiet ease-quiet",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <span
          className={cn(
            "flex shrink-0 transition-colors duration-quiet",
            isActive ? "text-primary" : "text-muted-foreground"
          )}
        >
          {item.icon}
        </span>
        <span className="capitalize truncate">{item.label}</span>
      </Link>
    );
  });
};

export default Items;
