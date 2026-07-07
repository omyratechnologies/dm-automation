/** Meta Graph API error codes that indicate rate limiting / throttling. */
const RATE_LIMIT_CODES = new Set([4, 17, 613]);
const RATE_LIMIT_SUBCODES = new Set([2534022]);

/** Thrown when Meta throttles us — the queue should back off and retry. */
export class RateLimitedError extends Error {
  constructor(
    message = "Instagram API rate limit reached",
    readonly metaCode?: number,
    readonly metaSubcode?: number,
  ) {
    super(message);
    this.name = "RateLimitedError";
  }
}

/** Non-rate-limit Graph API failure (4xx/5xx). */
export class IgApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly metaCode?: number,
    readonly metaSubcode?: number,
  ) {
    super(message);
    this.name = "IgApiError";
  }

  get isClientError(): boolean {
    return this.status !== undefined && this.status >= 400 && this.status < 500;
  }
}

interface MetaErrorBody {
  error?: {
    message?: string;
    code?: number;
    error_subcode?: number;
  };
  error_message?: string;
}

/** Maps an axios error to RateLimitedError or IgApiError. */
export function mapGraphError(err: unknown): Error {
  const anyErr = err as {
    response?: { status?: number; data?: MetaErrorBody };
    message?: string;
  };
  const status = anyErr?.response?.status;
  const meta = anyErr?.response?.data?.error;
  const code = typeof meta?.code === "number" ? meta.code : undefined;
  const subcode =
    typeof meta?.error_subcode === "number" ? meta.error_subcode : undefined;
  const message =
    meta?.message ??
    anyErr?.response?.data?.error_message ??
    anyErr?.message ??
    "Instagram API request failed";

  if (
    status === 429 ||
    (code !== undefined && RATE_LIMIT_CODES.has(code)) ||
    (subcode !== undefined && RATE_LIMIT_SUBCODES.has(subcode))
  ) {
    return new RateLimitedError(message, code, subcode);
  }
  return new IgApiError(message, status, code, subcode);
}
