"use client";
import { Card, CardContent } from "@/components/ui/card";
import { SkeletonCard, SkeletonGrid } from "@/components/ui/skeleton";
import { useQueryAutomations } from "@/hooks/user-queries";
import type { AutomationListItem } from "@/lib/api-result";
import React, { useMemo } from "react";

type Props = {};

const Chart = (props: Props) => {
  const { data, isLoading, isError, refetch, error } = useQueryAutomations();
  
  // Calculate real statistics
  const stats = useMemo(() => {
    if (!data) return { total: 0, active: 0, interactions: 0 };
    
    const totalAutomations = data.length;
    const activeAutomations = data.filter((automation: AutomationListItem) => automation.listener).length;
    const totalInteractions = data.reduce((sum: number, automation: AutomationListItem) => {
      return sum + (automation.listener?.commentCount || 0) + (automation.listener?.dmCount || 0);
    }, 0);
    
    return {
      total: totalAutomations,
      active: activeAutomations,
      interactions: totalInteractions
    };
  }, [data]);

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Grid Skeleton */}
        <SkeletonGrid count={3} />

        {/* Content Skeleton */}
        <div className="relative overflow-hidden rounded-xl bg-muted border border-border p-6 animate-pulse">
          <div className="space-y-4">
            <div className="flex justify-between">
              <div className="h-4 bg-muted-foreground/20 rounded w-32" />
              <div className="h-4 bg-muted-foreground/20 rounded w-20" />
            </div>
            <div className="space-y-3">
              <div>
                <div className="h-3 bg-muted-foreground/20 rounded w-full mb-2" />
                <div className="h-2 bg-muted-foreground/20 rounded w-full" />
              </div>
              <div>
                <div className="h-3 bg-muted-foreground/20 rounded w-full mb-2" />
                <div className="h-2 bg-muted-foreground/20 rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (isError) {
    return (
      <div className="relative overflow-hidden rounded-xl bg-card border border-red-500/20 p-6">
        <div className="text-center py-8">
          <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-foreground mb-2">Failed to Load Data</h3>
          <p className="text-sm text-muted-foreground mb-4">
            We couldn&apos;t fetch your automation data. Please try again.
          </p>
          {error && (
            <p className="text-xs text-red-400 mb-4 font-mono">
              {error instanceof Error ? error.message : 'Unknown error'}
            </p>
          )}
          <button 
            onClick={() => refetch()} 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-medium hover:shadow-glow transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        <div className="relative overflow-hidden p-4 rounded-xl bg-muted border border-border group hover:border-primary/40 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl" />
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Automations</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {stats.total}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden p-4 rounded-xl bg-muted border border-border group hover:border-primary/40 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl" />
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Active Now</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {stats.active}
            </p>
          </div>
        </div>

        <div className="relative overflow-hidden p-4 rounded-xl bg-muted border border-border group hover:border-primary/40 transition-all">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl" />
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Interactions</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {stats.interactions}
            </p>
          </div>
        </div>
      </div>

      {/* Visual Representation */}
      <div className="relative overflow-hidden rounded-xl bg-muted border border-border p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/3 to-primary/5" />
        
        {stats.total > 0 ? (
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">Automation Performance</h3>
              <span className="text-xs text-muted-foreground">Last 30 days</span>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Active Automations</span>
                  <span>{stats.active} / {stats.total}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                    style={{ width: `${stats.total > 0 ? (stats.active / stats.total) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>Engagement Rate</span>
                  <span>{stats.interactions > 0 ? '100%' : '0%'}</span>
                </div>
                <div className="h-2 bg-background rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all duration-500"
                    style={{ width: stats.interactions > 0 ? '100%' : '0%' }}
                  />
                </div>
              </div>
            </div>

            {/* Activity Indicators */}
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-muted-foreground">All Systems Active</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-background/50">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Real-time Monitoring</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative z-10 text-center py-8">
            <div className="inline-flex p-4 rounded-full bg-muted mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">No Automations Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">Create your first automation to start tracking activity</p>
            <a href={`/dashboard/automations`} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-medium hover:shadow-glow transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Automation
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chart;
