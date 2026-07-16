"use client";
import { useQueryAutomations } from "@/hooks/user-queries";
import type { AutomationListItem } from "@/lib/api-result";
import React, { useMemo } from "react";
import { MessageSquare, Mail } from "lucide-react";

const MetricsCard = () => {
  const { data, isLoading, isError } = useQueryAutomations();

  const metrics = useMemo(() => {
    const items = Array.isArray(data) ? data : [];

    const comments = items.reduce((total: number, automation: AutomationListItem) => {
      return total + (automation.listener?.commentCount || 0);
    }, 0);

    const dms = items.reduce((total: number, automation: AutomationListItem) => {
      return total + (automation.listener?.dmCount || 0);
    }, 0);

    return { comments, dms };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="min-w-[180px] rounded-lg border border-border bg-card px-4 py-3.5 animate-pulse"
          >
            <div className="space-y-2.5">
              <div className="h-3 w-16 rounded bg-muted" />
              <div className="h-7 w-12 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col sm:flex-row gap-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="min-w-[180px] rounded-lg border border-destructive/20 bg-card px-4 py-3.5"
          >
            <p className="text-xs text-destructive text-center py-1">Failed to load</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <MetricCard
        icon={<MessageSquare className="h-3.5 w-3.5" />}
        title="Comments"
        value={metrics.comments}
      />
      <MetricCard
        icon={<Mail className="h-3.5 w-3.5" />}
        title="Messages"
        value={metrics.dms}
      />
    </div>
  );
};

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: number;
}

const MetricCard = React.memo(({ icon, title, value }: MetricCardProps) => {
  return (
    <div className="min-w-[180px] rounded-lg border border-border bg-card px-4 py-3.5 transition-colors duration-quiet hover:border-hairline-strong">
      <div className="flex items-center gap-1.5 mb-1.5 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{title}</span>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        <span className="text-xs text-muted-foreground">replies</span>
      </div>
    </div>
  );
});

MetricCard.displayName = "MetricCard";

export default MetricsCard;
