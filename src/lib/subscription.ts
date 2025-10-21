/**
 * Subscription plan type (matches Prisma schema)
 */
export type SUBSCRIPTION_PLAN = "PRO" | "FREE";

/**
 * Feature flags based on subscription plan
 */
export const SUBSCRIPTION_FEATURES = {
  FREE: {
    maxAutomations: 3,
    maxKeywordsPerAutomation: 5,
    maxDMsPerMonth: 100,
    maxCommentsPerMonth: 100,
    smartAI: false,
    analytics: false,
    advancedTriggers: false,
  },
  PRO: {
    maxAutomations: Infinity,
    maxKeywordsPerAutomation: Infinity,
    maxDMsPerMonth: Infinity,
    maxCommentsPerMonth: Infinity,
    smartAI: true,
    analytics: true,
    advancedTriggers: true,
  },
} as const;

/**
 * Subscription plan type
 */
export type SubscriptionPlan = keyof typeof SUBSCRIPTION_FEATURES;

/**
 * Validate if user has access to a specific feature
 */
export function hasFeatureAccess(
  userPlan: SUBSCRIPTION_PLAN | undefined | null,
  feature: keyof (typeof SUBSCRIPTION_FEATURES)["FREE"]
): boolean {
  const plan = (userPlan || "FREE") as SubscriptionPlan;
  const features = SUBSCRIPTION_FEATURES[plan];
  
  if (typeof features[feature] === "boolean") {
    return features[feature] as boolean;
  }
  
  return true; // For numeric limits, we check separately
}

/**
 * Check if user has SMARTAI feature access
 */
export function canUseSmartAI(
  userPlan: SUBSCRIPTION_PLAN | undefined | null
): boolean {
  return userPlan === "PRO";
}

/**
 * Check if user has analytics access
 */
export function canUseAnalytics(
  userPlan: SUBSCRIPTION_PLAN | undefined | null
): boolean {
  return userPlan === "PRO";
}

/**
 * Get feature limit for a specific plan
 */
export function getFeatureLimit(
  userPlan: SUBSCRIPTION_PLAN | undefined | null,
  feature: keyof (typeof SUBSCRIPTION_FEATURES)["FREE"]
): number {
  const plan = (userPlan || "FREE") as SubscriptionPlan;
  return SUBSCRIPTION_FEATURES[plan][feature] as number;
}

/**
 * Validate if user can create more automations
 */
export function canCreateAutomation(
  userPlan: SUBSCRIPTION_PLAN | undefined | null,
  currentAutomationCount: number
): {
  allowed: boolean;
  limit: number;
  message?: string;
} {
  const limit = getFeatureLimit(userPlan, "maxAutomations");
  const allowed = currentAutomationCount < limit;

  return {
    allowed,
    limit,
    message: allowed
      ? undefined
      : `You've reached the maximum number of automations (${limit}) for your ${
          userPlan || "FREE"
        } plan. Upgrade to PRO for unlimited automations.`,
  };
}

/**
 * Validate if user can add more keywords to automation
 */
export function canAddKeyword(
  userPlan: SUBSCRIPTION_PLAN | undefined | null,
  currentKeywordCount: number
): {
  allowed: boolean;
  limit: number;
  message?: string;
} {
  const limit = getFeatureLimit(userPlan, "maxKeywordsPerAutomation");
  const allowed = currentKeywordCount < limit;

  return {
    allowed,
    limit,
    message: allowed
      ? undefined
      : `You've reached the maximum number of keywords (${limit}) for your ${
          userPlan || "FREE"
        } plan. Upgrade to PRO for unlimited keywords.`,
  };
}

/**
 * Validate if user can send more DMs this month
 */
export function canSendDM(
  userPlan: SUBSCRIPTION_PLAN | undefined | null,
  currentMonthDMCount: number
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  message?: string;
} {
  const limit = getFeatureLimit(userPlan, "maxDMsPerMonth");
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentMonthDMCount);
  const allowed = currentMonthDMCount < limit;

  return {
    allowed,
    limit,
    remaining,
    message: allowed
      ? undefined
      : `You've reached your monthly DM limit (${limit}) for your ${
          userPlan || "FREE"
        } plan. Upgrade to PRO for unlimited DMs.`,
  };
}

/**
 * Validate if user can send more comment replies this month
 */
export function canSendComment(
  userPlan: SUBSCRIPTION_PLAN | undefined | null,
  currentMonthCommentCount: number
): {
  allowed: boolean;
  limit: number;
  remaining: number;
  message?: string;
} {
  const limit = getFeatureLimit(userPlan, "maxCommentsPerMonth");
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - currentMonthCommentCount);
  const allowed = currentMonthCommentCount < limit;

  return {
    allowed,
    limit,
    remaining,
    message: allowed
      ? undefined
      : `You've reached your monthly comment reply limit (${limit}) for your ${
          userPlan || "FREE"
        } plan. Upgrade to PRO for unlimited replies.`,
  };
}

/**
 * Subscription validation result type
 */
export interface SubscriptionValidation {
  isValid: boolean;
  plan: SUBSCRIPTION_PLAN;
  message?: string;
  requiredPlan?: SUBSCRIPTION_PLAN;
}

/**
 * Validate if user's subscription allows using SMARTAI listener
 */
export function validateSmartAIAccess(
  userPlan: SUBSCRIPTION_PLAN | undefined | null
): SubscriptionValidation {
  const plan = userPlan || "FREE";
  const isValid = canUseSmartAI(userPlan);

  return {
    isValid,
    plan,
    message: isValid
      ? undefined
      : "SMARTAI feature is only available for PRO subscribers. Upgrade your plan to use AI-powered responses.",
    requiredPlan: "PRO",
  };
}

/**
 * Validate subscription before processing automation
 * This is the main validation function to use in webhook handler
 */
export function validateAutomationAccess(
  userPlan: SUBSCRIPTION_PLAN | undefined | null,
  listenerType: "MESSAGE" | "SMARTAI" | null | undefined,
  currentMonthDMCount: number = 0,
  currentMonthCommentCount: number = 0,
  isComment: boolean = false
): SubscriptionValidation & {
  dmCheck?: ReturnType<typeof canSendDM>;
  commentCheck?: ReturnType<typeof canSendComment>;
} {
  const plan = userPlan || "FREE";

  // Check if SMARTAI is being used without PRO plan
  if (listenerType === "SMARTAI") {
    const smartAIValidation = validateSmartAIAccess(userPlan);
    if (!smartAIValidation.isValid) {
      return smartAIValidation;
    }
  }

  // Check DM/Comment limits
  const dmCheck = canSendDM(userPlan, currentMonthDMCount);
  const commentCheck = canSendComment(userPlan, currentMonthCommentCount);

  if (isComment && !commentCheck.allowed) {
    return {
      isValid: false,
      plan,
      message: commentCheck.message,
      requiredPlan: "PRO",
      commentCheck,
    };
  }

  if (!isComment && !dmCheck.allowed) {
    return {
      isValid: false,
      plan,
      message: dmCheck.message,
      requiredPlan: "PRO",
      dmCheck,
    };
  }

  // All checks passed
  return {
    isValid: true,
    plan,
    dmCheck,
    commentCheck,
  };
}

/**
 * Log subscription validation failure
 */
export function logSubscriptionViolation(
  validation: SubscriptionValidation,
  userId: string,
  context: string
): void {
  console.warn(
    `🚫 Subscription validation failed for user ${userId} in ${context}:`,
    {
      plan: validation.plan,
      message: validation.message,
      requiredPlan: validation.requiredPlan,
    }
  );
}
