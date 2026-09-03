import { auth } from "@clerk/nextjs/server";
import { API_TIMEOUT_MS, API_URL, ApiError } from "./api";

type ServerApiOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  workspaceId?: string;
  headers?: Record<string, string>;
};

export async function serverApiFetch<T>(
  path: string,
  options: ServerApiOptions = {},
): Promise<T> {
  const { getToken } = await auth();
  const token = await getToken();
  const { method = "GET", body, workspaceId } = options;

  const headers: Record<string, string> = { ...options.headers };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (workspaceId) headers["x-workspace-id"] = workspaceId;
  const hasIdempotencyKey = Object.keys(headers).some((name) => name.toLowerCase() === "idempotency-key");
  if (["POST", "PATCH", "PUT", "DELETE"].includes(method) && !hasIdempotencyKey) {
    headers["Idempotency-Key"] = crypto.randomUUID();
  }

  // Transparently forward impersonation header/cookie if present in client request context
  try {
    const { headers: getHeaders, cookies: getCookies } = await import("next/headers");
    const clientHeaders = await getHeaders();
    let impersonateHeader = clientHeaders.get("x-impersonate-user-id");
    
    if (!impersonateHeader) {
      const clientCookies = await getCookies();
      impersonateHeader = clientCookies.get("x-impersonate-user-id")?.value || null;
    }
    
    if (impersonateHeader) {
      headers["x-impersonate-user-id"] = impersonateHeader;
    }
  } catch (err) {
    // Safe fallback if called outside Next.js request context (e.g., build-time pre-render)
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}/v1${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(API_TIMEOUT_MS),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    if (e instanceof DOMException && e.name === "TimeoutError") {
      throw new ApiError(0, "Request timed out — the API is unreachable");
    }
    throw new ApiError(0, "Network error — could not reach the API");
  }

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    if (data && typeof data === "object") {
      const m = (data as { message?: string | string[] }).message;
      const detail = (data as { detail?: string }).detail;
      if (typeof detail === "string") message = detail;
      else if (Array.isArray(m)) message = m.join(", ");
      else if (typeof m === "string") message = m;
    } else if (typeof data === "string" && data) {
      message = data;
    }
    throw new ApiError(res.status, message, data);
  }

  return data as T;
}
