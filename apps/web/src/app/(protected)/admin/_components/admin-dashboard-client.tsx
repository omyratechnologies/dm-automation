"use client";

import React, { useState, useTransition } from "react";
import { getPlatformStats } from "@/actions/admin";
import DashboardGrid from "./dashboard-grid";

interface PlatformStats {
  totalUsers: number;
  activeIgAccounts: number;
  totalWebhookEvents: number;
  failedWebhookEvents: number;
}

type Props = {
  initialStats: PlatformStats;
};

export default function AdminDashboardClient({ initialStats }: Props) {
  const [stats, setStats] = useState<PlatformStats>(initialStats);
  const [isPending, startTransition] = useTransition();

  const handleRefresh = () => {
    startTransition(async () => {
      const result = await getPlatformStats();
      if (result.status === 200) {
        setStats(result.data);
      }
    });
  };

  return (
    <DashboardGrid 
      stats={stats} 
      onRefresh={handleRefresh} 
      isRefreshing={isPending} 
    />
  );
}
