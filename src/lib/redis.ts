import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Initialize Upstash Redis client
// If UPSTASH_REDIS_REST_URL is not set, this will be undefined
// and rate limiting will be disabled (useful for development)
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : undefined;

/**
 * Rate limiter for Instagram webhook endpoints
 * Limits: 60 requests per minute per IP
 * This prevents abuse and ensures we don't overwhelm our server
 */
export const webhookRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"), // 60 requests per minute
      analytics: true,
      prefix: "ratelimit:webhook",
    })
  : undefined;

/**
 * Rate limiter for Instagram API calls (outbound)
 * Limits: 200 requests per hour per user
 * Instagram Graph API has rate limits, this prevents hitting them
 */
export const instagramApiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(200, "1 h"), // 200 requests per hour
      analytics: true,
      prefix: "ratelimit:instagram-api",
    })
  : undefined;

/**
 * Rate limiter for OpenAI API calls
 * Limits: 50 requests per minute per automation
 * Prevents excessive OpenAI API usage and costs
 */
export const openaiRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(50, "1 m"), // 50 requests per minute
      analytics: true,
      prefix: "ratelimit:openai",
    })
  : undefined;

/**
 * Rate limiter for automation processing
 * Limits: 100 automations per minute per user
 * Prevents a single user from overwhelming the system
 */
export const automationRateLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 automations per minute
      analytics: true,
      prefix: "ratelimit:automation",
    })
  : undefined;

/**
 * Helper function to check rate limit
 * Returns { success: boolean, limit: number, remaining: number, reset: Date }
 */
export async function checkRateLimit(
  rateLimiter: Ratelimit | undefined,
  identifier: string
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  // If rate limiter is not configured, allow the request
  if (!rateLimiter) {
    console.warn("⚠️ Rate limiting is disabled (Redis not configured)");
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: new Date(Date.now() + 60000), // 1 minute from now
    };
  }

  try {
    const result = await rateLimiter.limit(identifier);
    
    if (!result.success) {
      console.warn(
        `🚫 Rate limit exceeded for ${identifier}. Reset at ${result.reset}`
      );
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset),
    };
  } catch (error) {
    console.error("❌ Error checking rate limit:", error);
    // On error, allow the request to proceed (fail open)
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: new Date(Date.now() + 60000),
    };
  }
}

export { redis };
