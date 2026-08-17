import InfoBar from "@/components/global/InfoBar";
import Sidebar from "@/components/global/sidebar";
import { WorkspaceProvider } from "@/providers/workspace-provider";
import React from "react";
import {
  QueryClient,
  dehydrate,
  HydrationBoundary,
} from "@tanstack/react-query";
import {
  prefetchUserProfile,
  prefetchUserAutomations,
} from "@/react-query/prefetch";
import { onBoardUser } from "@/actions/user";
import DashboardShell from "@/components/global/dashboard-shell";
import { withinBudget } from "@/lib/ssr";

type Props = {
  children: React.ReactNode;
};

async function layout({ children }: Props) {
  const query = new QueryClient();

  await Promise.allSettled([
    withinBudget(onBoardUser()),
    withinBudget(prefetchUserProfile(query)),
    withinBudget(prefetchUserAutomations(query)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <WorkspaceProvider>
        <DashboardShell sidebar={<Sidebar />} header={<InfoBar />}>
          {children}
        </DashboardShell>
      </WorkspaceProvider>
    </HydrationBoundary>
  );
}

export default layout;
