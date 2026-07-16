"use client";

import dynamic from "next/dynamic";
import { ArrowDown, ArrowRight } from "lucide-react";
import { MagneticButton } from "./magnetic-button";
import { Marquee } from "./marquee";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { useRef } from "react";

const AmbientCanvas = dynamic(() => import("./ambient-canvas"), {
  ssr: false,
  loading: () => null,
});

function FloatingAccent({
  children,
  className,
  xRange = 20,
  yRange = 14,
}: {
  children: React.ReactNode;
  className?: string;
  xRange?: number;
  yRange?: number;
}) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 80, damping: 18 });
  const springY = useSpring(y, { stiffness: 80, damping: 18 });

  return (
    <motion.div
      className={className}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
        const dy = (e.clientY - rect.top - rect.height / 2) / rect.height;
        x.set(dx * xRange);
        y.set(dy * yRange);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

export function MarketingHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [4, -4]), {
    stiffness: 60,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-4, 4]), {
    stiffness: 60,
    damping: 20,
  });

  const onMove = (e: React.MouseEvent) => {
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onMove}
      className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden"
    >
      <AmbientCanvas />

      {/* Ambient gradients */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-20">
        <div className="absolute left-1/2 top-[-15%] h-[70vh] w-[90vw] -translate-x-1/2 rounded-full bg-[#5B6AF0]/[0.12] blur-[140px]" />
        <div className="absolute bottom-[10%] right-[-10%] h-[40vh] w-[50vw] rounded-full bg-[#5B6AF0]/[0.08] blur-[100px]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 pt-28 pb-28 lg:px-8 lg:pt-32">
        <motion.div
          style={{ rotateX, rotateY, transformPerspective: 1200 }}
          className="relative"
        >
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8 flex items-center gap-3"
          >
            <span className="inline-flex h-1.5 w-1.5 rounded-full bg-[#5B6AF0]" />
            <span className="text-[12px] font-medium uppercase tracking-[0.32em] text-[#8B9AFF]">
              AI Instagram automation
            </span>
          </motion.div>

          {/* Headline — designed composition */}
          <div className="relative">
            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="max-w-[14ch] text-[clamp(3rem,8.5vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-white"
            >
              Every DM.
              <br />
              <span className="text-white/35">Answered.</span>
            </motion.h1>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 1,
                delay: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-1 max-w-[14ch] text-[clamp(3rem,8.5vw,6.5rem)] font-semibold leading-[0.95] tracking-[-0.04em] text-white"
            >
              Every lead.
              <br />
              <span className="relative inline-block">
                <span className="text-white/35">Qualified.</span>
                {/* Accent underline glow */}
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{
                    delay: 0.9,
                    duration: 0.8,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="absolute -bottom-1 left-0 h-[3px] w-full origin-left rounded-full bg-gradient-to-r from-[#5B6AF0] to-transparent"
                />
              </span>
            </motion.h1>

            {/* Floating glass accent card — like Jovaris 3D object */}
            <FloatingAccent
              className="absolute -right-2 top-4 hidden w-[140px] sm:block lg:-right-8 lg:top-8 lg:w-[180px]"
              xRange={28}
              yRange={20}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8, rotate: 12 }}
                animate={{ opacity: 1, scale: 1, rotate: 8 }}
                transition={{
                  delay: 0.7,
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-[#5B6AF0]/25" />
                  <div className="h-2 w-16 rounded-full bg-white/15" />
                </div>
                <div className="space-y-1.5">
                  <div className="h-2 w-full rounded-full bg-white/10" />
                  <div className="h-2 w-3/4 rounded-full bg-white/10" />
                </div>
                <div className="mt-3 rounded-lg bg-[#5B6AF0] px-2.5 py-1.5 text-[10px] font-medium text-white">
                  AI replied · 2s
                </div>
              </motion.div>
            </FloatingAccent>

            {/* Curved arrow accent */}
            <motion.svg
              initial={{ opacity: 0, pathLength: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.6 }}
              className="absolute -left-4 top-[42%] hidden h-16 w-16 text-[#5B6AF0] md:block lg:-left-12"
              viewBox="0 0 64 64"
              fill="none"
            >
              <motion.path
                d="M12 40 C20 20, 40 16, 52 28"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  delay: 1.1,
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
              <motion.path
                d="M46 22 L52 28 L46 34"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.4 }}
              />
            </motion.svg>
          </div>

          {/* Subcopy + CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.45,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="mt-10 max-w-lg"
          >
            <p className="text-lg leading-relaxed text-white/45 sm:text-xl">
              Gemai turns Instagram messages and comments into calm, converting
              conversations — in your voice, around the clock.
            </p>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <MagneticButton href="/sign-in" variant="primary">
                Start free
                <ArrowRight className="h-4 w-4" />
              </MagneticButton>
              <MagneticButton href="#product" variant="secondary">
                Explore product
              </MagneticButton>
            </div>

            <p className="mt-5 text-[13px] text-white/25">
              Free plan · No card · Cancel anytime
            </p>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll cue */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/25"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Scroll</span>
        <div className="h-8 w-px bg-gradient-to-b from-white/30 to-transparent" />
      </motion.div>

      {/* Marquee */}
      <div className="absolute bottom-0 inset-x-0 border-t border-white/[0.05]">
        <Marquee
          items={[
            "Inbox automation",
            "Visual flows",
            "Lead qualification",
            "Team handoff",
            "Meta official API",
            "AI replies",
            "Creator-ready",
            "Agency multi-account",
          ]}
        />
      </div>
    </section>
  );
}
