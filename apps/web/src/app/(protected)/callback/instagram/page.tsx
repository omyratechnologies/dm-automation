import { onIntegrate } from "@/actions/integrations";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

type Props = {
  searchParams: {
    code?: string;
    error?: string;
    error_reason?: string;
    error_description?: string;
  };
};

const Page = async ({ searchParams }: Props) => {
  console.log("🔵 Instagram callback page loaded");
  console.log("📋 Search params:", searchParams);
  
  // Check for OAuth errors
  if (searchParams.error) {
    console.error("❌ OAuth Error:", {
      error: searchParams.error,
      reason: searchParams.error_reason,
      description: searchParams.error_description,
    });
    redirect(`/dashboard/connections?error=${searchParams.error}`);
  }
  
  // Check for authorization code
  const code = searchParams.code;
  
  if (code) {
    console.log("📥 Instagram OAuth callback received code:", code.substring(0, 20) + "...");
    
    try {
      const cleanCode = code.split("#_")[0];
      console.log("🔄 Calling onIntegrate with cleaned code");
      
      const result = await onIntegrate(cleanCode);
      
      console.log("📤 Integration result:", result);
      
      if (result.status === 200) {
        console.log("✅ Integration successful! Redirecting to connections page");
        redirect("/dashboard/connections?success=true");
      }
      
      if (result.status === 404) {
        console.error("❌ User already has integration or not found");
        redirect("/dashboard/connections?error=already_connected");
      }
      
      if (result.status === 401) {
        console.error("❌ No access token received");
        redirect("/dashboard/connections?error=no_token");
      }
      
      console.error("❌ Integration failed with status:", result.status, "Error:", result.error);
      const errorMsg = encodeURIComponent(result.error || "integration_failed");
      redirect(`/dashboard/connections?error=integration_failed&details=${errorMsg}`);
      
    } catch (error: any) {
      // Re-throw redirect errors - they're expected Next.js behavior
      if (isRedirectError(error)) {
        throw error;
      }
      
      console.error("❌ Exception during integration:", error);
      const errorMsg = encodeURIComponent(error.message || "Unknown error");
      redirect(`/dashboard/connections?error=exception&details=${errorMsg}`);
    }
  }
  
  console.error("❌ No code received in callback");
  redirect("/dashboard/connections?error=no_code");
};

export default Page;
