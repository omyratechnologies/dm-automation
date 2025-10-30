"use client";

import { useQueryAutomations } from "@/hooks/user-queries";
import React, { useMemo, useState } from "react";

type TimeRange = "7d" | "30d" | "90d" | "all";

interface AutomationAnalytics {
  id: string;
  name: string;
  active: boolean;
  comments: number;
  dms: number;
  createdAt: Date;
}

const AnalyticsDashboard = () => {
  const { data, isLoading, isError, refetch } = useQueryAutomations();
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Calculate analytics metrics
  const analytics = useMemo(() => {
    if (!data?.data) {
      return {
        totalAutomations: 0,
        activeAutomations: 0,
        totalComments: 0,
        totalDMs: 0,
        totalInteractions: 0,
        automationsList: [] as AutomationAnalytics[],
        averageResponseRate: 0,
      };
    }

    const automationsList: AutomationAnalytics[] = data.data.map((automation: any) => ({
      id: automation.id,
      name: automation.name,
      active: !!automation.listener,
      comments: automation.listener?.commentCount || 0,
      dms: automation.listener?.dmCount || 0,
      createdAt: automation.createdAt,
    }));

    const totalComments = automationsList.reduce((sum: number, a: AutomationAnalytics) => sum + a.comments, 0);
    const totalDMs = automationsList.reduce((sum: number, a: AutomationAnalytics) => sum + a.dms, 0);
    const totalInteractions = totalComments + totalDMs;
    const activeAutomations = automationsList.filter((a: AutomationAnalytics) => a.active).length;

    return {
      totalAutomations: automationsList.length,
      activeAutomations,
      totalComments,
      totalDMs,
      totalInteractions,
      automationsList,
      averageResponseRate: automationsList.length > 0 ? (activeAutomations / automationsList.length) * 100 : 0,
    };
  }, [data]);

  // Filter automations based on search
  const filteredAutomations = useMemo(() => {
    if (!searchQuery) return analytics.automationsList;
    
    return analytics.automationsList.filter((automation: AutomationAnalytics) =>
      automation.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [analytics.automationsList, searchQuery]);

  // Loading State
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 rounded-xl bg-muted border border-border animate-pulse">
              <div className="h-4 bg-muted-foreground/20 rounded w-24 mb-3" />
              <div className="h-8 bg-muted-foreground/20 rounded w-16" />
            </div>
          ))}
        </div>
        
        {/* Table Skeleton */}
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
  if (isError) {
    return (
      <div className="p-8 rounded-xl bg-card border border-red-500/20 text-center">
        <div className="inline-flex p-4 rounded-full bg-red-500/10 mb-4">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Analytics</h3>
        <p className="text-sm text-muted-foreground mb-4">Unable to fetch your analytics data</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-lg bg-gradient-brand text-white text-sm font-medium hover:shadow-glow transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-muted border border-border">
          {[
            { value: "7d", label: "7 Days" },
            { value: "30d", label: "30 Days" },
            { value: "90d", label: "90 Days" },
            { value: "all", label: "All Time" },
          ].map((range) => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value as TimeRange)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                timeRange === range.value
                  ? "bg-gradient-brand text-white shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border min-w-[250px]">
          <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search automations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Automations"
          value={analytics.totalAutomations}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          }
          gradientFrom="from-indigo-500"
          gradientTo="to-purple-500"
          trend="+12%"
          onHover={() => setHoveredCard("total")}
          isHovered={hoveredCard === "total"}
        />
        
        <StatCard
          title="Active Now"
          value={analytics.activeAutomations}
          subtitle={`${analytics.averageResponseRate.toFixed(0)}% active rate`}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          }
          gradientFrom="from-green-500"
          gradientTo="to-emerald-500"
          trend="+5%"
          onHover={() => setHoveredCard("active")}
          isHovered={hoveredCard === "active"}
        />
        
        <StatCard
          title="Total Comments"
          value={analytics.totalComments}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          }
          gradientFrom="from-purple-500"
          gradientTo="to-pink-500"
          trend="+23%"
          onHover={() => setHoveredCard("comments")}
          isHovered={hoveredCard === "comments"}
        />
        
        <StatCard
          title="Total Messages"
          value={analytics.totalDMs}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          gradientFrom="from-pink-500"
          gradientTo="to-orange-500"
          trend="+18%"
          onHover={() => setHoveredCard("messages")}
          isHovered={hoveredCard === "messages"}
        />
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Distribution Chart */}
        <div className="rounded-xl bg-card border border-border p-6 hover:border-primary/40 transition-all group">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Engagement Distribution</h3>
            <div className="px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-muted-foreground">
              Live
            </div>
          </div>
          <div className="space-y-6">
            <ProgressBar
              label="Comments"
              value={analytics.totalComments}
              max={analytics.totalInteractions || 1}
              color="from-purple-500 to-pink-500"
              percentage={analytics.totalInteractions > 0 ? (analytics.totalComments / analytics.totalInteractions) * 100 : 0}
            />
            <ProgressBar
              label="Messages"
              value={analytics.totalDMs}
              max={analytics.totalInteractions || 1}
              color="from-pink-500 to-orange-500"
              percentage={analytics.totalInteractions > 0 ? (analytics.totalDMs / analytics.totalInteractions) * 100 : 0}
            />
          </div>
        </div>

        {/* Automation Status Pie Chart */}
        <div className="rounded-xl bg-card border border-border p-6 hover:border-primary/40 transition-all group">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">Automation Status</h3>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="flex items-center justify-center h-52 pb-4">
            <PieChart
              active={analytics.activeAutomations}
              inactive={analytics.totalAutomations - analytics.activeAutomations}
            />
          </div>
        </div>
      </div>

      {/* Interactive Activity Timeline */}
      {filteredAutomations.length > 0 && (
        <div className="rounded-xl bg-card border border-border p-6 hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Top Performing Automations</h3>
            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="space-y-4">
            {filteredAutomations.slice(0, 5).map((automation: AutomationAnalytics, index: number) => {
              const totalEngagement = automation.comments + automation.dms;
              const maxEngagement = Math.max(...filteredAutomations.map((a: AutomationAnalytics) => a.comments + a.dms), 1);
              const percentage = maxEngagement > 0 ? (totalEngagement / maxEngagement) * 100 : 0;
              
              return (
                <div key={automation.id} className="group cursor-pointer">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-xs font-bold text-primary group-hover:scale-110 transition-transform">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {automation.name || `Automation ${index + 1}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{totalEngagement}</span>
                      <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                        interactions
                      </span>
                    </div>
                  </div>
                  <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary via-primary/80 to-primary/60 rounded-full transition-all duration-700 ease-out group-hover:scale-y-125 origin-left"
                      style={{ width: `${percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-shimmer" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Automations Table */}
      <div className="rounded-xl bg-card border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Automation Performance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Detailed breakdown of each automation&apos;s metrics
          </p>
        </div>

        {filteredAutomations.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex p-4 rounded-full bg-muted mb-4">
              <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              {searchQuery ? "No Results Found" : "No Automations Yet"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery ? "Try a different search term" : "Create your first automation to see analytics"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Automation Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Comments
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Messages
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Total Interactions
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAutomations.map((automation: AutomationAnalytics, index: number) => (
                  <tr
                    key={automation.id}
                    className="border-b border-border hover:bg-accent transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">
                            {automation.name?.charAt(0) || "A"}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {automation.name || `Automation ${index + 1}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ID: {automation.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          automation.active
                            ? "bg-green-500/10 text-green-400"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${automation.active ? "bg-green-500" : "bg-muted-foreground"}`} />
                        {automation.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-foreground">{automation.comments}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-foreground">{automation.dms}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                        {automation.comments + automation.dms}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`/dashboard/automations/${automation.id}`}
                        className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                      >
                        View Details →
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      {filteredAutomations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-6 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Total Interactions</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {analytics.totalInteractions}
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Average per Automation</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {analytics.totalAutomations > 0 ? Math.round(analytics.totalInteractions / analytics.totalAutomations) : 0}
            </p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Automation Rate</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {analytics.averageResponseRate.toFixed(0)}%
            </p>
          </div>
        </div>
      )}
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
  trend?: string;
  onHover?: () => void;
  isHovered?: boolean;
}

const StatCard = ({ title, value, subtitle, icon, gradientFrom, gradientTo, trend, onHover, isHovered }: StatCardProps) => {
  return (
    <div 
      className={`relative overflow-hidden p-6 rounded-xl bg-card border border-border hover:border-primary/40 transition-all duration-300 group cursor-pointer ${isHovered ? 'scale-105 shadow-2xl shadow-primary/20' : ''}`}
      onMouseEnter={onHover}
      onMouseLeave={onHover}
    >
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${gradientFrom}/10 to-transparent rounded-full blur-2xl group-hover:blur-3xl transition-all`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`inline-flex p-2.5 rounded-lg bg-gradient-to-br ${gradientFrom}/20 ${gradientTo}/20 group-hover:scale-110 transition-transform duration-300`}>
            <div className={`bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent`}>
              {icon}
            </div>
          </div>
          {trend && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 group-hover:bg-green-500/20 transition-colors">
              <svg className="w-3 h-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              <span className="text-xs font-bold text-green-500">{trend}</span>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2 group-hover:text-foreground transition-colors">{title}</p>
        <p className={`text-3xl font-bold bg-gradient-to-r ${gradientFrom} ${gradientTo} bg-clip-text text-transparent mb-1 group-hover:scale-110 transition-transform duration-300 origin-left inline-block`}>
          {value}
        </p>
        {subtitle && <p className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">{subtitle}</p>}
      </div>
      {/* Animated Border */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-r ${gradientFrom} ${gradientTo} opacity-20 blur-xl`} />
      </div>
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
  percentage: number;
}

const ProgressBar = ({ label, value, max, color, percentage }: ProgressBarProps) => {
  return (
    <div className="group">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{label}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">{value}</span>
          <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 ease-out group-hover:scale-y-110`}
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
    </div>
  );
};

// Pie Chart Component
interface PieChartProps {
  active: number;
  inactive: number;
}

const PieChart = ({ active, inactive }: PieChartProps) => {
  const total = active + inactive;
  const activePercentage = total > 0 ? (active / total) * 100 : 0;
  const inactivePercentage = total > 0 ? (inactive / total) * 100 : 0;
  
  // Calculate angles for SVG arc
  const activeAngle = (activePercentage / 100) * 360;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const activeDashArray = (activeAngle / 360) * circumference;
  const inactiveDashArray = circumference - activeDashArray;

  return (
    <div className="relative w-48 h-48 group">
      {/* SVG Circle Chart */}
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
        {/* Background Circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="rgba(100, 116, 139, 0.1)"
          strokeWidth="20"
        />
        
        {/* Active Segment */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#activeGradient)"
          strokeWidth="20"
          strokeDasharray={`${activeDashArray} ${circumference}`}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Inactive Segment */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#inactiveGradient)"
          strokeWidth="20"
          strokeDasharray={`${inactiveDashArray} ${circumference}`}
          strokeDashoffset={-activeDashArray}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#34d399" />
          </linearGradient>
          <linearGradient id="inactiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Center Text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
          {activePercentage.toFixed(0)}%
        </p>
        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Active Rate</p>
      </div>
      
      {/* Legend */}
      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-500 to-emerald-400" />
          <span className="text-xs text-muted-foreground">Active ({active})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-slate-500 to-slate-400" />
          <span className="text-xs text-muted-foreground">Inactive ({inactive})</span>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
