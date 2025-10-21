import Link from "next/link";
import React from "react";

interface QuickActionCardProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  gradientFrom: string;
  gradientTo: string;
  iconColor: string;
  hoverShadow: string;
}

const QuickActionCard = React.memo(
  ({
    href,
    icon,
    title,
    subtitle,
    gradientFrom,
    gradientTo,
    iconColor,
    hoverShadow,
  }: QuickActionCardProps) => {
    return (
      <Link
        href={href}
        className="group flex items-center gap-3 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-lg transition-all duration-200 hover:bg-accent"
        style={
          {
            "--hover-shadow-color": hoverShadow,
          } as React.CSSProperties
        }
      >
        <div
          className={`p-2.5 rounded-lg bg-gradient-to-br group-hover:scale-110 transition-transform`}
          style={{
            backgroundImage: `linear-gradient(to bottom right, ${gradientFrom}, ${gradientTo})`,
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
            {title}
          </span>
          <span className="text-xs text-muted-foreground">{subtitle}</span>
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-all group-hover:text-primary`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </Link>
    );
  }
);

QuickActionCard.displayName = "QuickActionCard";

export default QuickActionCard;
