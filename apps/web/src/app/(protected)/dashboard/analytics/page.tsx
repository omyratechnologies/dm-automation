import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "./_components/analytics-dashboard";

const AnalyticsPage = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="flex flex-col gap-y-6 pb-10">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-primary via-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-slate-text-secondary">
            Track your automation performance and engagement metrics
          </p>
        </div>
      </div>

      {/* Analytics Content */}
      <AnalyticsDashboard />
    </div>
  );
};

export default AnalyticsPage;
