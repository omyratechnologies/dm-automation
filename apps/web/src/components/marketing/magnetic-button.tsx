"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from "next/link";
import { ReactNode, useRef } from "react";
import { cn } from "@/lib/utils";

type Props = {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "light";
};

/**
 * Signature CTA — subtle magnetic pull toward cursor.
 * Falls back to static hover when reduced-motion is preferred.
 */
export function MagneticButton({ href, children, className, variant = "primary" }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 280, damping: 22, mass: 0.4 });
  const springY = useSpring(y, { stiffness: 280, damping: 22, mass: 0.4 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    x.set(dx * 0.22);
    y.set(dy * 0.22);
  };

  const onLeave = () => {
    x.set(0);
    y.set(0);
  };

  const variants = {
    primary:
      "bg-[#5B6AF0] text-white hover:bg-[#4F5DE0]",
    secondary:
      "border border-white/15 bg-transparent text-white hover:bg-white/5",
    light:
      "bg-white text-[#07080C] hover:bg-white/90",
  };

  return (
    <motion.div style={{ x: springX, y: springY }} className="inline-block">
      <Link
        ref={ref}
        href={href}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className={cn(
          "inline-flex h-12 items-center justify-center gap-2 rounded-full px-8 text-[15px] font-medium transition-colors duration-200",
          variants[variant],
          className
        )}
      >
        {children}
      </Link>
    </motion.div>
  );
}
