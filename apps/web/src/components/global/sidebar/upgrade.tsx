import React from "react";
import { Button } from "@/components/ui/button";
import Loader from "../loader";

const UpgradeCard = () => {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3 flex flex-col gap-y-2">
      <div>
        <p className="text-xs font-medium text-foreground">
          Upgrade to Pro
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
          Unlimited automations and AI replies
        </p>
      </div>
      <Button size="sm" className="w-full h-8 text-xs">
        <Loader state={false}>Upgrade</Loader>
      </Button>
    </div>
  );
};

export default UpgradeCard;
