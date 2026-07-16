"use client";

import dynamic from "next/dynamic";
import { ArrowDown, ArrowRight } from "lucide-react";
import Link from "next/link";
import { TextReveal } from "./text-reveal";
import { MagneticButton } from "./magnetic-button";
import { Marquee } from "./marquee";
import { motion } from "framer-motion";

const AmbientCanvas = dynamic(() => import("./ambient-canvas"), {
  ssr: false,
  loading: () => null,
});

export function MarketingHero() {
  return (
    <section className="relative min-h-[100svh] flex flex-col justify-center pt-14">
      <AmbientCanvas />

      {/* Soft CSS fallback glow if WebGL fails */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 overflow-hidden -z-20"
      >
        <div className="absolute left-1/2 top-[-10%] h-[60vh] w-[80vw] -translate-x-1/2 rounded-full bg-[#5B6AF0]/15 blur-[120px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-20 lg:px-8 lg:pt-28">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-6 text-[12px] font-medium uppercase tracking-[0.28em] text-[#8B9AFF]"
        >
          AI Instagram automation
        </motion.p>

        <TextReveal
          text={"Every DM.\nAnswered.\nEvery lead.\nQualified."}
          className="max-w-5xl text-[clamp(2.5rem,7vw,5.25rem)] font-semibold leading-[1.02] tracking-[-0.03em] text-white [&_span:nth-child(2)]:text-white/40 [&_span:nth-child(4)]:text-white/40"
        />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 max-w-xl text-lg leading-relaxed text-white/50 sm:text-xl"
        >
          Gemai turns Instagram messages and comments into calm, converting
          conversations — in your voice, around the clock.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <MagneticButton href="/sign-in" variant="primary">
            Start free
            <ArrowRight className="h-4 w-4" />
          </MagneticButton>
          <MagneticButton href="#product" variant="secondary">
            Explore product
          </MagneticButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-5 text-[13px] text-white/30"
        >
          Free plan · No card · Cancel anytime
        </motion.p>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
        <span className="text-[10px] uppercase tracking-[0.25em]">Scroll</span>
        <ArrowDown className="h-4 w-4 animate-bounce" />
      </div>

      <div className="absolute bottom-0 inset-x-0 border-t border-white/[0.06] bg-[#07080C]/80 backdrop-blur-sm">
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
