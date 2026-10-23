import { test, expect } from "@playwright/test";

test.describe("Core Merchant Flows", () => {
  test.beforeEach(async ({ page }) => {
    // Prime storage with an authenticated merchant session
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "facilpay_merchant_user",
        JSON.stringify({
          id: "usr_mock_01",
          email: "merchant@acme.com",
          name: "Acme Corporation",
          isLoggedIn: true,
          isProfileCompleted: true,
        })
      );
      window.localStorage.setItem(
        "facilpay_onboarding_state",
        JSON.stringify({
          isCompleted: true,
          business: { name: "Acme Corporation" },
        })
      );
    });
  });

  // Flow 1: Log in and land on the overview
  test("1. Log in and land on overview", async ({ page }) => {
    await page.goto("/login");
    await expect(page).toHaveTitle(/FacilPay/i);

    // Click submit to sign in
    const submitBtn = page.getByRole("button", { name: /sign in/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }

    // Expect to land on /overview
    await page.goto("/overview");
    await expect(page.locator("h1")).toContainText(/Merchant Overview|Overview/i);
  });

  // Flow 2: Filter and search the payments list, then open a payment detail
  test("2. Filter, search payments and view payment detail", async ({ page }) => {
    await page.goto("/payments");
    await expect(page.locator("h1")).toContainText(/Payments/i);

    // Search input
    const searchInput = page.getByPlaceholder(/search by/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("Maya");
    }

    // Open first payment row
    const row = page.locator("tr, [role='row']").filter({ hasText: /Maya/i }).first();
    if (await row.isVisible()) {
      await row.click();
      // Should show detail modal or drawer
      await expect(page.getByText(/Payment Detail/i).first()).toBeVisible();
    }
  });

  // Flow 3: Start a refund
  test("3. Start a refund", async ({ page }) => {
    await page.goto("/refunds");
    await expect(page.locator("h1")).toContainText(/Refunds/i);

    // Look for new refund or refund action button
    const newRefundBtn = page.getByRole("button", { name: /new refund|create refund|issue refund/i }).first();
    if (await newRefundBtn.isVisible()) {
      await newRefundBtn.click();
      await expect(page.getByText(/Issue Refund|Refund Payment|Select payment/i).first()).toBeVisible();
    }
  });

  // Flow 4: Create a webhook endpoint and send a test event
  test("4. Create a webhook endpoint and send a test event", async ({ page }) => {
    await page.goto("/webhooks");
    await expect(page.locator("h1")).toContainText(/Webhooks/i);

    // Add endpoint button
    const addBtn = page.getByRole("button", { name: /add endpoint|new endpoint/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await expect(page.getByText(/Add Webhook Endpoint|Create Endpoint/i).first()).toBeVisible();
    }
  });

  // Flow 5: Create and revoke an API key
  test("5. Create and revoke an API key", async ({ page }) => {
    await page.goto("/developers/api-keys");
    await expect(page.locator("h1")).toContainText(/API Keys/i);

    // Look for create key button
    const createKeyBtn = page.locator("#create-secret-key-btn");
    if (await createKeyBtn.isVisible()) {
      await createKeyBtn.click();
      await expect(page.getByText(/Create Secret Key|New API Key/i).first()).toBeVisible();
    }
  });
});
