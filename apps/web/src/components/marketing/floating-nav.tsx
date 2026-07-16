"use client";

import Link from "next/link";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";
import GemaiLogo from "@/components/global/gemai-logo";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function FloatingNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 40);
  });

  return (
    <div className="fixed top-0 inset-x-0 z-50 flex justify-center pt-4 px-4 pointer-events-none">
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "pointer-events-auto flex h-12 items-center gap-1 rounded-full border px-2 pl-4 pr-2 transition-all duration-500",
          scrolled
            ? "border-white/10 bg-[#0C0E14]/85 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl"
            : "border-white/[0.08] bg-white/[0.04] backdrop-blur-xl"
        )}
      >
        <Link href="/" className="mr-3 flex items-center shrink-0">
          <GemaiLogo size="lg" className="h-5" />
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-1.5 text-[13px] text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-2 flex items-center gap-1.5">
          <Link
            href="/sign-in"
            className="hidden rounded-full px-3.5 py-1.5 text-[13px] text-white/55 transition-colors hover:text-white sm:block"
          >
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-[#07080C] transition-colors hover:bg-white/90"
          >
            Get started
          </Link>
        </div>
      </motion.header>
    </div>
  );
}
