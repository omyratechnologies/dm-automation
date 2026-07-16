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
 * Framed product UI with subtle scroll parallax.
 * Ready to host a real <video> or screenshot later.
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

  const y = useTransform(smooth, [0, 1], reduced ? [0, 0] : [80, -40]);
  const scale = useTransform(smooth, [0, 0.4, 1], reduced ? [1, 1, 1] : [0.94, 1, 0.98]);
  const opacity = useTransform(
    smooth,
    [0, 0.15, 0.85, 1],
    reduced ? [1, 1, 1, 1] : [0.4, 1, 1, 0.7]
  );
  const glow = useTransform(smooth, [0, 0.5, 1], [0.15, 0.35, 0.12]);

  return (
    <section id="product" className="relative pb-24 pt-6 md:pb-32">
      <div className="mx-auto max-w-6xl px-5 lg:px-8">
        <motion.div ref={ref} style={{ y, scale, opacity }} className="relative">
          <motion.div
            aria-hidden
            style={{ opacity: glow }}
            className="pointer-events-none absolute -inset-8 rounded-[2rem] bg-[#5B6AF0] blur-[80px]"
          />

          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0C0E14] shadow-[0_40px_120px_-20px_rgba(91,106,240,0.25)]">
            <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="h-2.5 w-2.5 rounded-full bg-white/10" />
              <span className="ml-3 text-[11px] text-white/25">gemai · inbox</span>
            </div>

            <div className="grid grid-cols-12 min-h-[340px] md:min-h-[460px]">
              <div className="col-span-3 hidden border-r border-white/[0.06] p-4 md:block">
                <div className="mb-5 text-[10px] font-medium uppercase tracking-wider text-white/25">
                  Workspace
                </div>
                {["Overview", "Inbox", "Flows", "Contacts", "Leads"].map(
                  (item, i) => (
                    <div
                      key={item}
                      className={`mb-0.5 rounded-md px-2.5 py-2 text-[12px] ${
                        i === 1
                          ? "bg-[#5B6AF0]/15 text-[#A5B0FF]"
                          : "text-white/40"
                      }`}
                    >
                      {item}
                    </div>
                  )
                )}
              </div>

              <div className="col-span-12 border-r border-white/[0.06] p-3 md:col-span-4">
                <div className="mb-3 px-1 text-[10px] font-medium uppercase tracking-wider text-white/25">
                  Open · 12
                </div>
                {[
                  { name: "Ananya R.", preview: "Do you ship to Bangalore?", time: "2m" },
                  { name: "Rahul K.", preview: "Price for the starter kit?", time: "14m" },
                  { name: "Meera P.", preview: "Loved the new drop", time: "1h" },
                  { name: "Dev S.", preview: "Can I get a bulk quote?", time: "3h" },
                ].map((c, i) => (
                  <div
                    key={c.name}
                    className={`mb-1 flex items-center gap-3 rounded-lg px-2.5 py-2.5 ${
                      i === 0 ? "bg-white/[0.04]" : ""
                    }`}
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#5B6AF0]/20 text-[11px] font-medium text-[#A5B0FF]">
                      {c.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-[12px] font-medium text-white/85">
                          {c.name}
                        </span>
                        <span className="text-[10px] text-white/25">{c.time}</span>
                      </div>
                      <p className="truncate text-[11px] text-white/35">{c.preview}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="col-span-12 flex flex-col p-4 md:col-span-5">
                <div className="mb-4 border-b border-white/[0.06] pb-3">
                  <p className="text-[13px] font-medium text-white/90">Ananya R.</p>
                  <p className="text-[11px] text-white/30">@ananya.creates</p>
                </div>
                <div className="flex flex-1 flex-col gap-3">
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-2.5 text-[12px] text-white/75">
                    Hi! Do you ship to Bangalore?
                  </div>
                  <div className="ml-auto max-w-[88%] rounded-2xl rounded-br-md bg-[#5B6AF0] px-3.5 py-2.5 text-[12px] text-white">
                    Yes — we ship across India. Bangalore usually arrives in 2–3 days. Free over ₹499.
                  </div>
                  <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-white/[0.06] px-3.5 py-2.5 text-[12px] text-white/75">
                    Perfect, I'll order tonight
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
