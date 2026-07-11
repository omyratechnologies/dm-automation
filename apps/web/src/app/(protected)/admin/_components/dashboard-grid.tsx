"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  Activity, 
  Settings, 
  AlertTriangle, 
  ShieldAlert, 
  Workflow, 
  RefreshCw,
  Move
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PlatformStats {
  totalUsers: number;
  activeIgAccounts: number;
  totalWebhookEvents: number;
  failedWebhookEvents: number;
}

type Props = {
  stats: PlatformStats;
  onRefresh: () => void;
  isRefreshing: boolean;
};

interface Widget {
  id: string;
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  shadowColor: string;
}

const DEFAULT_WIDGET_ORDER = ["users", "connections", "webhooks", "failed_webhooks"];

export default function DashboardGrid({ stats, onRefresh, isRefreshing }: Props) {
  const [order, setOrder] = useState<string[]>(DEFAULT_WIDGET_ORDER);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // Load layout order from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin_dashboard_widget_order");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === DEFAULT_WIDGET_ORDER.length) {
          setOrder(parsed);
        }
      } catch (e) {
        // Fallback
      }
    }
  }, []);

  const saveOrder = (newOrder: string[]) => {
    setOrder(newOrder);
    localStorage.setItem("admin_dashboard_widget_order", JSON.stringify(newOrder));
  };

  const resetLayout = () => {
    saveOrder(DEFAULT_WIDGET_ORDER);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedId === null || draggedId === id) return;

    const dragIdx = order.indexOf(draggedId);
    const hoverIdx = order.indexOf(id);

    const updated = [...order];
    updated.splice(dragIdx, 1);
    updated.splice(hoverIdx, 0, draggedId);
    setOrder(updated);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    saveOrder(order);
  };

  // Define widgets details
  const widgetsData: Record<string, Widget> = {
    users: {
      id: "users",
      title: "Registered Users",
      value: stats.totalUsers,
      description: "Total user records registered in system",
      icon: <Users className="h-6 w-6 text-indigo-400" />,
      gradient: "from-indigo-500/20 via-indigo-500/10 to-transparent",
      shadowColor: "shadow-indigo-500/5",
    },
    connections: {
      id: "connections",
      title: "Active Connections",
      value: stats.activeIgAccounts,
      description: "Connected Instagram Business accounts",
      icon: <Workflow className="h-6 w-6 text-pink-400" />,
      gradient: "from-pink-500/20 via-pink-500/10 to-transparent",
      shadowColor: "shadow-pink-500/5",
    },
    webhooks: {
      id: "webhooks",
      title: "Webhook Events",
      value: stats.totalWebhookEvents,
      description: "Total inbound / outbound webhook entries",
      icon: <Activity className="h-6 w-6 text-emerald-400" />,
      gradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
      shadowColor: "shadow-emerald-500/5",
    },
    failed_webhooks: {
      id: "failed_webhooks",
      title: "Failed Webhooks",
      value: stats.failedWebhookEvents,
      description: "Webhook delivery events that failed execution",
      icon: <ShieldAlert className="h-6 w-6 text-red-400" />,
      gradient: "from-red-500/20 via-red-500/10 to-transparent",
      shadowColor: "shadow-red-500/5",
    },
  };

  return (
    <div className="flex flex-col gap-y-6">
      {/* Header Utilities */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          Drag and drop widgets by their handles to rearrange your dashboard view.
        </p>
        <div className="flex gap-x-3">
          <button
            onClick={resetLayout}
            className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            Reset Layout
          </button>
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-x-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-xs text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
            Refresh Stats
          </button>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {order.map((widgetId) => {
          const widget = widgetsData[widgetId];
          if (!widget) return null;
          const isDragging = draggedId === widget.id;

          return (
            <div
              key={widget.id}
              draggable
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDragEnd={handleDragEnd}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/30 cursor-default",
                widget.shadowColor,
                isDragging && "opacity-45 border-dashed border-primary/50 scale-95 duration-75"
              )}
            >
              {/* Drag Handle Overlay */}
              <div 
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-accent"
                title="Drag to reposition"
              >
                <Move className="h-4 w-4 text-muted-foreground" />
              </div>

              {/* Gradient glow background */}
              <div className={cn("absolute inset-0 -z-10 bg-gradient-to-br transition-all duration-500", widget.gradient)} />

              <div className="flex flex-col gap-y-4">
                <div className="p-3 bg-background/50 border border-border w-fit rounded-xl">
                  {widget.icon}
                </div>

                <div>
                  <h3 className="text-muted-foreground text-sm font-medium">
                    {widget.title}
                  </h3>
                  <p className="text-4xl font-bold text-foreground tracking-tight mt-1">
                    {widget.value.toLocaleString()}
                  </p>
                </div>

                <p className="text-muted-foreground text-xs leading-relaxed">
                  {widget.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
