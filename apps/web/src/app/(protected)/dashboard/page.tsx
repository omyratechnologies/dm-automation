import {
  BarChart3,
  Zap,
  Link2,
  Settings,
  LineChart,
  LayoutDashboard,
  ArrowRight,
} from "lucide-react";
import React from "react";
import Chart from "./_components/metrics";
import MetricsCard from "./_components/metrics/metrics-card";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/global/page-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const Page = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName || "there";

  const shortcuts = [
    {
      href: "/dashboard/automations",
      title: "Automations",
      description: "Create and manage reply rules",
      icon: Zap,
    },
    {
      href: "/dashboard/flows",
      title: "Flows",
      description: "Build multi-step journeys",
      icon: LayoutDashboard,
    },
    {
      href: "/dashboard/inbox",
      title: "Inbox",
      description: "Handle conversations",
      icon: LineChart,
    },
    {
      href: "/dashboard/connections",
      title: "Connections",
      description: "Link Instagram accounts",
      icon: Link2,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Monitor automation performance, manage conversations, and grow engagement from one workspace."
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard/connections">
                <Link2 className="h-4 w-4 mr-1.5" />
                Connect
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/dashboard/automations">
                <Zap className="h-4 w-4 mr-1.5" />
                New automation
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI strip */}
      <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_auto] lg:items-stretch">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Performance</p>
              <p className="text-xs text-muted-foreground">
                Automated replies across comments and DMs
              </p>
            </div>
          </div>
          <MetricsCard />
        </div>

        <div className="rounded-xl border border-border bg-card p-5 min-w-[220px]">
          <p className="text-sm font-medium text-foreground mb-3">Quick links</p>
          <div className="flex flex-col gap-1">
            {[
              { href: "/dashboard/inbox", label: "Open inbox" },
              { href: "/dashboard/flows", label: "Edit flows" },
              { href: "/dashboard/analytics", label: "View analytics" },
              { href: "/dashboard/settings", label: "Settings" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-quiet"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5 opacity-50" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shortcuts grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-medium text-foreground">Get started</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {shortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex flex-col gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-quiet hover:border-hairline-strong hover:bg-accent"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {item.description}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Activity chart */}
      <section className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Automated activity
              </h2>
              <p className="text-xs text-muted-foreground">
                Real-time automation insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/40 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-[11px] font-medium text-muted-foreground">
              Live
            </span>
          </div>
        </div>
        <div className="p-5">
          <Chart />
        </div>
      </section>
    </div>
  );
};

export default Page;
