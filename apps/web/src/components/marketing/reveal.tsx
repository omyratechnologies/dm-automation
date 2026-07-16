"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms after entering viewport */
  delay?: number;
  /** Direction of entrance */
  from?: "up" | "down" | "left" | "right" | "none";
  /** Once visible, stay visible */
  once?: boolean;
};

/**
 * Lightweight scroll reveal — no extra deps.
 * Uses IntersectionObserver + CSS transitions.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  once = true,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  const offset =
    from === "up"
      ? "translate-y-8"
      : from === "down"
        ? "-translate-y-8"
        : from === "left"
          ? "translate-x-8"
          : from === "right"
            ? "-translate-x-8"
            : "";

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={cn(
        "transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
        visible ? "opacity-100 translate-x-0 translate-y-0" : cn("opacity-0", offset),
        className
      )}
    >
      {children}
    </div>
  );
}
