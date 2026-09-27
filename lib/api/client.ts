/**
 * lib/api/client.ts
 *
 * Typed HTTP client for the FacilPay REST API.
 *
 * Features:
 *  - Prefixes every request with NEXT_PUBLIC_API_BASE_URL
 *  - Attaches Authorization: Bearer <token> from sessionStorage / cookie
 *  - Parses JSON responses and returns typed data
 *  - Throws ApiError (with status, code, message) on non-2xx responses
 *  - On 401, redirects to the configured logout URL to clear auth state
 *  - Supports GET, POST, PUT, PATCH, DELETE with optional typed body / query params
 *
 * Usage:
 *   import { apiClient } from "@/lib/api/client";
 *
 *   const payment = await apiClient.get<Payment>(`/payments/${id}`);
 *   const created = await apiClient.post<Payment>("/payments", { body: payload });
 */

import { env } from "@/lib/env";

// ─── Typed error ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    /** Machine-readable error code from the API (e.g. "payment_not_found") */
    public readonly code: string,
    /** Human-readable message */
    message: string,
    /** Full response body, if available */
    public readonly body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    // Fix prototype chain in transpiled environments
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  get isNotFound()     { return this.status === 404; }
  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isValidation()   { return this.status === 422; }
  get isServerError()  { return this.status >= 500; }
}

// ─── Token provider ───────────────────────────────────────────────────────────

/**
 * Returns the current auth token, or null if not authenticated.
 * In a real app this would read from a cookie, httpOnly session, or an
 * auth-provider context.  We use sessionStorage as a simple stand-in.
 */
function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("fp_access_token");
}

/** Store a new token (called by the auth flow after login). */
export function setToken(token: string): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("fp_access_token", token);
  }
}

/** Clear the token and redirect to the logout URL. */
export function logout(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("fp_access_token");
  window.location.href = env.NEXT_PUBLIC_AUTH_LOGOUT_URL;
}

// ─── Request helpers ──────────────────────────────────────────────────────────

export interface RequestOptions<TBody = unknown> {
  /** JSON body — serialised automatically */
  body?: TBody;
  /** Query-string parameters — appended to the URL */
  params?: Record<string, string | number | boolean | undefined | null>;
  /** Extra headers merged with defaults */
  headers?: Record<string, string>;
  /** AbortSignal for cancellation */
  signal?: AbortSignal;
  /** Bypass the base URL for absolute URLs (e.g. Horizon) */
  absoluteUrl?: boolean;
  /** Cache behaviour passed directly to fetch */
  cache?: RequestCache;
  /** Next.js-specific: revalidation options */
  next?: NextFetchRequestConfig;
}

/** Next.js fetch extension type */
interface NextFetchRequestConfig {
  revalidate?: number | false;
  tags?: string[];
}

function buildUrl(
  path: string,
  params?: RequestOptions["params"],
  absoluteUrl = false
): string {
  const base = absoluteUrl ? "" : env.NEXT_PUBLIC_API_BASE_URL;
  const url  = new URL(`${base}${path}`);

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }

  return url.toString();
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra,
  };

  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// ─── Core request function ────────────────────────────────────────────────────

async function request<TResponse>(
  method: string,
  path: string,
  options: RequestOptions = {}
): Promise<TResponse> {
  const {
    body,
    params,
    headers: extraHeaders,
    signal,
    absoluteUrl = false,
    cache,
    next,
  } = options;

  const url       = buildUrl(path, params, absoluteUrl);
  const headers   = buildHeaders(extraHeaders);
  const fetchInit: RequestInit & { next?: NextFetchRequestConfig } = {
    method,
    headers,
    signal,
    cache,
    next,
  };

  if (body !== undefined) {
    fetchInit.body = JSON.stringify(body);
  }

  let response: Response;
  try {
    response = await fetch(url, fetchInit);
  } catch (networkError) {
    throw new ApiError(
      0,
      "network_error",
      networkError instanceof Error
        ? networkError.message
        : "A network error occurred",
      networkError
    );
  }

  // ── 401 — trigger logout ─────────────────────────────────────────────────
  if (response.status === 401) {
    logout();
    throw new ApiError(401, "unauthorized", "Session expired. Please log in again.");
  }

  // ── Parse body ───────────────────────────────────────────────────────────
  let parsed: unknown;
  const contentType = response.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("application/json")) {
      parsed = await response.json();
    } else {
      parsed = await response.text();
    }
  } catch {
    parsed = null;
  }

  // ── Non-2xx → throw ApiError ─────────────────────────────────────────────
  if (!response.ok) {
    const errBody = parsed as Record<string, unknown> | null;
    throw new ApiError(
      response.status,
      typeof errBody?.code === "string" ? errBody.code : "api_error",
      typeof errBody?.message === "string"
        ? errBody.message
        : `Request failed with status ${response.status}`,
      parsed
    );
  }

  return parsed as TResponse;
}

// ─── Public client ────────────────────────────────────────────────────────────

export const apiClient = {
  get<T>(path: string, options?: Omit<RequestOptions, "body">) {
    return request<T>("GET", path, options);
  },

  post<T, B = unknown>(path: string, options?: RequestOptions<B>) {
    return request<T>("POST", path, options);
  },

  put<T, B = unknown>(path: string, options?: RequestOptions<B>) {
    return request<T>("PUT", path, options);
  },

  patch<T, B = unknown>(path: string, options?: RequestOptions<B>) {
    return request<T>("PATCH", path, options);
  },

  delete<T = void>(path: string, options?: Omit<RequestOptions, "body">) {
    return request<T>("DELETE", path, options);
  },
} as const;
