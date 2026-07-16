import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import AnalyticsDashboard from "./_components/analytics-dashboard";
import PageHeader from "@/components/global/page-header";
import { BarChart3 } from "lucide-react";

const AnalyticsPage = async () => {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="flex flex-col pb-10">
      <PageHeader
        title="Analytics"
        description="Track automation performance and engagement metrics."
        icon={<BarChart3 className="h-5 w-5" />}
      />
      <AnalyticsDashboard />
    </div>
  );
};

export default AnalyticsPage;
