"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
  delay?: number;
};

/**
 * Editorial line reveal — splits on newlines, staggers each line.
 */
export function TextReveal({
  text,
  as: Tag = "h1",
  className,
  delay = 0,
}: Props) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-10%" });
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const lines = text.split("\n");

  useEffect(() => {
    setMounted(true);
  }, []);

  // useReducedMotion reads matchMedia on first client render (null server-side),
  // so only apply it after hydration to keep the hydrated tree identical.
  if (mounted && reduced) {
    return (
      <Tag className={className}>
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={cn("overflow-hidden", className)}>
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden">
          <motion.span
            className="block"
            initial={{ y: "110%", opacity: 0 }}
            animate={inView ? { y: "0%", opacity: 1 } : undefined}
            transition={{
              duration: 0.85,
              delay: delay + i * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
