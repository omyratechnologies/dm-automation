import { INTEGRATION_CARDS } from "@/constants/integrations";
import React from "react";
import IntegrationCard from "./_components/integration-card";
type Props = {};

function page({}: Props) {
  return (
    <div className="flex justify-center pb-10">
      <div className="flex flex-col w-full lg:w-10/12 xl:w-8/12 gap-y-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">Connections</h1>
          <p className="text-muted-foreground">Connect your social media accounts to start automating</p>
        </div>
        {INTEGRATION_CARDS.map((card, key) => (
          <IntegrationCard key={key} {...card} />
        ))}
      </div>
    </div>
  );
}

export default page;
