import DoubleGradientCard from "@/components/global/double-gradient-card";
import { DASHBOARD_CARDS } from "@/constants/dashboard";
import { BarDuoToneBlue, RocketDuoToneBlue, AutomationDuoToneBlue } from "@/icons";
import React from "react";
import Chart from "../_components/metrics";
import MetricsCard from "../_components/metrics/metrics-card";
import QuickActionCard from "../_components/quick-action-card";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

const Page = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const firstName = user.firstName || "there";

  // Quick Actions Configuration
  const quickActions = [
    {
      href: `/dashboard/automations`,
      title: "Create Automation",
      subtitle: "Set up new flows",
      icon: (
        <svg className="w-5 h-5 text-slate-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      gradientFrom: "rgba(99, 102, 241, 0.2)",
      gradientTo: "rgba(139, 92, 246, 0.2)",
      iconColor: "text-slate-primary",
      hoverShadow: "rgba(99, 102, 241, 0.1)",
    },
    {
      href: `/dashboard/connections`,
      title: "Connect Account",
      subtitle: "Link social media",
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      gradientFrom: "rgba(139, 92, 246, 0.2)",
      gradientTo: "rgba(236, 72, 153, 0.2)",
      iconColor: "text-purple-400",
      hoverShadow: "rgba(139, 92, 246, 0.1)",
    },
    {
      href: `/dashboard/analytics`,
      title: "View Analytics",
      subtitle: "Track metrics",
      icon: (
        <svg className="w-5 h-5 text-pink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      gradientFrom: "rgba(236, 72, 153, 0.2)",
      gradientTo: "rgba(251, 146, 60, 0.2)",
      iconColor: "text-pink-400",
      hoverShadow: "rgba(236, 72, 153, 0.1)",
    },
    {
      href: `/dashboard/settings`,
      title: "Account Settings",
      subtitle: "Manage profile",
      icon: (
        <svg className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      gradientFrom: "rgba(34, 197, 94, 0.2)",
      gradientTo: "rgba(16, 185, 129, 0.2)",
      iconColor: "text-green-400",
      hoverShadow: "rgba(34, 197, 94, 0.1)",
    },
  ];

  return (
    <div className="flex flex-col gap-y-8 pb-10">
      {/* Welcome Header with Metrics */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-border p-8">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Welcome Text */}
          <div className="flex-1">
            <p className="text-muted-foreground text-sm font-medium mb-2">Welcome back</p>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent mb-3">
              {firstName}!
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Your AI-powered automation hub is ready. Monitor performance, manage connections, and scale your engagement effortlessly.
            </p>
          </div>

          {/* Metrics Card - Horizontal on Right */}
          <div className="flex-shrink-0">
            <MetricsCard />
          </div>
        </div>
        
        {/* Background Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Quick Actions - Horizontal Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <QuickActionCard key={index} {...action} />
        ))}
      </div>

      {/* Quick Stats Cards - New Grid Layout */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {DASHBOARD_CARDS.map((card) => (
          <DoubleGradientCard key={card.id} {...card} />
        ))}
      </div> */}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        {/* Automated Activity Section - Full Width */}
        <div className="border border-border bg-card backdrop-blur-sm p-6 rounded-2xl hover:border-primary/40 transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <BarDuoToneBlue />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Automated Activity
                </h2>
                <p className="text-muted-foreground text-sm">
                  Real-time automation insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted border border-border">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-medium text-muted-foreground">Live</span>
            </div>
          </div>
          <Chart />
        </div>
      </div>
    </div>
  );
};

export default Page;
