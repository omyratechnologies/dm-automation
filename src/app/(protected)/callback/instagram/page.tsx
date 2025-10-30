import { onIntegrate } from "@/actions/integrations";
import { redirect } from "next/navigation";

type Props = {
  searchParams: {
    code: string;
  };
};

const Page = async ({ searchParams: { code } }: Props) => {
  if (code) {
    console.log("📥 Instagram OAuth callback received code:", code);
    const user = await onIntegrate(code.split("#_")[0]);
    if (user.status === 200) {
      console.log("✅ Integration successful, redirecting to connections page");
      return redirect("/dashboard/connections");
    }
    console.error("❌ Integration failed with status:", user.status);
  }
  console.error("❌ No code received, redirecting to sign-up");
  return redirect("/sign-up");
};

export default Page;
