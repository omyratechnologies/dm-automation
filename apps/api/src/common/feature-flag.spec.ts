import { HttpStatus } from "@nestjs/common";
import { FeatureFlagGuard } from "./feature-flag";
import { ProblemException } from "./problem-details";

describe("FeatureFlagGuard", () => {
  const context = { getHandler: () => "handler", getClass: () => "class" } as never;

  it("fails closed when a declared enterprise feature is disabled", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue("FEATURE_GOOGLE_SHEETS") };
    const guard = new FeatureFlagGuard(reflector as never, { get: jest.fn().mockReturnValue(false) } as never);
    try {
      guard.canActivate(context);
      throw new Error("expected guard to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(ProblemException);
      expect((error as ProblemException).getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    }
  });

  it("allows enabled and unflagged routes", () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue("FEATURE_GOOGLE_CALENDAR") };
    expect(new FeatureFlagGuard(reflector as never, { get: jest.fn().mockReturnValue(true) } as never).canActivate(context)).toBe(true);
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(new FeatureFlagGuard(reflector as never, { get: jest.fn() } as never).canActivate(context)).toBe(true);
  });
});
