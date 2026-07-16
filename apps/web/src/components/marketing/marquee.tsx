"use client";

import { cn } from "@/lib/utils";

type Props = {
  items: string[];
  className?: string;
};

/**
 * Infinite quiet marquee for social proof / keywords.
 * Pure CSS animation — no JS cost.
 */
export function Marquee({ items, className }: Props) {
  const row = [...items, ...items];

  return (
    <div className={cn("relative overflow-hidden", className)}>
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#07080C] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#07080C] to-transparent" />
      <div className="flex w-max animate-marquee gap-10 py-2">
        {row.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="text-[13px] font-medium tracking-wide text-white/30 whitespace-nowrap"
          >
            {item}
            <span className="ml-10 text-white/15">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
