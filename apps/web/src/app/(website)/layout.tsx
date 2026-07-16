import { SmoothScroll } from "@/components/marketing/smooth-scroll";
import React from "react";

/**
 * Marketing route group layout.
 * Lenis is enabled here only — never on dashboard.
 */
export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SmoothScroll>{children}</SmoothScroll>;
}
