import { test, expect } from '@playwright/test';

test.describe('Authentication flow', () => {
  test('logs in and lands on the overview dashboard', async ({ page }) => {
    await page.goto('/');

    // The app should redirect to sign-in when not authenticated
    await page.waitForURL(/sign-in|login|overview/);

    // If redirected to sign-in, fill credentials
    if (page.url().includes('sign-in') || page.url().includes('login')) {
      await page.getByLabel(/email/i).fill('merchant@facilpay.io');
      await page.getByLabel(/password/i).fill('testpassword');
      await page.getByRole('button', { name: /sign in|log in/i }).click();
    }

    // Should land on overview
    await page.waitForURL(/overview|dashboard/);
    await expect(page).toHaveURL(/overview|dashboard/);

    // Overview page should show key metrics
    await expect(page.getByRole('main')).toBeVisible();
  });
});
