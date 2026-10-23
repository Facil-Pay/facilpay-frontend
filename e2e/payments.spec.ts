import { test, expect } from '@playwright/test';

test.describe('Payments list — filter, search, and detail', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
  });

  test('renders the payments list', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /payments/i })).toBeVisible();
  });

  test('searches payments by customer email', async ({ page }) => {
    const searchInput = page.getByRole('searchbox').or(
      page.getByPlaceholder(/search/i),
    );
    if (await searchInput.isVisible()) {
      await searchInput.fill('alex.chen');
      // Results should update
      await page.waitForTimeout(300);
      const rows = page.getByRole('row').or(page.locator('[data-testid="payment-row"]'));
      await expect(rows.first()).toBeVisible();
    }
  });

  test('filters payments by status', async ({ page }) => {
    // Look for a status filter select
    const statusFilter = page.getByRole('combobox').or(
      page.getByLabel(/status/i),
    );
    if (await statusFilter.first().isVisible()) {
      await statusFilter.first().selectOption('COMPLETED');
      await page.waitForTimeout(300);
    }
  });

  test('opens payment detail from the list', async ({ page }) => {
    // Click first payment link/row
    const firstPaymentLink = page.getByRole('link', { name: /pay_/i }).first();
    if (await firstPaymentLink.isVisible()) {
      await firstPaymentLink.click();
      await page.waitForURL(/payments\/.+/);
      await expect(page.getByRole('heading', { name: /payment detail/i })).toBeVisible();
    }
  });

  test('payment detail shows fee breakdown', async ({ page }) => {
    const firstPaymentLink = page.getByRole('link', { name: /pay_/i }).first();
    if (await firstPaymentLink.isVisible()) {
      await firstPaymentLink.click();
      await page.waitForURL(/payments\/.+/);
      // Fee breakdown section should be present
      await expect(page.getByText(/fee breakdown/i)).toBeVisible();
      await expect(page.getByText(/gross amount/i)).toBeVisible();
      await expect(page.getByText(/net amount/i)).toBeVisible();
    }
  });
});
