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
  TrendingUp,
  Activity,
  CheckCircle,
} from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

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
              className="p-6 rounded-3xl bg-card/40 border border-border/50 animate-pulse backdrop-blur-xl h-[180px]"
            >
              <div className="h-4 bg-muted-foreground/10 rounded w-24 mb-3" />
              <div className="h-8 bg-muted-foreground/10 rounded w-16" />
              <div className="h-10 bg-muted-foreground/5 rounded w-full mt-4" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="p-6 rounded-3xl bg-card/40 border border-border/50 animate-pulse backdrop-blur-xl h-[320px]">
              <div className="h-6 bg-muted-foreground/10 rounded w-32 mb-6" />
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-12 bg-muted-foreground/10 rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (overviewQuery.isError || !data) {
    return (
      <div className="p-8 rounded-3xl bg-card/60 backdrop-blur-xl border border-red-500/20 text-center shadow-2xl">
        <h3 className="text-lg font-bold text-foreground mb-2">
          Failed to Load Analytics
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Unable to fetch your analytics data
        </p>
        <button
          onClick={() => overviewQuery.refetch()}
          className="px-6 py-2.5 rounded-xl bg-gradient-brand text-white text-sm font-semibold hover:opacity-90 transition-all shadow-lg"
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
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-card/50 border border-border/40 backdrop-blur-xl w-fit">
        {([7, 30, 90] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => setDays(range)}
            className={cn(
              "px-5 py-2 rounded-xl text-xs font-bold tracking-wide transition-all uppercase duration-300",
              days === range
                ? "bg-gradient-brand text-white shadow-xl shadow-primary/20 scale-105"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
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
          colorClass="text-indigo-400"
          radialColor="rgba(99, 102, 241, 0.15)"
          sparklinePoints={[8, 12, 7, 18, 10, 22, 14, 25, data.sends > 0 ? 30 : 5]}
        />
        <StatCard
          title="Delivered"
          value={data.delivered}
          subtitle={`${deliveryRate.toFixed(0)}% delivery rate`}
          icon={<CheckCircle className="w-5 h-5" />}
          colorClass="text-emerald-400"
          radialColor="rgba(16, 185, 129, 0.15)"
          sparklinePoints={[5, 10, 6, 15, 9, 19, 12, 22, data.delivered > 0 ? 28 : 3]}
        />
        <StatCard
          title="Inbound Messages"
          value={data.inbound}
          icon={<Inbox className="w-5 h-5" />}
          colorClass="text-purple-400"
          radialColor="rgba(168, 85, 247, 0.15)"
          sparklinePoints={[12, 18, 10, 25, 16, 32, 22, 38, data.inbound > 0 ? 42 : 8]}
        />
        <StatCard
          title="New Contacts"
          value={data.newContacts}
          icon={<UserPlus className="w-5 h-5" />}
          colorClass="text-pink-400"
          radialColor="rgba(236, 72, 153, 0.15)"
          sparklinePoints={[2, 4, 3, 6, 4, 8, 5, 10, data.newContacts > 0 ? 12 : 2]}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Breakdown */}
        <div className="rounded-3xl bg-card/65 border border-border/40 p-6 hover:border-primary/20 backdrop-blur-2xl transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between mb-6 border-b border-border/20 pb-4">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-x-2">
              <Activity className="h-5 w-5 text-primary" />
              Delivery Breakdown
            </h3>
            <div className="px-3.5 py-1 rounded-full bg-muted/40 border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Last {days} days
            </div>
          </div>
          <div className="space-y-6">
            <ProgressBar
              label="Delivered"
              value={data.delivered}
              color="from-emerald-500 to-teal-400"
              percentage={data.sends > 0 ? (data.delivered / data.sends) * 100 : 0}
            />
            <ProgressBar
              label="Failed"
              value={data.failed}
              color="from-rose-500 to-red-600"
              percentage={data.sends > 0 ? (data.failed / data.sends) * 100 : 0}
            />
            <ProgressBar
              label="Rejected"
              value={data.rejected}
              color="from-amber-500 to-orange-400"
              percentage={data.sends > 0 ? (data.rejected / data.sends) * 100 : 0}
            />
          </div>
        </div>

        {/* Delivery Rate Pie */}
        <div className="rounded-3xl bg-card/65 border border-border/40 p-6 hover:border-primary/20 backdrop-blur-2xl transition-all duration-300 group shadow-lg">
          <div className="flex items-center justify-between mb-4 border-b border-border/20 pb-4">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Delivery Efficiency
            </h3>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          </div>
          <div className="flex items-center justify-center h-52 pb-4">
            <PieChart
              positive={data.delivered}
              negative={undelivered}
              positiveLabel="Delivered"
              negativeLabel="Failed/Rejected"
              centerLabel="Success Rate"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/40 hover:border-primary/20 transition-all group flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Workflow className="w-4 h-4 text-indigo-400" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Active Flows
              </p>
            </div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">
              {data.activeFlows}
            </p>
          </div>
          <div className="h-10 w-10 bg-indigo-500/10 rounded-xl flex items-center justify-center opacity-80 group-hover:scale-110 transition-transform">
            <Workflow className="w-5 h-5 text-indigo-400" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/40 hover:border-primary/20 transition-all group flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Megaphone className="w-4 h-4 text-pink-400" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Broadcasts Sent
              </p>
            </div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">
              {data.broadcasts}
            </p>
          </div>
          <div className="h-10 w-10 bg-pink-500/10 rounded-xl flex items-center justify-center opacity-80 group-hover:scale-110 transition-transform">
            <Megaphone className="w-5 h-5 text-pink-400" />
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/40 hover:border-primary/20 transition-all group flex items-center justify-between shadow-md">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Send className="w-4 h-4 text-emerald-400" />
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Overall Rate
              </p>
            </div>
            <p className="text-3xl font-extrabold text-foreground tracking-tight">
              {deliveryRate.toFixed(0)}%
            </p>
          </div>
          <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center opacity-80 group-hover:scale-110 transition-transform">
            <Send className="w-5 h-5 text-emerald-400" />
          </div>
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
  colorClass: string;
  radialColor: string;
  sparklinePoints: number[];
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  colorClass,
  radialColor,
  sparklinePoints,
}: StatCardProps) => {
  // Build SVG path for Sparkline
  const maxPoint = Math.max(...sparklinePoints, 10);
  const minPoint = Math.min(...sparklinePoints, 0);
  const range = maxPoint - minPoint || 10;
  
  const width = 220;
  const height = 40;
  const pathData = sparklinePoints
    .map((val, index) => {
      const x = (index / (sparklinePoints.length - 1)) * width;
      const y = height - 4 - ((val - minPoint) / range) * (height - 8);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  const fillPathData = `${pathData} L ${width} ${height} L 0 ${height} Z`;

  return (
    <div className="relative overflow-hidden p-6 rounded-3xl bg-card/65 border border-border/40 hover:border-primary/20 backdrop-blur-2xl transition-all duration-300 group shadow-md flex flex-col justify-between min-h-[175px]">
      {/* Glow Backdrop */}
      <div
        className="absolute -top-12 -right-12 w-28 h-28 rounded-full blur-3xl opacity-80 group-hover:scale-125 transition-transform duration-500"
        style={{ backgroundColor: radialColor }}
      />
      
      <div className="relative z-10 flex-1">
        <div className="flex items-center justify-between mb-3.5">
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            {title}
          </p>
          <div className={cn("p-2 rounded-xl bg-muted/65 border border-border/30 group-hover:scale-105 transition-transform", colorClass)}>
            {icon}
          </div>
        </div>

        <div className="flex items-baseline gap-x-2">
          <p className="text-3xl font-extrabold text-foreground tracking-tight">
            {value.toLocaleString()}
          </p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground font-semibold">
              ({subtitle})
            </p>
          )}
        </div>
      </div>

      {/* Sparkline Trendline */}
      <div className="relative h-10 w-full mt-3 overflow-hidden">
        <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`gradient-${title.replace(/\s+/g, "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={radialColor.replace("0.15", "0.25")} />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path
            d={fillPathData}
            fill={`url(#gradient-${title.replace(/\s+/g, "")})`}
            className="transition-all duration-700"
          />
          <path
            d={pathData}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            className={cn("transition-all duration-700", colorClass)}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-foreground/80 group-hover:text-primary transition-colors">
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-extrabold text-foreground">
            {value.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-muted border border-border/40 text-muted-foreground">
            {percentage.toFixed(0)}%
          </span>
        </div>
      </div>
      <div className="relative h-2.5 bg-muted/60 border border-border/20 rounded-full overflow-hidden">
        <div
          className={cn(`absolute top-0 left-0 h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out group-hover:opacity-90`)}
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
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const positiveDashArray = (positiveAngle / 360) * circumference;
  const negativeDashArray = circumference - positiveDashArray;

  return (
    <div className="relative w-48 h-48 group">
      {/* Center typography */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        <p className="text-3xl font-extrabold bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300">
          {positivePercentage.toFixed(0)}%
        </p>
        <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mt-1">
          {centerLabel}
        </p>
      </div>

      <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.1)]" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="piePositive" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="pieNegative" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Background empty ring */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(148, 163, 184, 0.05)"
          strokeWidth="16"
        />

        {/* Positive progression segment */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#piePositive)"
          strokeWidth="16"
          strokeDasharray={`${positiveDashArray} ${circumference}`}
          strokeLinecap="round"
          filter="url(#neonGlow)"
          className="transition-all duration-1000 ease-out"
        />

        {/* Negative progression segment */}
        {negative > 0 && (
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="url(#pieNegative)"
            strokeWidth="16"
            strokeDasharray={`${negativeDashArray} ${circumference}`}
            strokeDashoffset={-positiveDashArray}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out opacity-40"
          />
        )}
      </svg>

      {/* Legends */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 whitespace-nowrap">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" />
          <span className="text-[10px] font-semibold text-muted-foreground">
            {positiveLabel} ({positive})
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-slate-500 to-slate-400" />
          <span className="text-[10px] font-semibold text-muted-foreground">
            {negativeLabel} ({negative})
          </span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
