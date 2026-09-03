import { CanActivate, ExecutionContext, HttpStatus, Injectable, SetMetadata } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Reflector } from "@nestjs/core";
import { ProblemException } from "./problem-details";

export type EnterpriseFeatureFlag =
  | "FEATURE_LEAD_V2"
  | "FEATURE_FLOW_CUTOVER"
  | "FEATURE_GOOGLE_OAUTH"
  | "FEATURE_GOOGLE_CALENDAR"
  | "FEATURE_GOOGLE_SHEETS"
  | "FEATURE_AUTONOMOUS_AI";

const FEATURE_FLAG_KEY = "enterprise_feature_flag";

export const FeatureFlag = (flag: EnterpriseFeatureFlag) => SetMetadata(FEATURE_FLAG_KEY, flag);

/** Fail-closed rollout gate for independently deployable enterprise slices. */
@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const flag = this.reflector.getAllAndOverride<EnterpriseFeatureFlag>(FEATURE_FLAG_KEY, [context.getHandler(), context.getClass()]);
    if (!flag || this.config.get<boolean>(flag) === true) return true;
    throw new ProblemException(HttpStatus.SERVICE_UNAVAILABLE, "FEATURE_DISABLED", "Feature unavailable", "This feature is not enabled for the current deployment");
  }
}
