import { BarChart3, Zap, Link2, Settings, LineChart } from "lucide-react";
import React from "react";
import Chart from "./_components/metrics";
import MetricsCard from "./_components/metrics/metrics-card";
import QuickActionCard from "./_components/quick-action-card";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName || "there";

  const quickActions = [
    {
      href: `/dashboard/automations`,
      title: "Create Automation",
      subtitle: "Set up new flows",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      href: `/dashboard/connections`,
      title: "Connect Account",
      subtitle: "Link social media",
      icon: <Link2 className="h-4 w-4" />,
    },
    {
      href: `/dashboard/analytics`,
      title: "View Analytics",
      subtitle: "Track metrics",
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      href: `/dashboard/settings`,
      title: "Account Settings",
      subtitle: "Manage profile",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="flex flex-col gap-y-8 pb-10">
      {/* Welcome Header */}
      <section className="rounded-xl border border-border bg-card p-6 lg:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Welcome back
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
              {firstName}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl">
              Your AI-powered automation hub is ready. Monitor performance,
              manage connections, and scale your engagement.
            </p>
          </div>

          <div className="shrink-0">
            <MetricsCard />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <QuickActionCard key={action.href} {...action} />
        ))}
      </section>

      {/* Automated Activity */}
      <section className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Automated Activity
              </h2>
              <p className="text-sm text-muted-foreground">
                Real-time automation insights
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-muted/50 px-2.5 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            <span className="text-xs font-medium text-muted-foreground">Live</span>
          </div>
        </div>
        <Chart />
      </section>
    </div>
  );
};

export default Page;
