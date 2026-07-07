import React from "react";
import FlowsList from "./_components/flows-list";

const FlowsPage = () => {
  return (
    <div className="flex flex-col gap-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Flows</h1>
        <p className="text-sm text-muted-foreground">
          Build automated conversation flows triggered by keywords, comments and
          story replies.
        </p>
      </div>
      <FlowsList />
    </div>
  );
};

export default FlowsPage;
