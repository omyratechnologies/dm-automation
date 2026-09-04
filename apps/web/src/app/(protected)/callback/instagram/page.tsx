import { onIntegrate } from "@/actions/integrations";
import { logger } from "@/lib/logger";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";

type Props = {
  searchParams: Promise<{
    code?: string;
    error?: string;
    error_reason?: string;
    error_description?: string;
    state?: string;
  }>;
};

const Page = async ({ searchParams }: Props) => {
  const resolvedSearchParams = await searchParams;
  // Check for OAuth errors
  if (resolvedSearchParams.error) {
    logger.warn("Instagram OAuth callback returned an error", {
      error: resolvedSearchParams.error,
      reason: resolvedSearchParams.error_reason,
    });
    redirect(`/dashboard/integrations?error=${resolvedSearchParams.error}`);
  }
  
  // Check for authorization code
  const code = resolvedSearchParams.code;
  
  if (code && resolvedSearchParams.state) {
    logger.info("Instagram OAuth callback received an authorization code");
    try {
      const cleanCode = code.split("#_")[0];
      const result = await onIntegrate(cleanCode, resolvedSearchParams.state);

      if (result.status === 200) {
        logger.info("Instagram integration completed successfully");
        redirect("/dashboard/integrations?success=true");
      }
      
      if (result.status === 404) {
        logger.warn("Instagram integration was not found or is already connected");
        redirect("/dashboard/integrations?error=already_connected");
      }
      
      if (result.status === 401) {
        logger.warn("Instagram integration did not return an access token");
        redirect("/dashboard/integrations?error=no_token");
      }
      
      logger.error("Instagram integration failed", {
        status: result.status,
        error: result.error,
      });
      const errorMsg = encodeURIComponent(result.error || "integration_failed");
      redirect(`/dashboard/integrations?error=integration_failed&details=${errorMsg}`);
      
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
      redirect(`/dashboard/integrations?error=exception&details=${errorMsg}`);
    }
  }
  
  logger.warn("Instagram OAuth callback omitted its code or state");
  redirect("/dashboard/integrations?error=invalid_callback");
};

export default Page;
