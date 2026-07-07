import React from "react";
import BroadcastsView from "./_components/broadcasts-view";

const BroadcastsPage = () => {
  return (
    <div className="flex flex-col gap-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Broadcasts</h1>
        <p className="text-sm text-muted-foreground">
          Send one-off messages to segments of contacts inside the 24-hour
          window.
        </p>
      </div>
      <BroadcastsView />
    </div>
  );
};

export default BroadcastsPage;
