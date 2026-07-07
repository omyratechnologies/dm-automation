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
      <div className="p-4">
        <Sidebar />
        <div
          className="
      lg:ml-[280px] 
      lg:pl-12 
      lg:py-6 
      flex 
      flex-col 
      overflow-auto
      "
        >
          <InfoBar />
          {children}
        </div>
      </div>
      </WorkspaceProvider>
    </HydrationBoundary>
  );
}

export default layout;
