"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import GemaiLogo from "@/components/global/gemai-logo";

/**
 * Premium product-film opening using the canonical vector brand mark.
 */
export function BrandFilm() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // useReducedMotion reads matchMedia on first client render (null server-side),
  // and transform keyframes render into the style prop — gate until after
  // hydration so server/client initial styles stay identical.
  const isReduced = mounted && reduced;

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.7, 1],
    isReduced ? [1, 1, 1, 1] : [0, 1, 1, 0.4]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    isReduced ? [1, 1, 1] : [0.92, 1, 1.02]
  );

  return (
    <section ref={ref} className="relative py-20 md:py-28">
      <motion.div
        style={{ opacity, scale }}
        className="mx-auto flex max-w-4xl flex-col items-center px-5 lg:px-8"
      >
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#070912] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)]">
          <div className="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden">
            <div className="absolute -left-[10%] top-[5%] h-[70%] w-[55%] rounded-full bg-[#5367FF]/20 blur-[100px]" />
            <div className="absolute -bottom-[20%] right-[2%] h-[65%] w-[50%] rounded-full bg-[#914AF7]/20 blur-[110px]" />
            <div className="absolute inset-8 rounded-xl border border-white/[0.06]" />
            <motion.div
              initial={{ opacity: 0, scale: 0.88, y: 12 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, amount: 0.6 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-white"
            >
              <GemaiLogo size="xl" className="text-white" />
            </motion.div>
          </div>
        </div>
        <p className="mt-6 text-center text-[13px] tracking-wide text-white/60">
          Built for the conversations that grow your brand
        </p>
      </motion.div>
    </section>
  );
}
