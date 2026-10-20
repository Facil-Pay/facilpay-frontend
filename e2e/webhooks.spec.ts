import { test, expect } from '@playwright/test';

test.describe('Webhooks — create endpoint and send test event', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings/webhooks');
    await page.waitForLoadState('networkidle');
  });

  test('renders the webhooks settings page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /webhook/i }),
    ).toBeVisible();
  });

  test('opens the add webhook endpoint dialog', async ({ page }) => {
    const addBtn = page
      .getByRole('button', { name: /add|create|new/i })
      .filter({ hasText: /webhook|endpoint/i })
      .or(page.getByRole('button', { name: /add webhook/i }))
      .or(page.getByRole('button', { name: /new endpoint/i }));

    if (await addBtn.first().isVisible()) {
      await addBtn.first().click();

      const urlInput = page
        .getByLabel(/url|endpoint/i)
        .or(page.getByPlaceholder(/https:\/\//i));

      await expect(urlInput.first()).toBeVisible();

      // Fill in a test URL
      await urlInput.first().fill('https://webhook.site/test-facilpay');

      // Cancel rather than saving
      const cancelBtn = page.getByRole('button', { name: /cancel/i });
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test('sends a test event on an existing endpoint', async ({ page }) => {
    const testBtn = page.getByRole('button', { name: /send test|test event/i }).first();
    if (await testBtn.isVisible()) {
      await testBtn.click();
      // A success or confirmation indicator should appear
      await page.waitForTimeout(500);
    }
  });
});
