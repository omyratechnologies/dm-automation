import React from "react";
import TeamView from "./_components/team-view";

const TeamPage = () => {
  return (
    <div className="flex flex-col gap-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Team & billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage who has access to this workspace and your subscription.
        </p>
      </div>
      <TeamView />
    </div>
  );
};

export default TeamPage;
