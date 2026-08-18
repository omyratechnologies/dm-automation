import { onIntegrate } from "@/actions/integrations";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect";

type Props = {
  searchParams: {
    code?: string;
    error?: string;
    error_reason?: string;
    error_description?: string;
    state?: string;
  };
};

const Page = async ({ searchParams }: Props) => {
  // Check for OAuth errors
  if (searchParams.error) {
    logger.warn("Instagram OAuth callback returned an error", {
      error: searchParams.error,
      reason: searchParams.error_reason,
    });
    redirect(`/dashboard/connections?error=${searchParams.error}`);
  }
  
  // Check for authorization code
  const code = searchParams.code;
  
  if (code && searchParams.state) {
    logger.info("Instagram OAuth callback received an authorization code");
    try {
      const cleanCode = code.split("#_")[0];
      const result = await onIntegrate(cleanCode, searchParams.state);

      if (result.status === 200) {
        logger.info("Instagram integration completed successfully");
        redirect("/dashboard/connections?success=true");
      }
      
      if (result.status === 404) {
        logger.warn("Instagram integration was not found or is already connected");
        redirect("/dashboard/connections?error=already_connected");
      }
      
      if (result.status === 401) {
        logger.warn("Instagram integration did not return an access token");
        redirect("/dashboard/connections?error=no_token");
      }
      
      logger.error("Instagram integration failed", {
        status: result.status,
        error: result.error,
      });
      const errorMsg = encodeURIComponent(result.error || "integration_failed");
      redirect(`/dashboard/connections?error=integration_failed&details=${errorMsg}`);
      
    } catch (error: unknown) {
      // Re-throw redirect errors - they're expected Next.js behavior
      if (isRedirectError(error)) {
        throw error;
      }
      
      logger.error("Instagram integration callback failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      const errorMsg = encodeURIComponent(
        error instanceof Error ? error.message : "Unknown error",
      );
      redirect(`/dashboard/connections?error=exception&details=${errorMsg}`);
    }
  }
  
  logger.warn("Instagram OAuth callback omitted its code or state");
  redirect("/dashboard/connections?error=invalid_callback");
};

export default Page;
