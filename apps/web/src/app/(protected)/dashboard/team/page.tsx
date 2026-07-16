import React from "react";
import TeamView from "./_components/team-view";
import PageHeader from "@/components/global/page-header";
import { UsersRound } from "lucide-react";

const TeamPage = () => {
  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Team & billing"
        description="Manage who has access to this workspace and your subscription."
        icon={<UsersRound className="h-5 w-5" />}
      />
      <TeamView />
    </div>
  );
};

export default TeamPage;
