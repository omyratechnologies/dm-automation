"use client";
import { useQueryAutomations } from "@/hooks/user-queries";
import React, { useMemo } from "react";

interface AutomationListener {
  commentCount?: number;
  dmCount?: number;
}

interface Automation {
  listener?: AutomationListener | null;
}

type Props = {};

const MetricsCard = (props: Props) => {
  const { data, isLoading, isError } = useQueryAutomations();

  // Memoize calculations for better performance
  const metrics = useMemo(() => {
    if (!data?.data) {
      return { comments: 0, dms: 0 };
    }

    const comments = data.data.reduce((total: number, automation: Automation) => {
      return total + (automation.listener?.commentCount || 0);
    }, 0);

    const dms = data.data.reduce((total: number, automation: Automation) => {
      return total + (automation.listener?.dmCount || 0);
    }, 0);

    return { comments, dms };
  }, [data]);

  // Loading State
  if (isLoading) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="relative overflow-hidden px-5 py-4 border border-border bg-card backdrop-blur-md rounded-xl min-w-[200px] animate-pulse">
            <div className="space-y-3">
              <div className="h-3 bg-muted rounded w-20" />
              <div className="h-8 bg-muted rounded w-16" />
              <div className="h-2 bg-muted rounded w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="relative overflow-hidden px-5 py-4 border border-red-500/20 bg-card backdrop-blur-md rounded-xl min-w-[200px]">
            <div className="text-center py-2">
              <p className="text-xs text-red-400">Failed to load</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Comments Card */}
      <MetricCard
        icon={
          <svg className="w-4 h-4 text-slate-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        }
        title="Comments"
        value={metrics.comments}
        gradientFrom="from-slate-primary"
        gradientTo="to-purple-400"
        borderColor="border-slate-primary/30"
        hoverBorderColor="hover:border-slate-primary/50"
        progressColor="from-slate-primary to-purple-400"
        percentageColor="text-slate-primary"
        glowFrom="from-slate-primary/20"
      />

      {/* Direct Messages Card */}
      <MetricCard
        icon={
          <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        }
        title="Messages"
        value={metrics.dms}
        gradientFrom="from-purple-400"
        gradientTo="to-pink-400"
        borderColor="border-purple-500/30"
        hoverBorderColor="hover:border-purple-500/50"
        progressColor="from-purple-400 to-pink-400"
        percentageColor="text-purple-400"
        glowFrom="from-purple-500/20"
      />
    </div>
  );
};

// Separate MetricCard component for better reusability and memoization
interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
  hoverBorderColor: string;
  progressColor: string;
  percentageColor: string;
  glowFrom: string;
}

const MetricCard = React.memo(({
  icon,
  title,
  value,
  gradientFrom,
  gradientTo,
  borderColor,
  hoverBorderColor,
  progressColor,
  percentageColor,
  glowFrom,
}: MetricCardProps) => {
  return (
    <div className={`relative overflow-hidden px-5 py-4 border ${borderColor} bg-card backdrop-blur-md rounded-xl ${hoverBorderColor} transition-all duration-300 group min-w-[200px]`}>
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${glowFrom} to-transparent rounded-full blur-xl`} />
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          {icon}
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
            {value}
          </span>
          <span className="text-xs text-muted-foreground">replies</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full w-full bg-gradient-to-r ${progressColor} rounded-full`} />
          </div>
          <span className={`text-xs font-medium ${percentageColor}`}>100%</span>
        </div>
      </div>
    </div>
  );
});

MetricCard.displayName = "MetricCard";

export default MetricsCard;
