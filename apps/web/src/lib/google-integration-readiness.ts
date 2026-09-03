import type { GoogleIntegrationReadiness } from "@repo/shared";

export type GoogleAvailability = GoogleIntegrationReadiness["calendar"];

export function googleAvailabilityCopy(availability?: GoogleAvailability, failed = false): string | null {
  if (failed) return "Provider availability could not be verified. Try again shortly.";
  if (!availability) return "Checking provider availability…";
  if (availability.status === "ADMIN_SETUP_REQUIRED") return "Deployment setup required. Configure the Google OAuth client before connecting an account.";
  if (availability.status === "FEATURE_DISABLED") return "This integration is not enabled for this deployment.";
  return null;
}

export function googleAvailabilityBadge(availability?: GoogleAvailability, failed = false): string {
  if (failed) return "Unavailable";
  if (!availability) return "Checking";
  return availability.available ? "Not connected" : "Setup required";
}
