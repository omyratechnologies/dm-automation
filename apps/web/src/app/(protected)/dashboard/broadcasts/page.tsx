import React from "react";
import BroadcastsView from "./_components/broadcasts-view";
import PageHeader from "@/components/global/page-header";
import { Megaphone } from "lucide-react";

const BroadcastsPage = () => {
  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Broadcasts"
        description="Send one-off messages to segments of contacts inside the 24-hour window."
        icon={<Megaphone className="h-5 w-5" />}
      />
      <BroadcastsView />
    </div>
  );
};

export default BroadcastsPage;
