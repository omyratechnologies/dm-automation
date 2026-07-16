"use client";

import { ReactNode, useEffect } from "react";
import Lenis from "lenis";

type Props = {
  children: ReactNode;
};

/**
 * Lenis smooth scroll — marketing routes only.
 * Respects prefers-reduced-motion.
 */
export function SmoothScroll({ children }: Props) {
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) return;

    const lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      syncTouch: false, // safer on iOS; enable after device QA
    });

    let frame = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(frame);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
