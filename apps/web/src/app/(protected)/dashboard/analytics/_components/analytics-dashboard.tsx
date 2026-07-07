"use client";

import { useApi } from "@/hooks/use-api";
import type { AnalyticsOverview } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox,
  Megaphone,
  Send,
  UserPlus,
  Workflow,
} from "lucide-react";
import React, { useState } from "react";

type TimeRange = 7 | 30 | 90;

const AnalyticsDashboard = () => {
  const { api, wsPath, workspaceId } = useApi();
  const [days, setDays] = useState<TimeRange>(30);

  const overviewQuery = useQuery({
    queryKey: ["analytics", workspaceId, days],
    queryFn: () =>
      api<AnalyticsOverview>(wsPath(`/analytics/overview?days=${days}`)),
    enabled: !!workspaceId,
  });

  const data = overviewQuery.data;

  // Loading State
  if (overviewQuery.isLoading || !workspaceId) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-muted border border-border animate-pulse"
            >
              <div className="h-4 bg-muted-foreground/20 rounded w-24 mb-3" />
              <div className="h-8 bg-muted-foreground/20 rounded w-16" />
            </div>
          ))}
        </div>
        <div className="p-6 rounded-xl bg-muted border border-border animate-pulse">
          <div className="h-6 bg-muted-foreground/20 rounded w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted-foreground/20 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (overviewQuery.isError || !data) {
    return (
      <div className="p-8 rounded-xl bg-card border border-red-500/20 text-center">
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Failed to Load Analytics
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Unable to fetch your analytics data
        </p>
        <button
          onClick={() => overviewQuery.refetch()}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white text-sm font-medium hover:opacity-90 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  const undelivered = data.failed + data.rejected;
  const deliveryRate =
    data.sends > 0 ? (data.delivered / data.sends) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center gap-2 p-1 rounded-lg bg-muted border border-border w-fit">
        {([7, 30, 90] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setDays(range)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              days === range
                ? "bg-gradient-to-r from-[#3352CC] to-[#1C2D70] text-white shadow-lg"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {range} Days
          </button>
        ))}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Messages Sent"
          value={data.sends}
          icon={<Send className="w-5 h-5" />}
          gradientFrom="from-indigo-500"
          gradientTo="to-purple-500"
        />
        <StatCard
          title="Delivered"
          value={data.delivered}
          subtitle={`${deliveryRate.toFixed(0)}% delivery rate`}
          icon={<Send className="w-5 h-5" />}
          gradientFrom="from-green-500"
          gradientTo="to-emerald-500"
        />
        <StatCard
          title="Inbound Messages"
          value={data.inbound}
          icon={<Inbox className="w-5 h-5" />}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-500"
        />
        <StatCard
          title="New Contacts"
          value={data.newContacts}
          icon={<UserPlus className="w-5 h-5" />}
          gradientFrom="from-pink-500"
          gradientTo="to-orange-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Breakdown */}
        <div className="rounded-xl bg-card border border-border p-6 hover:border-primary/40 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              Delivery Breakdown
            </h3>
            <div className="px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">
              Last {days} days
            </div>
          </div>
          <div className="space-y-6">
            <ProgressBar
              label="Delivered"
              value={data.delivered}
              color="from-green-500 to-emerald-500"
              percentage={data.sends > 0 ? (data.delivered / data.sends) * 100 : 0}
            />
            <ProgressBar
              label="Failed"
              value={data.failed}
              color="from-red-500 to-rose-500"
              percentage={data.sends > 0 ? (data.failed / data.sends) * 100 : 0}
            />
            <ProgressBar
              label="Rejected"
              value={data.rejected}
              color="from-amber-500 to-orange-500"
              percentage={data.sends > 0 ? (data.rejected / data.sends) * 100 : 0}
            />
          </div>
        </div>

        {/* Delivery Rate Pie */}
        <div className="rounded-xl bg-card border border-border p-6 hover:border-primary/40 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              Delivery Rate
            </h3>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="flex items-center justify-center h-52 pb-4">
            <PieChart
              positive={data.delivered}
              negative={undelivered}
              positiveLabel="Delivered"
              negativeLabel="Undelivered"
              centerLabel="Delivery Rate"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Workflow className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Active Flows
            </p>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {data.activeFlows}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Megaphone className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Broadcasts Sent
            </p>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {data.broadcasts}
          </p>
        </div>
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Delivery Rate
            </p>
          </div>
          <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {deliveryRate.toFixed(0)}%
          </p>
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  gradientFrom: string;
  gradientTo: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  gradientFrom,
  gradientTo,
}: StatCardProps) => {
  return (
    <div className="relative overflow-hidden p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-300 group">
      <div
        className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradientFrom}/10 to-transparent rounded-full blur-2xl group-hover:blur-3xl transition-all`}
      />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${gradientFrom}/20 ${gradientTo}/20 group-hover:scale-110 transition-transform duration-300`}
          >
            <div
              className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}
            >
              {icon}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 group-hover:text-foreground transition-colors">
          {title}
        </p>
        <p
          className={`text-3xl font-bold bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform duration-300 origin-left inline-block`}
        >
          {value.toLocaleString()}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  label: string;
  value: number;
  color: string;
  percentage: number;
}

const ProgressBar = ({ label, value, color, percentage }: ProgressBarProps) => {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {value.toLocaleString()}
          </span>
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out group-hover:scale-y-110`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
    </div>
  );
};

// Pie Chart Component
interface PieChartProps {
  positive: number;
  negative: number;
  positiveLabel: string;
  negativeLabel: string;
  centerLabel: string;
}

const PieChart = ({
  positive,
  negative,
  positiveLabel,
  negativeLabel,
  centerLabel,
}: PieChartProps) => {
  const total = positive + negative;
  const positivePercentage = total > 0 ? (positive / total) * 100 : 0;

  const positiveAngle = (positivePercentage / 100) * 360;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const positiveDashArray = (positiveAngle / 360) * circumference;
  const negativeDashArray = circumference - positiveDashArray;

  return (
    <div className="relative w-48 h-48 group">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(100, 116, 139, 0.1)"
          strokeWidth="20"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#positiveGradient)"
          strokeWidth="20"
          strokeDasharray={`${positiveDashArray} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#negativeGradient)"
          strokeWidth="20"
          strokeDasharray={`${negativeDashArray} ${circumference}`}
          strokeDashoffset={-positiveDashArray}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient
            id="positiveGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient
            id="negativeGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
          {positivePercentage.toFixed(0)}%
        </p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">
          {centerLabel}
        </p>
      </div>

      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <span className="text-xs text-muted-foreground">
            {positiveLabel} ({positive})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-500 to-slate-400" />
          <span className="text-xs text-muted-foreground">
            {negativeLabel} ({negative})
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
