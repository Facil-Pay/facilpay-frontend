/**
 * tests/api-client.test.ts
 *
 * Unit tests for the typed HTTP client in lib/api/client.ts (issue #139).
 * Network traffic is intercepted with the shared MSW server from
 * lib/mocks/server.ts, so the client's real fetch path is exercised.
 */

import { http, HttpResponse } from "msw";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiClient, logout, setToken } from "@/lib/api/client";
import { env } from "@/lib/env";
import { server } from "@/lib/mocks/server";

const BASE = env.NEXT_PUBLIC_API_BASE_URL;
const LOGOUT_URL = env.NEXT_PUBLIC_AUTH_LOGOUT_URL;
const TOKEN_KEY = "fp_access_token";

/** Captures the most recent request seen by an MSW handler. */
function captureRequests() {
  const seen: Request[] = [];
  return {
    seen,
    last: () => {
      const request = seen.at(-1);
      if (!request) throw new Error("No request was captured");
      return request;
    },
  };
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

beforeEach(() => {
  sessionStorage.clear();
  // jsdom cannot navigate; replace location so logout() can assign href safely.
  vi.stubGlobal("location", { href: "http://localhost:3000/dashboard", origin: "http://localhost:3000", pathname: "/dashboard" });
});

afterEach(() => {
  server.resetHandlers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("apiClient URL building", () => {
  it("prefixes relative paths with NEXT_PUBLIC_API_BASE_URL", async () => {
    const capture = captureRequests();
    server.use(
      http.get(`${BASE}/payments`, ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json({ ok: true });
      }),
    );

    await expect(apiClient.get<{ ok: boolean }>("/payments")).resolves.toEqual({ ok: true });
    expect(capture.last().url).toBe(`${BASE}/payments`);
  });

  it("serialises string, number and boolean query params", async () => {
    const capture = captureRequests();
    server.use(
      http.get(`${BASE}/payments`, ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json([]);
      }),
    );

    await apiClient.get("/payments", {
      params: { status: "paid", page: 2, pageSize: 0, includeVoided: false },
    });

    const url = new URL(capture.last().url);
    expect(url.searchParams.get("status")).toBe("paid");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("pageSize")).toBe("0");
    expect(url.searchParams.get("includeVoided")).toBe("false");
  });

  it("omits undefined and null query params", async () => {
    const capture = captureRequests();
    server.use(
      http.get(`${BASE}/payments`, ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json([]);
      }),
    );

    await apiClient.get("/payments", {
      params: { search: undefined, cursor: null, page: 1 },
    });

    const url = new URL(capture.last().url);
    expect(url.searchParams.has("search")).toBe(false);
    expect(url.searchParams.has("cursor")).toBe(false);
    expect(url.searchParams.get("page")).toBe("1");
  });

  it("bypasses the base URL when absoluteUrl is true", async () => {
    const horizon = "https://horizon-testnet.stellar.org/accounts/GABC";
    const capture = captureRequests();
    server.use(
      http.get(horizon, ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json({ id: "GABC" });
      }),
    );

    await apiClient.get("https://horizon-testnet.stellar.org/accounts/GABC", { absoluteUrl: true });
    expect(capture.last().url).toBe(horizon);
  });
});

describe("apiClient HTTP verbs", () => {
  it.each(["get", "post", "put", "patch", "delete"] as const)("%s sends the matching HTTP method", async (method) => {
    const capture = captureRequests();
    const handler = ({ request }: { request: Request }) => {
      capture.seen.push(request);
      return HttpResponse.json({ method: request.method });
    };
    server.use(
      method === "get" ? http.get(`${BASE}/merchant/resource`, handler)
        : method === "post" ? http.post(`${BASE}/merchant/resource`, handler)
        : method === "put" ? http.put(`${BASE}/merchant/resource`, handler)
        : method === "patch" ? http.patch(`${BASE}/merchant/resource`, handler)
        : http.delete(`${BASE}/merchant/resource`, handler),
    );

    const client = apiClient[method] as (path: string) => Promise<unknown>;
    const expected = method.toUpperCase();
    await expect(client("/merchant/resource")).resolves.toEqual({ method: expected });
    expect(capture.last().method).toBe(expected);
  });

  it.each(["post", "put", "patch"] as const)("%s serialises the body as JSON", async (method) => {
    const capture = captureRequests();
    const payload = { name: "Coffee", amount: 12.5 };
    server.use(
      http[method](`${BASE}/items`, async ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json({ saved: true }, { status: 201 });
      }),
    );

    await apiClient[method]("/items", { body: payload });

    const request = capture.last();
    expect(request.headers.get("content-type")).toBe("application/json");
    await expect(request.json()).resolves.toEqual(payload);
  });

  it("does not send a body when none is provided", async () => {
    const capture = captureRequests();
    server.use(
      http.post(`${BASE}/payments/pay_1/cancel`, async ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json({ status: "cancelled" });
      }),
    );

    await apiClient.post("/payments/pay_1/cancel");
    expect(await capture.last().text()).toBe("");
  });

  it("resolves with an empty string for a 204 DELETE", async () => {
    server.use(http.delete(`${BASE}/merchant/sessions/s_1`, () => new HttpResponse(null, { status: 204 })));

    await expect(apiClient.delete("/merchant/sessions/s_1")).resolves.toBe("");
  });

  it("returns plain text for non-JSON success responses", async () => {
    server.use(
      http.get(`${BASE}/health`, () => new HttpResponse("pong", { headers: { "Content-Type": "text/plain" } })),
    );

    await expect(apiClient.get<string>("/health")).resolves.toBe("pong");
  });

  it("returns null when a JSON response body cannot be parsed", async () => {
    server.use(
      http.get(
        `${BASE}/broken`,
        () => new HttpResponse("{not json", { headers: { "Content-Type": "application/json" } }),
      ),
    );

    await expect(apiClient.get("/broken")).resolves.toBeNull();
  });
});

describe("apiClient headers", () => {
  it("sends JSON content negotiation headers by default", async () => {
    const capture = captureRequests();
    server.use(
      http.get(`${BASE}/merchant/profile`, ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json({});
      }),
    );

    await apiClient.get("/merchant/profile");
    expect(capture.last().headers.get("accept")).toBe("application/json");
    expect(capture.last().headers.get("content-type")).toBe("application/json");
  });

  it("attaches the Authorization bearer header when a token is stored", async () => {
    const capture = captureRequests();
    setToken("tok_live_123");
    server.use(
      http.get(`${BASE}/merchant/profile`, ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json({});
      }),
    );

    await apiClient.get("/merchant/profile");
    expect(capture.last().headers.get("authorization")).toBe("Bearer tok_live_123");
  });

  it("omits the Authorization header when no token is stored", async () => {
    const capture = captureRequests();
    server.use(
      http.get(`${BASE}/merchant/profile`, ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json({});
      }),
    );

    await apiClient.get("/merchant/profile");
    expect(capture.last().headers.has("authorization")).toBe(false);
  });

  it("merges per-request headers with the defaults", async () => {
    const capture = captureRequests();
    server.use(
      http.get(`${BASE}/merchant/profile`, ({ request }) => {
        capture.seen.push(request);
        return HttpResponse.json({});
      }),
    );

    await apiClient.get("/merchant/profile", { headers: { "X-FacilPay-2FA-Token": "123456", Accept: "text/csv" } });
    expect(capture.last().headers.get("x-facilpay-2fa-token")).toBe("123456");
    expect(capture.last().headers.get("accept")).toBe("text/csv");
  });
});

describe("apiClient error handling", () => {
  it("throws ApiError with status, code, message and body for non-2xx JSON responses", async () => {
    const body = { code: "payment_not_found", message: "Payment pay_9 not found." };
    server.use(http.get(`${BASE}/payments/pay_9`, () => HttpResponse.json(body, { status: 404 })));

    const error = await apiClient.get("/payments/pay_9").catch((err: unknown) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      name: "ApiError",
      status: 404,
      code: "payment_not_found",
      message: "Payment pay_9 not found.",
      body,
      isNotFound: true,
    });
  });

  it("falls back to api_error and a status message when the error body is not JSON", async () => {
    server.use(
      http.post(`${BASE}/payouts`, () => new HttpResponse("Gateway exploded", { status: 502, headers: { "Content-Type": "text/plain" } })),
    );

    const error = await apiClient.post("/payouts").catch((err: unknown) => err as ApiError);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.code).toBe("api_error");
    expect(error.message).toBe("Request failed with status 502");
    expect(error.body).toBe("Gateway exploded");
    expect(error.isServerError).toBe(true);
  });

  it("uses the api_error code when a JSON error body lacks string fields", async () => {
    server.use(http.put(`${BASE}/merchant/branding`, () => HttpResponse.json({ code: 42 }, { status: 422 })));

    const error = await apiClient.put("/merchant/branding").catch((err: unknown) => err as ApiError);

    expect(error.code).toBe("api_error");
    expect(error.message).toBe("Request failed with status 422");
    expect(error.isValidation).toBe(true);
  });

  it.each([
    [403, "isForbidden"],
    [404, "isNotFound"],
    [422, "isValidation"],
    [500, "isServerError"],
  ] as const)("status %i exposes the %s getter", async (status, getter) => {
    server.use(http.get(`${BASE}/status-check`, () => HttpResponse.json({ message: "x" }, { status })));

    const error = await apiClient.get("/status-check").catch((err: unknown) => err as ApiError);

    expect(error[getter]).toBe(true);
  });

  it("wraps network failures in ApiError with status 0", async () => {
    server.use(http.get(`${BASE}/offline`, () => HttpResponse.error()));

    const error = await apiClient.get("/offline").catch((err: unknown) => err as ApiError);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(error.code).toBe("network_error");
  });

  it("reports an aborted request as a network error", async () => {
    server.use(
      http.get(`${BASE}/slow`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return HttpResponse.json({});
      }),
    );
    const controller = new AbortController();
    const pending = apiClient.get("/slow", { signal: controller.signal }).catch((err: unknown) => err as ApiError);
    controller.abort();

    const error = await pending;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.code).toBe("network_error");
  });
});

describe("apiClient 401 handling", () => {
  it("clears the stored token, redirects to the logout URL and throws unauthorized", async () => {
    setToken("expired_token");
    server.use(http.get(`${BASE}/merchant/profile`, () => HttpResponse.json({ code: "expired" }, { status: 401 })));

    const error = await apiClient.get("/merchant/profile").catch((err: unknown) => err as ApiError);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.code).toBe("unauthorized");
    expect(error.isUnauthorized).toBe(true);
    expect(error.message).toBe("Session expired. Please log in again.");
    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.location.href).toBe(LOGOUT_URL);
  });

  it("does not redirect for other error statuses", async () => {
    setToken("still_valid");
    server.use(http.get(`${BASE}/merchant/profile`, () => HttpResponse.json({ message: "nope" }, { status: 403 })));

    await apiClient.get("/merchant/profile").catch(() => undefined);

    expect(sessionStorage.getItem(TOKEN_KEY)).toBe("still_valid");
    expect(window.location.href).toBe("http://localhost:3000/dashboard");
  });
});

describe("logout helper", () => {
  it("removes the token and sends the browser to the logout URL", () => {
    setToken("tok");

    logout();

    expect(sessionStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(window.location.href).toBe(LOGOUT_URL);
  });
});
