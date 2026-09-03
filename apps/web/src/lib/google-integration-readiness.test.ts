import assert from "node:assert/strict";
import test from "node:test";
import { googleAvailabilityBadge, googleAvailabilityCopy } from "./google-integration-readiness.ts";

test("Google readiness keeps connect unavailable while configuration is missing", () => {
  const availability = { available: false, status: "ADMIN_SETUP_REQUIRED" as const };
  assert.equal(googleAvailabilityBadge(availability), "Setup required");
  assert.match(googleAvailabilityCopy(availability) ?? "", /Configure the Google OAuth client/);
});

test("Google readiness distinguishes loading, failure, disabled and available states", () => {
  assert.equal(googleAvailabilityBadge(), "Checking");
  assert.match(googleAvailabilityCopy() ?? "", /Checking provider/);
  assert.equal(googleAvailabilityBadge(undefined, true), "Unavailable");
  assert.match(googleAvailabilityCopy(undefined, true) ?? "", /could not be verified/);
  assert.match(googleAvailabilityCopy({ available: false, status: "FEATURE_DISABLED" }) ?? "", /not enabled/);
  assert.equal(googleAvailabilityCopy({ available: true, status: "AVAILABLE" }), null);
});
