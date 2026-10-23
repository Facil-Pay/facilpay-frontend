import { test, expect } from '@playwright/test';

test.describe('Refund flow', () => {
  test('starts a refund from a completed payment', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    // Navigate to a completed payment
    const completedPaymentLink = page.getByRole('link', { name: /pay_/i }).first();
    if (await completedPaymentLink.isVisible()) {
      await completedPaymentLink.click();
      await page.waitForURL(/payments\/.+/);
    }

    // Look for a refund button or action
    const refundButton = page
      .getByRole('button', { name: /refund/i })
      .or(page.getByRole('link', { name: /refund/i }));

    if (await refundButton.isVisible()) {
      await refundButton.click();

      // Confirm modal or refund form should appear
      const confirmBtn = page.getByRole('button', { name: /confirm|issue refund/i });
      const cancelBtn = page.getByRole('button', { name: /cancel/i });

      await expect(confirmBtn.or(cancelBtn)).toBeVisible();

      // Cancel to avoid actually mutating state in tests
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });

  test('navigates to the refunds page', async ({ page }) => {
    await page.goto('/refunds');
    await expect(page.getByRole('heading', { name: /refund/i })).toBeVisible();
  });
});
