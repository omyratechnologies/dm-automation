import React from "react";
import InboxView from "./_components/inbox-view";

const InboxPage = () => {
  return (
    <div className="flex flex-col gap-y-4 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Reply to your Instagram conversations in real time.
        </p>
      </div>
      <InboxView />
    </div>
  );
};

export default InboxPage;
