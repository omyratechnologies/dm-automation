import Link from "next/link";
import React from "react";
import { ArrowRight } from "lucide-react";

interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const QuickActionCard = React.memo(
  ({ href, icon, title, subtitle }: QuickActionCardProps) => {
    return (
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-lg border border-border bg-card p-4
          transition-all duration-quiet ease-quiet
          hover:border-hairline-strong hover:bg-accent"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="block text-sm font-medium text-foreground truncate">
            {title}
          </span>
          <span className="block text-xs text-muted-foreground truncate">
            {subtitle}
          </span>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-quiet group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    );
  }
);

QuickActionCard.displayName = "QuickActionCard";

export default QuickActionCard;
