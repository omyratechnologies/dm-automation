import { getAutomationInfo } from "@/actions/automations";
import PostNode from "@/components/global/automations/post/node";
import ThenNode from "@/components/global/automations/then/node";
import Trigger from "@/components/global/automations/trigger";
import AutomationsBreadCrumb from "@/components/global/bread-crumbs/automations";
import { Warning } from "@/icons";
import { prefetchUserAutomation } from "@/react-query/prefetch";
import { withinBudget, SSR_METADATA_BUDGET_MS } from "@/lib/ssr";

import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";

import React from "react";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const info = await withinBudget(getAutomationInfo(id), SSR_METADATA_BUDGET_MS);
  return {
    title: info?.status === 200 ? info.data.name : undefined,
  };
}

const Page = async ({ params }: Props) => {
  const { id } = await params;
  const query = new QueryClient();
  await withinBudget(prefetchUserAutomation(query, id));

  return (
    <HydrationBoundary state={dehydrate(query)}>
      <div className=" flex flex-col items-center gap-y-20">
        <AutomationsBreadCrumb id={id} />
        <div className="w-full lg:w-10/12 xl:w-6/12 p-5 rounded-xl flex flex-col bg-card dark:bg-[#1D1D1D] border border-border gap-y-3">
          <div className="flex gap-x-2">
            <Warning />
            When...
          </div>
          <Trigger id={id} />
        </div>
        <ThenNode id={id} />
        <PostNode id={id} />
      </div>
    </HydrationBoundary>
  );
};

export default Page;
