import React from "react";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPlatformStats } from "@/actions/admin";
import AdminDashboardClient from "./_components/admin-dashboard-client";

export default async function AdminPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // Server prefetch stats
  const result = await getPlatformStats();
  const initialStats = result.status === 200 ? result.data : {
    totalUsers: 0,
    activeIgAccounts: 0,
    totalWebhookEvents: 0,
    failedWebhookEvents: 0,
  };

  return (
    <div className="flex flex-col gap-y-6 pb-10">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-border p-8">
        <div className="relative z-10">
          <p className="text-muted-foreground text-sm font-medium mb-2">Back-office Control Center</p>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent mb-3 animate-fade-in">
            Platform Telemetry
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Monitor real-time platform statistics, registered profiles, webhook delivery events, and system queues.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-3xl" />
      </div>

      {/* Draggable Grid Client Component */}
      <AdminDashboardClient initialStats={initialStats} />
    </div>
  );
}
