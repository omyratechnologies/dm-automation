import { AxiosError } from "axios";

/**
 * Configuration options for retry mechanism
 */
export interface RetryOptions {
  maxRetries?: number; // Maximum number of retry attempts (default: 3)
  initialDelay?: number; // Initial delay in milliseconds (default: 1000)
  maxDelay?: number; // Maximum delay in milliseconds (default: 10000)
  backoffMultiplier?: number; // Exponential backoff multiplier (default: 2)
  retryableStatusCodes?: number[]; // HTTP status codes that should trigger retry
  onRetry?: (error: any, attempt: number) => void; // Callback on each retry
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504], // Timeout, Rate limit, Server errors
  onRetry: () => {},
};

/**
 * Determines if an error should be retried
 */
function isRetryableError(
  error: any,
  retryableStatusCodes: number[]
): boolean {
  // Network errors (no response received)
  if (!error.response) {
    return true;
  }

  // Check if status code is in the retryable list
  if (error.response?.status) {
    return retryableStatusCodes.includes(error.response.status);
  }

  return false;
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  backoffMultiplier: number
): number {
  // Exponential backoff: delay = initialDelay * (backoffMultiplier ^ attempt)
  const exponentialDelay =
    initialDelay * Math.pow(backoffMultiplier, attempt - 1);

  // Add jitter (random variation) to prevent thundering herd
  // Jitter is between 0% and 25% of the delay
  const jitter = exponentialDelay * 0.25 * Math.random();

  const delay = Math.min(exponentialDelay + jitter, maxDelay);

  return delay;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => sendDM(userId, receiverId, message, token),
 *   {
 *     maxRetries: 3,
 *     onRetry: (error, attempt) => {
 *       console.log(`Retry attempt ${attempt}:`, error.message);
 *     }
 *   }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: any;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      // Try to execute the function
      const result = await fn();
      
      // Success! Log if this was a retry
      if (attempt > 1) {
        console.log(`✅ Retry successful on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry =
        attempt <= config.maxRetries &&
        isRetryableError(error, config.retryableStatusCodes);

      if (!shouldRetry) {
        // No more retries or error is not retryable
        if (attempt > config.maxRetries) {
          console.error(
            `❌ Max retries (${config.maxRetries}) exceeded. Giving up.`
          );
        } else {
          console.error("❌ Error is not retryable:", error);
        }
        throw error;
      }

      // Calculate delay and wait
      const delay = calculateDelay(
        attempt,
        config.initialDelay,
        config.maxDelay,
        config.backoffMultiplier
      );

      console.warn(
        `⚠️ Attempt ${attempt} failed. Retrying in ${Math.round(delay)}ms...`
      );

      // Call onRetry callback
      config.onRetry(error, attempt);

      // Wait before retrying
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript doesn't know that
  throw lastError;
}

/**
 * Specific retry wrapper for Instagram API calls
 * Configured with Instagram-specific retry logic
 */
export async function retryInstagramApi<T>(
  fn: () => Promise<T>,
  context: string = "Instagram API"
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 8000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    onRetry: (error: AxiosError, attempt: number) => {
      const status = error.response?.status || "Network Error";
      const message = error.response?.data || error.message;
      console.warn(
        `🔄 ${context} - Retry ${attempt}: Status ${status} - ${
          typeof message === "string" ? message : JSON.stringify(message)
        }`
      );
    },
  });
}

/**
 * Specific retry wrapper for OpenAI API calls
 * Configured with OpenAI-specific retry logic
 */
export async function retryOpenAI<T>(
  fn: () => Promise<T>,
  context: string = "OpenAI API"
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 2, // OpenAI is usually reliable, fewer retries
    initialDelay: 500,
    maxDelay: 5000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    onRetry: (error: any, attempt: number) => {
      console.warn(`🔄 ${context} - Retry ${attempt}:`, error.message);
    },
  });
}
