"use client";

import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { useRef } from "react";

/**
 * Premium product-film opening — uses the GEMAI logo GIF.
 * Place asset at: public/marketing/gemai-open.gif
 */
export function BrandFilm() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.7, 1],
    reduced ? [1, 1, 1, 1] : [0, 1, 1, 0.4]
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 0.4, 1],
    reduced ? [1, 1, 1] : [0.92, 1, 1.02]
  );

  return (
    <section ref={ref} className="relative py-20 md:py-28">
      <motion.div
        style={{ opacity, scale }}
        className="mx-auto flex max-w-4xl flex-col items-center px-5 lg:px-8"
      >
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#E8E8E8] shadow-[0_40px_100px_-30px_rgba(0,0,0,0.5)]">
          {/* Aspect box for the opening film */}
          <div className="relative aspect-[16/9] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/marketing/gemai-open.gif"
              alt="Gemai"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
        <p className="mt-6 text-center text-[13px] tracking-wide text-white/30">
          Built for the conversations that grow your brand
        </p>
      </motion.div>
    </section>
  );
}
