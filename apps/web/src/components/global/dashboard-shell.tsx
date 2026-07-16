"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
};

/**
 * Structural app shell for the product.
 * - Fixed collapsible sidebar
 * - Sticky top header bar
 * - Main content region with clear hierarchy
 */
const DashboardShell = ({ sidebar, header, children }: Props) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("gemai-sidebar-collapsed") === "1");
    } catch {
      // ignore
    }

    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && typeof detail.collapsed === "boolean") {
        setCollapsed(detail.collapsed);
      }
    };

    window.addEventListener("sidebar-collapse", handler);
    return () => window.removeEventListener("sidebar-collapse", handler);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {sidebar}

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-200 ease-quiet",
          collapsed ? "lg:pl-[64px]" : "lg:pl-[248px]"
        )}
      >
        {/* Sticky product header */}
        <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex h-14 items-center px-4 lg:px-6">{header}</div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
};

export default DashboardShell;
