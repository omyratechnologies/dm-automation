import AutomationList from "@/components/global/automation-list";
import CreateAutomation from "@/components/global/create-automation";
import PageHeader from "@/components/global/page-header";
import { Check, Zap } from "lucide-react";

const AutomationsPage = () => {
  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Automations"
        description="Create and manage automated reply rules for comments and DMs."
        icon={<Zap className="h-5 w-5" />}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-6">
        <div className="lg:col-span-4">
          <AutomationList />
        </div>
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-y-5 rounded-xl border border-border bg-card p-5">
            <div>
              <h2 className="mb-1 text-sm font-semibold text-foreground">
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
                  className="flex items-start justify-between rounded-lg border border-border bg-muted p-3"
                >
                  <div className="flex min-w-0 flex-col">
                    <h3 className="truncate text-sm font-medium text-foreground">
                      Direct traffic towards website
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      October 5th 2024
                    </p>
                  </div>
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
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

export default AutomationsPage;
