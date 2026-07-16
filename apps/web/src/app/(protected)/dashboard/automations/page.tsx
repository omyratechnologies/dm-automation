import AutomationList from "@/components/global/automation-list";
import CreateAutomation from "@/components/global/create-automation";
import PageHeader from "@/components/global/page-header";
import { Check, Zap } from "lucide-react";
import React from "react";

const Page = () => {
  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Automations"
        description="Create and manage automated reply rules for comments and DMs."
        icon={<Zap className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-6 gap-5">
        <div className="lg:col-span-4">
          <AutomationList />
        </div>
        <div className="lg:col-span-2">
          <div className="flex flex-col rounded-xl border border-border bg-card gap-y-5 p-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">
                Active rules
              </h2>
              <p className="text-xs text-muted-foreground">
                Your live automations will show here.
              </p>
            </div>
            <div className="flex flex-col gap-y-2">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="flex items-start justify-between p-3 rounded-lg bg-muted border border-border"
                >
                  <div className="flex flex-col min-w-0">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      Direct traffic towards website
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      October 5th 2024
                    </p>
                  </div>
                  <Check className="w-4 h-4 text-success shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
            <CreateAutomation />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
