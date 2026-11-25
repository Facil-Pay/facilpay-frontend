/**
 * lib/api-request-logs.ts
 *
 * API request log domain types, fixtures and helpers powering the
 * Developers → Request Logs viewer.
 *
 * The viewer lists recent requests made with a merchant's keys so an
 * integration can be debugged without leaving the dashboard. Logs that
 * created a payment or refund link back to the related resource.
 *
 * Secret material (auth headers, signatures, card data, key secrets) is
 * never rendered raw — `redactHeaders` / `redactValue` mask it on read.
 */

import type { Paginated, PaginationMeta } from "@/lib/types/pagination";

// ─── Types ────────────────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/** Coarse status bucket used by the status-class filter. */
export type RequestStatusClass = "2xx" | "4xx" | "5xx";

export type KeyEnvironment = "testnet" | "mainnet";

export interface ApiRequestLog {
  id: string;
  /** Server-generated correlation id, echoed in the `X-Request-Id` header. */
  requestId: string;
  method: HttpMethod;
  /** Path (incl. query string) relative to the API base URL. */
  path: string;
  status: number;
  /** Id of the merchant key that authenticated the request. */
  keyId: string;
  keyName: string;
  /** Non-secret key prefix for display (e.g. `sk_live_7a8b…`). */
  keyPrefix: string;
  environment: KeyEnvironment;
  latencyMs: number;
  timestamp: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  /** Set when the request created / touched a payment. */
  relatedPaymentId?: string;
  /** Set when the request created / touched a refund. */
  relatedRefundId?: string;
}

export interface RequestLogFilters {
  statusClass: RequestStatusClass | "all";
  keyId: string | "all";
  path: string;
}

export interface RequestLogKeyOption {
  keyId: string;
  keyName: string;
  keyPrefix: string;
  environment: KeyEnvironment;
}

export const DEFAULT_REQUEST_LOG_FILTERS: RequestLogFilters = {
  statusClass: "all",
  keyId: "all",
  path: "",
};

export const REQUEST_LOG_PAGE_SIZE = 10;

// ─── Redaction ────────────────────────────────────────────────────────────────

export const REDACTED = "[REDACTED]";

/** Header names (normalised) that must never be shown verbatim. */
const SENSITIVE_FIELDS: readonly string[] = [
  "authorization",
  "proxyauthorization",
  "cookie",
  "setcookie",
  "apikey",
  "signature",
  "secret",
  "password",
  "token",
  "cardnumber",
  "cvv",
  "cvc",
  "pin",
  "privatekey",
];

/** Key/secret strings that may appear inside otherwise innocuous values. */
const SECRET_VALUE_PATTERN = /\b(?:sk|pk|whsec)_[A-Za-z0-9_]{6,}\b/g;

/**
 * Normalises a field name so `X-Api-Key`, `api_key` and `apiKey` compare equal.
 */
function normalizeFieldName(field: string): string {
  return field.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * True when a header/body field is sensitive and must be masked.
 * Matching is by normalised suffix to catch variants such as
 * `client_secret`, `X-FacilPay-Signature` or `card_number`.
 */
export function isSensitiveField(field: string): boolean {
  const normalized = normalizeFieldName(field);
  return SENSITIVE_FIELDS.some(
    (sensitive) => normalized === sensitive || normalized.endsWith(sensitive)
  );
}

/** Masks any embedded key/secret substrings inside a free-form string. */
export function redactString(value: string): string {
  return value.replace(SECRET_VALUE_PATTERN, REDACTED);
}

/** Returns a copy of `headers` with sensitive values masked. */
export function redactHeaders(
  headers: Record<string, string> = {}
): Record<string, string> {
  const safe: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    safe[key] = isSensitiveField(key) ? REDACTED : redactString(String(value));
  }
  return safe;
}

/**
 * Deep-copies an arbitrary JSON value, masking sensitive keys and any
 * embedded key/secret strings. Never mutates the input.
 */
export function redactValue(value: unknown): unknown {
  if (typeof value === "string") return redactString(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (value && typeof value === "object") {
    const safe: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      safe[key] = isSensitiveField(key) ? REDACTED : redactValue(nested);
    }
    return safe;
  }
  return value;
}

// ─── Status helpers ───────────────────────────────────────────────────────────

/** Buckets a status code into the filterable 2xx / 4xx / 5xx classes. */
export function statusClass(status: number): RequestStatusClass {
  if (status >= 500) return "5xx";
  if (status >= 400) return "4xx";
  return "2xx";
}

/** Human-readable label for a status code, falling back to the class. */
export function statusText(status: number): string {
  const labels: Record<number, string> = {
    200: "OK",
    201: "Created",
    204: "No Content",
    400: "Bad Request",
    401: "Unauthorized",
    403: "Forbidden",
    404: "Not Found",
    422: "Unprocessable Entity",
    429: "Too Many Requests",
    500: "Internal Server Error",
    502: "Bad Gateway",
    503: "Service Unavailable",
  };
  return labels[status] ?? statusClass(status);
}

// ─── Filtering & pagination ───────────────────────────────────────────────────

/** Applies the status-class, key and path filters to a log list. */
export function filterRequestLogs(
  logs: ApiRequestLog[],
  filters: RequestLogFilters
): ApiRequestLog[] {
  const query = filters.path.trim().toLowerCase();
  return logs.filter((log) => {
    if (filters.statusClass !== "all" && statusClass(log.status) !== filters.statusClass) {
      return false;
    }
    if (filters.keyId !== "all" && log.keyId !== filters.keyId) return false;
    if (query && !log.path.toLowerCase().includes(query)) return false;
    return true;
  });
}

/** Slices a log list into a `Paginated<ApiRequestLog>` envelope. */
export function paginateRequestLogs(
  logs: ApiRequestLog[],
  page = 1,
  pageSize = REQUEST_LOG_PAGE_SIZE
): Paginated<ApiRequestLog> {
  const total = logs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const meta: PaginationMeta = {
    total,
    page: safePage,
    pageSize,
    totalPages,
    hasNextPage: safePage < totalPages,
    hasPrevPage: safePage > 1,
  };
  return { data: logs.slice(start, start + pageSize), meta };
}

/** Unique key descriptors present in the logs, for the key filter dropdown. */
export function getRequestLogKeys(logs: ApiRequestLog[]): RequestLogKeyOption[] {
  const seen = new Map<string, RequestLogKeyOption>();
  for (const log of logs) {
    if (!seen.has(log.keyId)) {
      seen.set(log.keyId, {
        keyId: log.keyId,
        keyName: log.keyName,
        keyPrefix: log.keyPrefix,
        environment: log.environment,
      });
    }
  }
  return Array.from(seen.values());
}

// ─── Fixtures ─────────────────────────────────────────────────────────────────

export const API_REQUEST_LOGS_STORAGE_KEY = "facilpay_api_request_logs";

const NOW = Date.now();
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

/** ISO timestamp `offsetMs` in the past. */
const ago = (offsetMs: number) => new Date(NOW - offsetMs).toISOString();

const SERVER_KEY = {
  keyId: "key_testnet_server_01",
  keyName: "Primary Backend Integration",
  keyPrefix: "sk_test_9f8a2c1b84e7...",
  environment: "testnet" as KeyEnvironment,
};

const WEBHOOK_KEY = {
  keyId: "key_testnet_webhooks_02",
  keyName: "Webhook Event Dispatcher",
  keyPrefix: "sk_test_3b4c5d6e7f8a...",
  environment: "testnet" as KeyEnvironment,
};

const LIVE_KEY = {
  keyId: "key_live_prod_01",
  keyName: "Mainnet Production Gateway",
  keyPrefix: "sk_live_7a8b9c0d1e2f...",
  environment: "mainnet" as KeyEnvironment,
};

const TEST_BEARER =
  "Bearer sk_test_9f8a2c1b84e793d5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c";
const LIVE_BEARER =
  "Bearer sk_live_7a8b9c0d1e2f...";

function baseRequestHeaders(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "FacilPay-NodeSDK/2.4.1",
    ...overrides,
  };
}

function baseResponseHeaders(overrides: Record<string, string> = {}): Record<string, string> {
  return {
    "content-type": "application/json; charset=utf-8",
    "x-facilpay-request-id": "req_placeholder",
    ...overrides,
  };
}

export const INITIAL_REQUEST_LOGS: ApiRequestLog[] = [
  {
    id: "log_01",
    requestId: "req_9f21ac04",
    method: "POST",
    path: "/v1/payments",
    status: 201,
    ...LIVE_KEY,
    latencyMs: 214,
    timestamp: ago(4 * MINUTE),
    requestHeaders: baseRequestHeaders({
      Authorization: LIVE_BEARER,
      "X-FacilPay-Signature": "t=1764154680,v1=8c1f0a93d27b4e56a1f809b3c4d5e6f7a8b9c0d1",
    }),
    requestBody: {
      amount: "150.00",
      currency: "USDC",
      customer_email: "buyer@example.com",
      memo: "Order #90192",
      metadata: { order_id: "ord_90192" },
    },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_9f21ac04" }),
    responseBody: {
      id: "pay_02k0yl3n4o5p6q7r8s9t0u1w",
      status: "pending",
      amount: "150.00",
      currency: "USDC",
      created_at: ago(4 * MINUTE),
    },
    relatedPaymentId: "pay_02k0yl3n4o5p6q7r8s9t0u1w",
  },
  {
    id: "log_02",
    requestId: "req_4b77e1c2",
    method: "GET",
    path: "/v1/payments?limit=20&status=completed",
    status: 200,
    ...LIVE_KEY,
    latencyMs: 96,
    timestamp: ago(6 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_4b77e1c2" }),
    responseBody: {
      data: [
        { id: "pay_01j9xk2m3n4p5q6r7s8t9u0v", status: "completed", amount: "250.00" },
      ],
      meta: { total: 1, page: 1, page_size: 20 },
    },
  },
  {
    id: "log_03",
    requestId: "req_1c09ba43",
    method: "GET",
    path: "/v1/payments/pay_01j9xk2m3n4p5q6r7s8t9u0v",
    status: 200,
    ...LIVE_KEY,
    latencyMs: 88,
    timestamp: ago(9 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_1c09ba43" }),
    responseBody: {
      id: "pay_01j9xk2m3n4p5q6r7s8t9u0v",
      status: "completed",
      amount: "250.00",
      currency: "USDC",
      network: "stellar_mainnet",
    },
    relatedPaymentId: "pay_01j9xk2m3n4p5q6r7s8t9u0v",
  },
  {
    id: "log_04",
    requestId: "req_77ab02de",
    method: "POST",
    path: "/v1/refunds",
    status: 201,
    ...SERVER_KEY,
    latencyMs: 176,
    timestamp: ago(14 * MINUTE),
    requestHeaders: baseRequestHeaders({
      Authorization: TEST_BEARER,
      "X-FacilPay-Signature": "t=1764154025,v1=1a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d",
    }),
    requestBody: {
      payment_id: "pay_04m2an5p6q7r8s9t0u1v2w3y",
      amount: "50.00",
      reason: "requested_by_customer",
      card_number: "4242 4242 4242 4242",
      cvv: "123",
      metadata: { ticket: "T-7781" },
    },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_77ab02de" }),
    responseBody: {
      id: "ref_01a2b3c4d5e6f7a8b9c0d1e2",
      payment_id: "pay_04m2an5p6q7r8s9t0u1v2w3y",
      amount: "50.00",
      status: "pending",
    },
    relatedRefundId: "ref_01a2b3c4d5e6f7a8b9c0d1e2",
    relatedPaymentId: "pay_04m2an5p6q7r8s9t0u1v2w3y",
  },
  {
    id: "log_05",
    requestId: "req_31e5ad09",
    method: "POST",
    path: "/v1/payments",
    status: 422,
    ...SERVER_KEY,
    latencyMs: 132,
    timestamp: ago(18 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: TEST_BEARER }),
    requestBody: { amount: "-5.00", currency: "usdc", customer_email: "not-an-email" },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_31e5ad09" }),
    responseBody: {
      code: "validation_error",
      message: "The request payload failed validation.",
      errors: [
        { field: "amount", detail: "must be greater than 0" },
        { field: "currency", detail: "must be a supported asset code" },
        { field: "customer_email", detail: "must be a valid email address" },
      ],
    },
  },
  {
    id: "log_06",
    requestId: "req_5d20cc71",
    method: "GET",
    path: "/v1/balance",
    status: 200,
    ...LIVE_KEY,
    latencyMs: 74,
    timestamp: ago(22 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_5d20cc71" }),
    responseBody: {
      available: [{ asset: "USDC", balance: "18402.55" }],
      pending: "152.00",
    },
  },
  {
    id: "log_07",
    requestId: "req_88b1f0aa",
    method: "POST",
    path: "/v1/webhooks",
    status: 201,
    ...LIVE_KEY,
    latencyMs: 245,
    timestamp: ago(27 * MINUTE),
    requestHeaders: baseRequestHeaders({
      Authorization: LIVE_BEARER,
      "X-FacilPay-Signature": "t=1764153241,v1=aa11bb22cc33dd44ee55ff6600112233aabbccdd",
    }),
    requestBody: {
      url: "https://api.acmestore.com/api/v1/webhooks/facilpay",
      events: ["payment.completed", "refund.completed"],
      signing_secret: "whsec_7f9b8c2d1e0a4f5e6b7c8d9e0f1a2b3c",
    },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_88b1f0aa" }),
    responseBody: {
      id: "wh_02b3c4d5e6f7a8b9c0d1e2f3",
      url: "https://api.acmestore.com/api/v1/webhooks/facilpay",
      status: "active",
      secret: "whsec_7f9b8c2d1e0a4f5e6b7c8d9e0f1a2b3c",
    },
  },
  {
    id: "log_08",
    requestId: "req_a2ff90e1",
    method: "POST",
    path: "/v1/checkout/sessions",
    status: 500,
    ...LIVE_KEY,
    latencyMs: 3012,
    timestamp: ago(33 * MINUTE),
    requestHeaders: baseRequestHeaders({
      Authorization: LIVE_BEARER,
      "X-FacilPay-Signature": "t=1764152884,v1=99887766554433221100aabbccddeeff00112233",
    }),
    requestBody: { payment_link: "pl_7f9b2d01", success_url: "https://acmestore.com/thanks" },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_a2ff90e1" }),
    responseBody: {
      code: "internal_error",
      message: "An unexpected error occurred while creating the checkout session.",
      request_id: "req_a2ff90e1",
    },
  },
  {
    id: "log_09",
    requestId: "req_63c118b4",
    method: "GET",
    path: "/v1/payments/pay_does_not_exist",
    status: 404,
    ...WEBHOOK_KEY,
    latencyMs: 61,
    timestamp: ago(41 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: TEST_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_63c118b4" }),
    responseBody: {
      code: "payment_not_found",
      message: "No payment exists with the provided id.",
    },
  },
  {
    id: "log_10",
    requestId: "req_06d7e9f2",
    method: "DELETE",
    path: "/v1/webhooks/wh_02b3c4d5e6f7a8b9c0d1e2f3",
    status: 204,
    ...LIVE_KEY,
    latencyMs: 58,
    timestamp: ago(55 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    responseHeaders: { "x-facilpay-request-id": "req_06d7e9f2" },
  },
  {
    id: "log_11",
    requestId: "req_5e0a3bd0",
    method: "POST",
    path: "/v1/refunds",
    status: 400,
    ...SERVER_KEY,
    latencyMs: 118,
    timestamp: ago(HOUR + 5 * MINUTE),
    requestHeaders: baseRequestHeaders({
      Authorization: TEST_BEARER,
      "X-FacilPay-Signature": "t=1764150300,v1=d0c0ffee1234567890abcdef1234567890abcdef",
    }),
    requestBody: { payment_id: "pay_11t9hu2w3x4y5z6a7b8c9d0f", amount: "99999.00" },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_5e0a3bd0" }),
    responseBody: {
      code: "invalid_state",
      message: "Refund amount exceeds the refundable balance for this payment.",
    },
    relatedPaymentId: "pay_11t9hu2w3x4y5z6a7b8c9d0f",
  },
  {
    id: "log_12",
    requestId: "req_b93a1447",
    method: "GET",
    path: "/v1/refunds?status=pending",
    status: 200,
    ...LIVE_KEY,
    latencyMs: 103,
    timestamp: ago(HOUR + 20 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_b93a1447" }),
    responseBody: {
      data: [{ id: "ref_01a2b3c4d5e6f7a8b9c0d1e2", status: "pending", amount: "50.00" }],
      meta: { total: 1, page: 1, page_size: 20 },
    },
  },
  {
    id: "log_13",
    requestId: "req_2d8841fa",
    method: "PATCH",
    path: "/v1/payments/pay_03l1zm4o5p6q7r8s9t0u1v2x",
    status: 200,
    ...LIVE_KEY,
    latencyMs: 134,
    timestamp: ago(HOUR + 45 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    requestBody: { metadata: { order_id: "ord_55231", fulfilled: true } },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_2d8841fa" }),
    responseBody: {
      id: "pay_03l1zm4o5p6q7r8s9t0u1v2x",
      status: "failed",
      metadata: { order_id: "ord_55231", fulfilled: true },
    },
    relatedPaymentId: "pay_03l1zm4o5p6q7r8s9t0u1v2x",
  },
  {
    id: "log_14",
    requestId: "req_71c0fe08",
    method: "GET",
    path: "/v1/health",
    status: 200,
    ...WEBHOOK_KEY,
    latencyMs: 42,
    timestamp: ago(2 * HOUR),
    requestHeaders: baseRequestHeaders({ Authorization: TEST_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_71c0fe08" }),
    responseBody: { status: "ok", environment: "testnet" },
  },
  {
    id: "log_15",
    requestId: "req_9a02cc35",
    method: "POST",
    path: "/v1/payment_links",
    status: 201,
    ...LIVE_KEY,
    latencyMs: 189,
    timestamp: ago(2 * HOUR + 30 * MINUTE),
    requestHeaders: baseRequestHeaders({
      Authorization: LIVE_BEARER,
      "X-FacilPay-Signature": "t=1764143100,v1=1234abcd5678ef901234abcd5678ef901234abcd",
    }),
    requestBody: {
      amount: "75.00",
      currency: "EURC",
      description: "Invoice #INV-2026-114",
      expires_in: 86400,
    },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_9a02cc35" }),
    responseBody: {
      id: "pl_live_5521ab",
      url: "https://pay.facilpay.io/pl_live_5521ab",
      status: "active",
    },
  },
  {
    id: "log_16",
    requestId: "req_3f11bb72",
    method: "POST",
    path: "/v1/api-keys/rotate",
    status: 500,
    ...LIVE_KEY,
    latencyMs: 1520,
    timestamp: ago(3 * HOUR + 10 * MINUTE),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    requestBody: {
      key_id: "key_live_prod_01",
      current_secret: "sk_live_7a8b9c0d1e2f...",
      grace_period: "24h",
    },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_3f11bb72" }),
    responseBody: {
      code: "internal_error",
      message: "Key rotation failed while persisting the new secret.",
    },
  },
  {
    id: "log_17",
    requestId: "req_c4de2280",
    method: "GET",
    path: "/v1/customers?limit=50",
    status: 200,
    ...LIVE_KEY,
    latencyMs: 156,
    timestamp: ago(4 * HOUR),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_c4de2280" }),
    responseBody: {
      data: [{ id: "cus_8812", email: "buyer@example.com", total_spent: "1250.00" }],
      meta: { total: 1, page: 1, page_size: 50 },
    },
  },
  {
    id: "log_18",
    requestId: "req_7bb0d1e9",
    method: "GET",
    path: "/v1/refunds/ref_03c4d5e6f7a8b9c0d1e2f3a4",
    status: 200,
    ...LIVE_KEY,
    latencyMs: 79,
    timestamp: ago(5 * HOUR),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_7bb0d1e9" }),
    responseBody: {
      id: "ref_03c4d5e6f7a8b9c0d1e2f3a4",
      payment_id: "pay_04m2an5p6q7r8s9t0u1v2w3y",
      status: "completed",
      amount: "30.00",
    },
    relatedRefundId: "ref_03c4d5e6f7a8b9c0d1e2f3a4",
    relatedPaymentId: "pay_04m2an5p6q7r8s9t0u1v2w3y",
  },
  {
    id: "log_19",
    requestId: "req_0ac9f4d3",
    method: "POST",
    path: "/v1/refunds",
    status: 201,
    ...SERVER_KEY,
    latencyMs: 201,
    timestamp: ago(8 * HOUR),
    requestHeaders: baseRequestHeaders({
      Authorization: TEST_BEARER,
      "X-FacilPay-Signature": "t=1764122100,v1=abcdef0123456789abcdef0123456789abcdef01",
    }),
    requestBody: {
      payment_id: "pay_11t9hu2w3x4y5z6a7b8c9d0f",
      amount: "20.00",
      reason: "duplicate_charge",
    },
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_0ac9f4d3" }),
    responseBody: {
      id: "ref_02b3c4d5e6f7a8b9c0d1e2f3",
      payment_id: "pay_11t9hu2w3x4y5z6a7b8c9d0f",
      amount: "20.00",
      status: "pending",
    },
    relatedRefundId: "ref_02b3c4d5e6f7a8b9c0d1e2f3",
    relatedPaymentId: "pay_11t9hu2w3x4y5z6a7b8c9d0f",
  },
  {
    id: "log_20",
    requestId: "req_e5f2a7b1",
    method: "GET",
    path: "/v1/payouts",
    status: 403,
    ...WEBHOOK_KEY,
    latencyMs: 66,
    timestamp: ago(12 * HOUR),
    requestHeaders: baseRequestHeaders({ Authorization: TEST_BEARER }),
    responseHeaders: baseResponseHeaders({ "x-facilpay-request-id": "req_e5f2a7b1" }),
    responseBody: {
      code: "insufficient_scope",
      message: "This key is not permitted to read payouts.",
    },
  },
  {
    id: "log_21",
    requestId: "req_14ba9c60",
    method: "POST",
    path: "/v1/payments",
    status: 429,
    ...SERVER_KEY,
    latencyMs: 54,
    timestamp: ago(20 * HOUR),
    requestHeaders: baseRequestHeaders({
      Authorization: TEST_BEARER,
      "X-FacilPay-Signature": "t=1764081400,v1=ffee00112233445566778899aabbccddeeff0011",
    }),
    requestBody: { amount: "10.00", currency: "USDC" },
    responseHeaders: baseResponseHeaders({
      "x-facilpay-request-id": "req_14ba9c60",
      "retry-after": "30",
    }),
    responseBody: {
      code: "rate_limit_exceeded",
      message: "Too many requests. Retry after 30 seconds.",
    },
  },
  {
    id: "log_22",
    requestId: "req_dd20e77a",
    method: "GET",
    path: "/v1/payments?limit=100",
    status: 503,
    ...LIVE_KEY,
    latencyMs: 4120,
    timestamp: ago(24 * HOUR + 3 * HOUR),
    requestHeaders: baseRequestHeaders({ Authorization: LIVE_BEARER }),
    responseHeaders: baseResponseHeaders({
      "x-facilpay-request-id": "req_dd20e77a",
      "retry-after": "60",
    }),
    responseBody: {
      code: "service_unavailable",
      message: "The payments service is temporarily unavailable.",
    },
  },
];

/**
 * Reads the merchant's recent API request logs.
 *
 * Prefers any logs persisted in `localStorage` (written by the API layer in
 * a live environment) and falls back to the bundled demo fixtures.
 */
export function getStoredRequestLogs(): ApiRequestLog[] {
  if (typeof window === "undefined") return INITIAL_REQUEST_LOGS;
  try {
    const raw = window.localStorage.getItem(API_REQUEST_LOGS_STORAGE_KEY);
    if (!raw) return INITIAL_REQUEST_LOGS;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0
      ? (parsed as ApiRequestLog[])
      : INITIAL_REQUEST_LOGS;
  } catch (error) {
    console.warn("Error reading stored API request logs:", error);
    return INITIAL_REQUEST_LOGS;
  }
}
