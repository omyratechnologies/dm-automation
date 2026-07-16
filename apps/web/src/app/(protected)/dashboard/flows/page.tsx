import React from "react";
import FlowsList from "./_components/flows-list";
import PageHeader from "@/components/global/page-header";
import { Workflow } from "lucide-react";

const FlowsPage = () => {
  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Flows"
        description="Build automated conversation flows triggered by keywords, comments and story replies."
        icon={<Workflow className="h-5 w-5" />}
      />
      <FlowsList />
    </div>
  );
};

export default FlowsPage;
