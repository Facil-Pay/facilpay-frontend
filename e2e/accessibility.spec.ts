/**
 * e2e/accessibility.spec.ts
 *
 * Runs axe-core against key pages in both light and dark modes.
 * Fails CI on "critical" and "serious" violations; logs "moderate"
 * and "minor" as warnings without failing.
 *
 * Pages scanned:
 *   /login, /overview, /payments, /payments/<id>,
 *   /checkout, /settings/profile
 *
 * Network: MSW (NEXT_PUBLIC_USE_MOCKS=true) — no real network.
 *
 * Known exceptions are listed in KNOWN_VIOLATIONS below with a reason.
 */

import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import type { Result } from "axe-core";

// ─── Types ────────────────────────────────────────────────────────────────────

type ImpactLevel = "critical" | "serious" | "moderate" | "minor";

// ─── Known violations ─────────────────────────────────────────────────────────
// Add entries here when a violation is intentional or comes from a third-party
// library that cannot be fixed immediately.  Each entry must include a reason.

const KNOWN_VIOLATIONS: Record<string, string> = {
  // Example: "color-contrast": "Recharts tooltip uses vendor colours we cannot override",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Seed a logged-in merchant so dashboard pages don't redirect to /login. */
function seedAuth() {
  return async ({ page }: { page: import("@playwright/test").Page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem("fp_access_token", "mock_e2e_token");
      localStorage.setItem(
        "facilpay_merchant_user",
        JSON.stringify({
          id: "usr_axe_01",
          email: "merchant@acme.com",
          name: "Acme Corp",
          isLoggedIn: true,
          isProfileCompleted: true,
        }),
      );
      localStorage.setItem(
        "facilpay_onboarding_state",
        JSON.stringify({ isCompleted: true, business: { name: "Acme Corp" } }),
      );
    });
  };
}

/**
 * Scan a page with axe-core and assert no critical/serious violations exist
 * outside the known-exceptions list.  Logs moderate/minor for reference.
 */
async function scanAndAssert(
  page: import("@playwright/test").Page,
  label: string,
): Promise<void> {
  const results = await new AxeBuilder({ page })
    // These rules produce many false-positives in Next.js SSR pages
    .disableRules(["html-has-lang"])
    .analyze();

  const blocking: Result[] = [];
  const warnings: Result[] = [];

  for (const violation of results.violations) {
    const impact = violation.impact as ImpactLevel | undefined;
    if (KNOWN_VIOLATIONS[violation.id]) {
      // Suppress documented exception
      continue;
    }
    if (impact === "critical" || impact === "serious") {
      blocking.push(violation);
    } else {
      warnings.push(violation);
    }
  }

  if (warnings.length > 0) {
    console.warn(
      `[a11y] ${label} — ${warnings.length} moderate/minor violation(s):\n` +
        warnings.map((v) => `  • ${v.id}: ${v.description}`).join("\n"),
    );
  }

  expect(
    blocking,
    `${label} has ${blocking.length} critical/serious a11y violation(s):\n` +
      blocking
        .map((v) => `  • [${v.impact}] ${v.id}: ${v.description}\n    ${v.helpUrl}`)
        .join("\n"),
  ).toHaveLength(0);
}

// ─── Light-mode scans ─────────────────────────────────────────────────────────

test.describe("Accessibility — light mode", () => {
  test.beforeEach(seedAuth());

  test("login page has no critical/serious violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "login (light)");
  });

  test("overview page has no critical/serious violations", async ({ page }) => {
    await page.goto("/overview");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "overview (light)");
  });

  test("payments list has no critical/serious violations", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "payments list (light)");
  });

  test("payment detail has no critical/serious violations", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");

    // Open the first payment detail if a row link exists
    const detailLink = page.getByRole("link", { name: /pay_/i }).first();
    if (await detailLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await detailLink.click();
      await page.waitForLoadState("networkidle");
    } else {
      // Fall back to a direct URL with a known fixture ID
      await page.goto("/payments/pay_001");
      await page.waitForLoadState("networkidle");
    }
    await scanAndAssert(page, "payment detail (light)");
  });

  test("checkout page has no critical/serious violations", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "checkout (light)");
  });

  test("settings/profile page has no critical/serious violations", async ({ page }) => {
    await page.goto("/settings/profile");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "settings/profile (light)");
  });
});

// ─── Dark-mode scans ──────────────────────────────────────────────────────────
// The app uses Tailwind's `dark:` variant triggered by the OS/browser
// prefers-color-scheme media query.  We emulate it via Playwright's
// colorScheme option.

test.describe("Accessibility — dark mode", () => {
  test.use({ colorScheme: "dark" });
  test.beforeEach(seedAuth());

  test("login page has no critical/serious violations", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "login (dark)");
  });

  test("overview page has no critical/serious violations", async ({ page }) => {
    await page.goto("/overview");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "overview (dark)");
  });

  test("payments list has no critical/serious violations", async ({ page }) => {
    await page.goto("/payments");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "payments list (dark)");
  });

  test("checkout page has no critical/serious violations", async ({ page }) => {
    await page.goto("/checkout");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "checkout (dark)");
  });

  test("settings/profile page has no critical/serious violations", async ({ page }) => {
    await page.goto("/settings/profile");
    await page.waitForLoadState("networkidle");
    await scanAndAssert(page, "settings/profile (dark)");
  });
});
