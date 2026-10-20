/**
 * playwright/a11y.config.ts
 *
 * Accessibility testing configuration for E2E suite using axe-core.
 * Validates WCAG 2.1 AA compliance on main pages.
 */

import { defineConfig, devices } from "@playwright/test";

export const A11Y_TEST_CONFIG = {
  /**
   * Pages to test for accessibility violations
   */
  pages: [
    "/",
    "/payments",
    "/refunds",
    "/payouts",
    "/api-keys",
  ],

  /**
   * axe-core rules to run
   * See: https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md
   */
  rules: {
    "color-contrast": true,
    "label": true,
    "aria-required-attr": true,
    "aria-hidden-focus": true,
    "button-name": true,
    "form-field-multiple-labels": true,
    "image-alt": true,
    "input-image-alt": true,
    "link-name": true,
    "aria-aria-hidden-body": true,
  },

  /**
   * Severity levels to fail on
   */
  reportFailureLevel: "serious", // 'minor' | 'moderate' | 'serious' | 'critical'

  /**
   * Screenshot on failure
   */
  screenshotOnFailure: true,
};

export default defineConfig({
  testDir: "./tests/a11y",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { outputFolder: "test-results/a11y" }],
    ["json", { outputFile: "test-results/a11y/results.json" }],
  ],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
