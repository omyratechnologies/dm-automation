"use client";

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useReducedMotion,
} from "framer-motion";
import { useRef } from "react";
import { Check, Inbox, Workflow, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAPTERS = [
  {
    num: "01",
    eyebrow: "Inbox",
    title: "Human when it matters.\nAutomated when it doesn’t.",
    body: "AI handles the routine. You take over in one click. Assignment, status, and delivery — always visible.",
    points: [
      "Optimistic send with delivery status",
      "Bot to human handoff in one action",
      "Shared team inbox with assignment",
    ],
    icon: Inbox,
    mock: "inbox" as const,
  },
  {
    num: "02",
    eyebrow: "Flows",
    title: "Design journeys,\nnot just auto-replies.",
    body: "Triggers, conditions, AI steps, and tags — connected in a visual builder that stays clear under pressure.",
    points: [
      "Keyword, comment, and story triggers",
      "Branching conditions and wait steps",
      "AI reply and lead qualification nodes",
    ],
    icon: Workflow,
    mock: "flows" as const,
  },
  {
    num: "03",
    eyebrow: "Leads",
    title: "Qualify without\nleaving Instagram.",
    body: "Capture fields, score intent, and move prospects through a simple board your whole team can follow.",
    points: [
      "Custom lead fields",
      "Status pipeline",
      "Tags that sync with automations",
    ],
    icon: BarChart3,
    mock: "leads" as const,
  },
];

function ChapterMock({ type }: { type: "inbox" | "flows" | "leads" }) {
  if (type === "inbox") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#5B6AF0]/20 text-[11px] font-medium text-[#A5B0FF]">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-white/85">Ananya R.</p>
            <p className="truncate text-[11px] text-white/35">
              Do you ship to Bangalore?
            </p>
          </div>
          <span className="text-[10px] text-white/25">2m</span>
        </div>
        <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#5B6AF0] px-3.5 py-2.5 text-[12px] text-white">
          Yes — Bangalore in 2–3 days. Free over ₹499.
        </div>
        <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-2.5 text-[12px] text-white/75">
          Perfect, ordering tonight
        </div>
      </div>
    );
  }

  if (type === "flows") {
    return (
      <div className="space-y-3">
        {[
          { label: "Trigger · Comment keyword", color: "bg-[#5B6AF0]/20 text-[#A5B0FF]" },
          { label: "Condition · Contains “price”", color: "bg-amber-500/15 text-amber-300/90" },
          { label: "AI Reply · Brand voice", color: "bg-emerald-500/15 text-emerald-300/90" },
        ].map((n, i) => (
          <div key={n.label} className="relative">
            <div
              className={cn(
                "rounded-lg border border-white/[0.08] px-3.5 py-3 text-[12px] font-medium",
                n.color
              )}
            >
              {n.label}
            </div>
            {i < 2 && (
              <div className="mx-auto h-3 w-px bg-white/10" />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {["New", "Contacted", "Qualified"].map((col, i) => (
        <div
          key={col}
          className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2"
        >
          <p className="mb-2 text-[10px] font-medium uppercase tracking-wider text-white/35">
            {col}
          </p>
          <div className="space-y-1.5">
            {Array.from({ length: 2 - (i === 2 ? 1 : 0) }).map((_, j) => (
              <div
                key={j}
                className="h-10 rounded-md border border-white/[0.05] bg-white/[0.03]"
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Chapter({
  chapter,
  index,
}: {
  chapter: (typeof CHAPTERS)[number];
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const y = useTransform(smooth, [0, 0.5, 1], reduced ? [0, 0, 0] : [48, 0, -24]);
  const opacity = useTransform(
    smooth,
    [0, 0.2, 0.8, 1],
    reduced ? [1, 1, 1, 1] : [0, 1, 1, 0.35]
  );
  const scale = useTransform(
    smooth,
    [0, 0.25, 0.75, 1],
    reduced ? [1, 1, 1, 1] : [0.96, 1, 1, 0.98]
  );
  const panelY = useTransform(
    smooth,
    [0, 0.5, 1],
    reduced ? [0, 0, 0] : [64, 0, -16]
  );

  const Icon = chapter.icon;
  const reverse = index % 2 === 1;

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      className="grid min-h-[70vh] items-center gap-12 py-16 lg:grid-cols-2 lg:py-24"
    >
      <motion.div
        style={{ y }}
        className={cn(reverse && "lg:order-2")}
      >
        <div className="text-[13px] font-medium tracking-[0.2em] text-[#8B9AFF]">
          {chapter.num} — {chapter.eyebrow}
        </div>
        <h3 className="mt-4 whitespace-pre-line text-2xl font-semibold tracking-tight sm:text-3xl sm:leading-snug">
          {chapter.title}
        </h3>
        <p className="mt-4 max-w-md text-base leading-relaxed text-white/45">
          {chapter.body}
        </p>
        <ul className="mt-8 space-y-3">
          {chapter.points.map((p) => (
            <li
              key={p}
              className="flex items-start gap-3 text-[15px] text-white/60"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#5B6AF0]/15">
                <Check className="h-3 w-3 text-[#8B9AFF]" />
              </span>
              {p}
            </li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        style={{ y: panelY, scale }}
        className={cn(reverse && "lg:order-1")}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-transparent p-6 sm:p-10">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-[#5B6AF0]/12 blur-3xl" />
          <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-[#5B6AF0]/[0.07] blur-3xl" />
          <div className="relative rounded-xl border border-white/[0.08] bg-[#0C0E14] p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#5B6AF0]/15 text-[#8B9AFF]">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/90">
                  {chapter.eyebrow}
                </p>
                <p className="text-xs text-white/30">Live in Gemai</p>
              </div>
            </div>
            <ChapterMock type={chapter.mock} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Scroll-linked product storytelling.
 * Each chapter parallax-fades and lifts as it enters / leaves the viewport.
 */
export function ProductChapters() {
  const headerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: headerRef,
    offset: ["start end", "end start"],
  });
  const headerY = useTransform(
    scrollYProgress,
    [0, 1],
    reduced ? [0, 0] : [40, -20]
  );
  const headerOpacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.85, 1],
    reduced ? [1, 1, 1, 1] : [0, 1, 1, 0.5]
  );

  return (
    <section className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div
          ref={headerRef}
          style={{ y: headerY, opacity: headerOpacity }}
          className="mb-8 md:mb-12"
        >
          <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/35">
            Product
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl sm:leading-[1.1]">
            Built for how conversations
            <span className="text-white/40"> actually happen.</span>
          </h2>
        </motion.div>

        <div className="divide-y divide-white/[0.06]">
          {CHAPTERS.map((chapter, index) => (
            <Chapter key={chapter.num} chapter={chapter} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
