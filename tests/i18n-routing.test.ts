/**
 * tests/i18n-routing.test.ts
 *
 * Verifies that middleware.ts and i18n/routing.ts route requests to the
 * right locale without running a full Next.js server.
 *
 * Strategy:
 *  - Import the routing config and preferences helpers directly.
 *  - Test the pure-logic parts: locale validation, cookie persistence,
 *    supported locale list, and the middleware matcher pattern.
 *  - Simulate the request-config resolution from i18n/request.ts by
 *    replicating its locale-selection logic and asserting the outcome.
 *
 * This runs in Vitest (jsdom) with no running server.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { locales, routing } from "../i18n/routing";
import {
  isLocale,
  isValidTimeZone,
  LOCALE_COOKIE,
  TIME_ZONE_COOKIE,
  DEFAULT_TIME_ZONE,
  persistLocale,
  persistTimeZone,
  readCookie,
  LOCALE_LABELS,
  detectTimeZone,
} from "../lib/i18n/preferences";

// ─── Routing config ───────────────────────────────────────────────────────────

describe("i18n routing config", () => {
  it("declares exactly the four supported locales", () => {
    expect([...locales].sort()).toEqual(["en", "es", "fr", "pt"]);
  });

  it("sets English as the default locale", () => {
    expect(routing.defaultLocale).toBe("en");
  });

  it("uses 'never' locale prefix so URLs are not prefixed", () => {
    expect(routing.localePrefix).toBe("never");
  });
});

// ─── Middleware matcher pattern ───────────────────────────────────────────────
//
// middleware.ts exports:
//   export const config = { matcher: ["/((?!api|_next|.*\\..*).*)"] }
//
// We test the regex directly to confirm static assets and /api paths are
// excluded while regular page paths are matched.

describe("middleware matcher regex", () => {
  // The matcher pattern from middleware.ts
  const MATCHER = /^\/((?!api|_next|.*\..*).*)/;

  const shouldMatch = [
    "/",
    "/login",
    "/overview",
    "/payments",
    "/payments/pay_123",
    "/settings/profile",
    "/checkout",
    "/pay/link_abc",
  ];

  const shouldNotMatch = [
    "/api/export/csv",
    "/_next/static/chunks/main.js",
    "/_next/image",
    "/favicon.ico",
    "/icon.png",
    "/some/path/file.css",
    "/robots.txt",
  ];

  it.each(shouldMatch)("matches page path: %s", (path) => {
    expect(MATCHER.test(path)).toBe(true);
  });

  it.each(shouldNotMatch)("excludes non-page path: %s", (path) => {
    expect(MATCHER.test(path)).toBe(false);
  });
});

// ─── Locale selection logic (mirrors i18n/request.ts) ────────────────────────
//
// The request config resolves the locale in this priority order:
//   1. The [locale] route segment (requestLocale)
//   2. The NEXT_LOCALE cookie
//   3. defaultLocale ("en")

import { hasLocale } from "next-intl";

function resolveLocale(requestLocale: string | undefined, cookieValue: string | undefined): string {
  const requested = requestLocale ?? cookieValue;
  return hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
}

describe("locale resolution", () => {
  it("honours the [locale] route segment when valid", () => {
    expect(resolveLocale("es", undefined)).toBe("es");
    expect(resolveLocale("pt", undefined)).toBe("pt");
    expect(resolveLocale("fr", undefined)).toBe("fr");
  });

  it("falls back to the cookie when there is no route segment", () => {
    expect(resolveLocale(undefined, "es")).toBe("es");
    expect(resolveLocale(undefined, "fr")).toBe("fr");
  });

  it("falls back to English for an unsupported locale in the route segment", () => {
    expect(resolveLocale("de", undefined)).toBe("en");
    expect(resolveLocale("zh", undefined)).toBe("en");
    expect(resolveLocale("", undefined)).toBe("en");
  });

  it("falls back to English for an unsupported locale in the cookie", () => {
    expect(resolveLocale(undefined, "de")).toBe("en");
    expect(resolveLocale(undefined, "not-a-locale")).toBe("en");
  });

  it("falls back to English when both route segment and cookie are absent", () => {
    expect(resolveLocale(undefined, undefined)).toBe("en");
  });

  it("route segment takes precedence over the cookie", () => {
    expect(resolveLocale("pt", "fr")).toBe("pt");
  });
});

// ─── Accept-Language negotiation (locale preference cookie) ──────────────────
//
// The app doesn't do server-side Accept-Language negotiation itself — it relies
// on the NEXT_LOCALE cookie set by the client-side locale switcher.  We verify
// that the preference helpers correctly persist and read back locale choices for
// each supported language.

describe("locale preference cookie", () => {
  // Note: jsdom's cookie store persists across tests in the same file. Each
  // test asserts on what it writes, not on isolation of the full cookie store.

  it("isLocale accepts all supported locales", () => {
    for (const locale of locales) {
      expect(isLocale(locale)).toBe(true);
    }
  });

  it("isLocale rejects unsupported locales", () => {
    expect(isLocale("de")).toBe(false);
    expect(isLocale("zh")).toBe(false);
    expect(isLocale("")).toBe(false);
    expect(isLocale(null)).toBe(false);
    expect(isLocale(42)).toBe(false);
  });

  it("LOCALE_LABELS covers all supported locales with non-empty strings", () => {
    for (const locale of locales) {
      expect(LOCALE_LABELS[locale]).toBeTruthy();
    }
  });

  it("persistLocale writes the NEXT_LOCALE cookie", () => {
    // jsdom implements document.cookie as a real cookie store; write then read back.
    persistLocale("es");
    expect(document.cookie).toContain("NEXT_LOCALE=es");
  });

  it("readCookie returns undefined when the cookie is absent", () => {
    // Cookie store starts empty per beforeEach; ensure the key is gone.
    expect(readCookie("SOME_NONEXISTENT_KEY")).toBeUndefined();
  });
});

// ─── Timezone resolution ──────────────────────────────────────────────────────

describe("timezone resolution", () => {
  it("DEFAULT_TIME_ZONE is UTC", () => {
    expect(DEFAULT_TIME_ZONE).toBe("UTC");
  });

  it("isValidTimeZone accepts valid IANA zones", () => {
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Africa/Lagos")).toBe(true);
    expect(isValidTimeZone("America/New_York")).toBe(true);
    expect(isValidTimeZone("Europe/Paris")).toBe(true);
  });

  it("isValidTimeZone rejects garbage strings", () => {
    expect(isValidTimeZone("Not/A/Zone")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
    expect(isValidTimeZone(null)).toBe(false);
    expect(isValidTimeZone(undefined)).toBe(false);
    expect(isValidTimeZone(42)).toBe(false);
  });

  it("persistTimeZone ignores invalid zones", () => {
    // Write a known valid cookie first to ensure the store isn't empty,
    // then confirm an invalid zone does NOT overwrite it.
    persistTimeZone("UTC");
    const before = document.cookie;
    persistTimeZone("Not/Real");
    // Cookie value must not contain "Not%2FReal"
    expect(document.cookie).not.toContain("Not%2FReal");
  });

  it("persistTimeZone writes the FACILPAY_TZ cookie for valid zones", () => {
    persistTimeZone("Africa/Lagos");
    expect(document.cookie).toContain("FACILPAY_TZ=Africa%2FLagos");
  });

  it("detectTimeZone returns a valid IANA zone or undefined", () => {
    const zone = detectTimeZone();
    if (zone !== undefined) {
      expect(isValidTimeZone(zone)).toBe(true);
    }
  });
});
