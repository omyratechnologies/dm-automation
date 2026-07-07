import AutomationList from "@/components/global/automation-list";
import CreateAutomation from "@/components/global/create-automation";
import { Check } from "lucide-react";
import React from "react";

type Props = {};

const Page = (props: Props) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-6">
      <div className="lg:col-span-4">
        <AutomationList />
      </div>
      <div className="lg:col-span-2">
        <div className="flex flex-col rounded-2xl bg-card backdrop-blur-sm gap-y-6 p-6 border border-border overflow-hidden hover:border-primary/40 transition-colors duration-300">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Automations</h2>
            <p className="text-muted-foreground text-sm">
              Your live automations will show here.
            </p>
          </div>
          <div className="flex flex-col gap-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start justify-between p-4 rounded-xl bg-muted border border-border hover:border-primary/40 transition-colors">
                <div className="flex flex-col">
                  <h3 className="font-semibold text-foreground mb-1">
                    Direct traffic towards website
                  </h3>
                  <p className="text-muted-foreground text-xs">
                    October 5th 2024
                  </p>
                </div>
                <Check className="w-5 h-5 text-green-500" />
              </div>
            ))}
          </div>
          <CreateAutomation />
        </div>
      </div>
    </div>
  );
};

export default Page;
