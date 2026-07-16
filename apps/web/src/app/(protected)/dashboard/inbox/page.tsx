import React from "react";
import InboxView from "./_components/inbox-view";
import PageHeader from "@/components/global/page-header";
import { Inbox } from "lucide-react";

const InboxPage = () => {
  return (
    <div className="flex flex-col pb-4">
      <PageHeader
        title="Inbox"
        description="Reply to your Instagram conversations in real time."
        icon={<Inbox className="h-5 w-5" />}
        className="mb-4"
      />
      <InboxView />
    </div>
  );
};

export default InboxPage;
