"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useRef } from "react";

/**
 * Product film stage — Flow Builder journey video.
 * Asset: public/marketing/flow-demo.mp4
 */
export function ProductStage() {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const smooth = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 28,
  });

  const y = useTransform(smooth, [0, 1], reduced ? [0, 0] : [60, -30]);
  const scale = useTransform(
    smooth,
    [0, 0.35, 1],
    reduced ? [1, 1, 1] : [0.92, 1, 0.98]
  );
  const opacity = useTransform(
    smooth,
    [0, 0.15, 0.85, 1],
    reduced ? [1, 1, 1, 1] : [0.35, 1, 1, 0.75]
  );
  const glow = useTransform(smooth, [0, 0.45, 1], [0.12, 0.32, 0.1]);

  return (
    <section id="product" className="relative pb-20 pt-4 md:pb-28">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 max-w-2xl"
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/35">
            Product
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Design the journey.
            <span className="text-white/40"> Watch it run.</span>
          </h2>
        </motion.div>

        <motion.div ref={ref} style={{ y, scale, opacity }} className="relative">
          <motion.div
            aria-hidden
            style={{ opacity: glow }}
            className="pointer-events-none absolute -inset-10 rounded-[2.5rem] bg-[#5B6AF0] blur-[90px]"
          />

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111318] shadow-[0_50px_120px_-25px_rgba(91,106,240,0.35)]">
            {/* Window chrome */}
            <div className="flex items-center gap-2 border-b border-white/[0.06] bg-white/[0.02] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/12" />
              <span className="ml-3 text-[11px] text-white/30">
                gemai · flow builder
              </span>
            </div>

            {/* Video — light UI product film sits inside dark frame */}
            <div className="relative aspect-[16/10] w-full bg-[#E8E8E8]">
              <video
                className="absolute inset-0 h-full w-full object-cover object-center"
                src="/marketing/flow-demo.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
              {/* Soft vignette so edges blend into frame */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-black/5"
              />
            </div>
          </div>

          <p className="mt-5 text-center text-[13px] text-white/30">
            Triggers → Instant DMs → Questions → Capture details — one visual canvas
          </p>
        </motion.div>
      </div>
    </section>
  );
}
