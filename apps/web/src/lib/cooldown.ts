import { redis } from "./redis";
import { cacheKey, CACHE_KEYS } from "./cache";

/**
 * Cooldown periods in seconds
 */
export const COOLDOWN_PERIODS = {
  DM_SAME_USER: 60, // 1 minute between DMs to same user
  COMMENT_SAME_POST: 60, // 1 minute between comments on same post
  AUTOMATION_SAME_KEYWORD: 30, // 30 seconds between same keyword triggers
  SMARTAI_SAME_CONVERSATION: 10, // 10 seconds between AI responses in same conversation
  GLOBAL_AUTOMATION: 5, // 5 seconds global cooldown per automation
} as const;

/**
 * Cooldown result type
 */
export interface CooldownResult {
  allowed: boolean;
  remainingTime?: number; // seconds remaining if not allowed
  cooldownPeriod: number; // total cooldown period
  message?: string;
}

/**
 * Generate cooldown key
 */
function cooldownKey(type: string, ...identifiers: string[]): string {
  return cacheKey(CACHE_KEYS.COOLDOWN, type, ...identifiers);
}

/**
 * Check if action is allowed (not in cooldown)
 * Returns cooldown status and remaining time
 */
export async function checkCooldown(
  key: string,
  cooldownPeriod: number
): Promise<CooldownResult> {
  // If Redis not configured, allow all actions
  if (!redis) {
    return {
      allowed: true,
      cooldownPeriod,
    };
  }

  try {
    // Check if key exists
    const ttl = await redis.ttl(key);

    if (ttl === -2) {
      // Key doesn't exist, action is allowed
      return {
        allowed: true,
        cooldownPeriod,
      };
    }

    if (ttl > 0) {
      // Key exists, still in cooldown
      return {
        allowed: false,
        remainingTime: ttl,
        cooldownPeriod,
        message: `Action is in cooldown. Please wait ${ttl} seconds.`,
      };
    }

    // TTL is -1 (no expiry) or 0 (expired), allow action
    return {
      allowed: true,
      cooldownPeriod,
    };
  } catch (error) {
    console.error(`❌ Cooldown check error for ${key}:`, error);
    // On error, allow the action (fail open)
    return {
      allowed: true,
      cooldownPeriod,
    };
  }
}

/**
 * Set cooldown for a specific action
 */
export async function setCooldown(
  key: string,
  cooldownPeriod: number
): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    await redis.set(key, "1", { ex: cooldownPeriod });
    console.log(`⏱️ Cooldown SET: ${key} (${cooldownPeriod}s)`);
    return true;
  } catch (error) {
    console.error(`❌ Cooldown set error for ${key}:`, error);
    return false;
  }
}

/**
 * Check and set cooldown in one operation (atomic)
 */
export async function checkAndSetCooldown(
  key: string,
  cooldownPeriod: number
): Promise<CooldownResult> {
  const result = await checkCooldown(key, cooldownPeriod);

  if (result.allowed) {
    await setCooldown(key, cooldownPeriod);
  }

  return result;
}

/**
 * Clear cooldown manually
 */
export async function clearCooldown(key: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    await redis.del(key);
    console.log(`🗑️ Cooldown cleared: ${key}`);
    return true;
  } catch (error) {
    console.error(`❌ Cooldown clear error for ${key}:`, error);
    return false;
  }
}

/**
 * Check DM cooldown for specific user
 */
export async function checkDMCooldown(
  automationId: string,
  senderId: string,
  receiverId: string
): Promise<CooldownResult> {
  const key = cooldownKey("dm", automationId, senderId, receiverId);
  return checkCooldown(key, COOLDOWN_PERIODS.DM_SAME_USER);
}

/**
 * Set DM cooldown
 */
export async function setDMCooldown(
  automationId: string,
  senderId: string,
  receiverId: string
): Promise<boolean> {
  const key = cooldownKey("dm", automationId, senderId, receiverId);
  return setCooldown(key, COOLDOWN_PERIODS.DM_SAME_USER);
}

/**
 * Check comment cooldown for specific post
 */
export async function checkCommentCooldown(
  automationId: string,
  postId: string,
  commenterId: string
): Promise<CooldownResult> {
  const key = cooldownKey("comment", automationId, postId, commenterId);
  return checkCooldown(key, COOLDOWN_PERIODS.COMMENT_SAME_POST);
}

/**
 * Set comment cooldown
 */
export async function setCommentCooldown(
  automationId: string,
  postId: string,
  commenterId: string
): Promise<boolean> {
  const key = cooldownKey("comment", automationId, postId, commenterId);
  return setCooldown(key, COOLDOWN_PERIODS.COMMENT_SAME_POST);
}

/**
 * Check keyword trigger cooldown
 */
export async function checkKeywordCooldown(
  automationId: string,
  keyword: string,
  userId: string
): Promise<CooldownResult> {
  const key = cooldownKey("keyword", automationId, keyword, userId);
  return checkCooldown(key, COOLDOWN_PERIODS.AUTOMATION_SAME_KEYWORD);
}

/**
 * Set keyword trigger cooldown
 */
export async function setKeywordCooldown(
  automationId: string,
  keyword: string,
  userId: string
): Promise<boolean> {
  const key = cooldownKey("keyword", automationId, keyword, userId);
  return setCooldown(key, COOLDOWN_PERIODS.AUTOMATION_SAME_KEYWORD);
}

/**
 * Check SMARTAI conversation cooldown
 */
export async function checkSmartAICooldown(
  automationId: string,
  conversationId: string
): Promise<CooldownResult> {
  const key = cooldownKey("smartai", automationId, conversationId);
  return checkCooldown(key, COOLDOWN_PERIODS.SMARTAI_SAME_CONVERSATION);
}

/**
 * Set SMARTAI conversation cooldown
 */
export async function setSmartAICooldown(
  automationId: string,
  conversationId: string
): Promise<boolean> {
  const key = cooldownKey("smartai", automationId, conversationId);
  return setCooldown(key, COOLDOWN_PERIODS.SMARTAI_SAME_CONVERSATION);
}

/**
 * Check global automation cooldown
 */
export async function checkAutomationCooldown(
  automationId: string
): Promise<CooldownResult> {
  const key = cooldownKey("automation", automationId);
  return checkCooldown(key, COOLDOWN_PERIODS.GLOBAL_AUTOMATION);
}

/**
 * Set global automation cooldown
 */
export async function setAutomationCooldown(
  automationId: string
): Promise<boolean> {
  const key = cooldownKey("automation", automationId);
  return setCooldown(key, COOLDOWN_PERIODS.GLOBAL_AUTOMATION);
}

/**
 * Check multiple cooldowns at once
 * Returns true only if ALL cooldowns allow the action
 */
export async function checkMultipleCooldowns(
  cooldowns: Array<{ key: string; period: number }>
): Promise<CooldownResult> {
  const results = await Promise.all(
    cooldowns.map(({ key, period }) => checkCooldown(key, period))
  );

  // Find the first cooldown that doesn't allow the action
  const blocked = results.find((r) => !r.allowed);

  if (blocked) {
    return blocked;
  }

  // All cooldowns passed
  return {
    allowed: true,
    cooldownPeriod: Math.max(...cooldowns.map((c) => c.period)),
  };
}

/**
 * Set multiple cooldowns at once
 */
export async function setMultipleCooldowns(
  cooldowns: Array<{ key: string; period: number }>
): Promise<boolean[]> {
  return Promise.all(
    cooldowns.map(({ key, period }) => setCooldown(key, period))
  );
}

/**
 * Clear all cooldowns for a specific automation
 */
export async function clearAutomationCooldowns(
  automationId: string
): Promise<number> {
  if (!redis) {
    return 0;
  }

  try {
    const pattern = cooldownKey("*", automationId, "*");
    const keys = await redis.keys(pattern);

    if (keys.length === 0) {
      return 0;
    }

    await redis.del(...keys);
    console.log(
      `🗑️ Cleared ${keys.length} cooldowns for automation: ${automationId}`
    );
    return keys.length;
  } catch (error) {
    console.error(
      `❌ Error clearing cooldowns for automation ${automationId}:`,
      error
    );
    return 0;
  }
}

/**
 * Get cooldown statistics
 */
export async function getCooldownStats(): Promise<{
  totalCooldowns: number;
  byType: Record<string, number>;
}> {
  if (!redis) {
    return { totalCooldowns: 0, byType: {} };
  }

  try {
    const pattern = cacheKey(CACHE_KEYS.COOLDOWN, "*");
    const keys = await redis.keys(pattern);

    const byType: Record<string, number> = {};

    for (const key of keys) {
      // Extract type from key (format: cooldown:type:...)
      const parts = key.split(":");
      const type = parts[1] || "unknown";
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      totalCooldowns: keys.length,
      byType,
    };
  } catch (error) {
    console.error(`❌ Error getting cooldown stats:`, error);
    return { totalCooldowns: 0, byType: {} };
  }
}

/**
 * Helper: Check and set DM cooldown in one call
 */
export async function enforceDMCooldown(
  automationId: string,
  senderId: string,
  receiverId: string
): Promise<CooldownResult> {
  const key = cooldownKey("dm", automationId, senderId, receiverId);
  return checkAndSetCooldown(key, COOLDOWN_PERIODS.DM_SAME_USER);
}

/**
 * Helper: Check and set comment cooldown in one call
 */
export async function enforceCommentCooldown(
  automationId: string,
  postId: string,
  commenterId: string
): Promise<CooldownResult> {
  const key = cooldownKey("comment", automationId, postId, commenterId);
  return checkAndSetCooldown(key, COOLDOWN_PERIODS.COMMENT_SAME_POST);
}

/**
 * Helper: Check and set SMARTAI cooldown in one call
 */
export async function enforceSmartAICooldown(
  automationId: string,
  conversationId: string
): Promise<CooldownResult> {
  const key = cooldownKey("smartai", automationId, conversationId);
  return checkAndSetCooldown(key, COOLDOWN_PERIODS.SMARTAI_SAME_CONVERSATION);
}
