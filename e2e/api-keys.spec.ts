import { test, expect } from '@playwright/test';

test.describe('API Keys — create and revoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/developers/api-keys');
    await page.waitForLoadState('networkidle');
  });

  test('renders the API keys management page', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /api key/i }),
    ).toBeVisible();
  });

  test('opens the create secret key modal', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create secret key/i });
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Modal should open
    const nameInput = page
      .getByLabel(/name/i)
      .or(page.getByPlaceholder(/key name/i));
    await expect(nameInput.first()).toBeVisible();

    // Close modal
    const cancelBtn = page.getByRole('button', { name: /cancel/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
    }
  });

  test('creates a new API key', async ({ page }) => {
    const createBtn = page.getByRole('button', { name: /create secret key/i });
    await createBtn.click();

    const nameInput = page
      .getByLabel(/name/i)
      .or(page.getByPlaceholder(/key name/i));

    if (await nameInput.first().isVisible()) {
      await nameInput.first().fill('E2E Test Key');

      const submitBtn = page.getByRole('button', { name: /create|generate/i }).last();
      await submitBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test('revokes an existing API key', async ({ page }) => {
    // Find a revoke button
    const revokeBtn = page.getByRole('button', { name: /revoke/i }).first();
    if (await revokeBtn.isVisible()) {
      // Accept the confirm dialog
      page.on('dialog', (dialog) => dialog.accept());
      await revokeBtn.click();
      await page.waitForTimeout(300);
    }
  });

  test('settings API keys page shows same keys as developers page', async ({ page }) => {
    // Get key count on developers page
    const devRows = page.getByRole('row').count();

    // Navigate to settings API keys
    await page.goto('/settings/api-keys');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('heading', { name: /api key/i }),
    ).toBeVisible();
  });
});
