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

type Props = {
  children: React.ReactNode;
};

async function layout({ children }: Props) {
  await onBoardUser();

  const query = new QueryClient();

  await prefetchUserProfile(query);
  await prefetchUserAutomations(query);

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <WorkspaceProvider>
        <div className="min-h-screen bg-background">
          <Sidebar />
          <div className="lg:pl-[240px] flex flex-col min-h-screen">
            <div className="flex-1 flex flex-col px-4 py-4 lg:px-8 lg:py-6 max-w-[1600px]">
              <InfoBar />
              <main className="flex-1">{children}</main>
            </div>
          </div>
        </div>
      </WorkspaceProvider>
    </HydrationBoundary>
  );
}

export default layout;
