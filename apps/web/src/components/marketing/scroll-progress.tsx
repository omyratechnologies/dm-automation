"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/** Thin top progress bar — premium detail without noise */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const reduced = useReducedMotion();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  if (reduced) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-[#5B6AF0]"
      style={{ scaleX }}
    />
  );
}
