import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';

/**
 * Accessibility checks for the main dashboard pages.
 *
 * Runs axe against WCAG 2.1 A/AA rules and fails on any serious or critical
 * violation, then exercises the core keyboard-only flows.
 */

const MAIN_PAGES = [
  '/overview',
  '/payments',
  '/refunds',
  '/analytics',
  '/customers',
  '/webhooks',
  '/developers/api-keys',
  '/settings/profile',
];

const BLOCKING_IMPACTS = new Set(['serious', 'critical']);

async function blockingViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    // Third-party dev overlays are not part of the product UI.
    .exclude('nextjs-portal')
    .analyze();
  return results.violations
    .filter((violation) => BLOCKING_IMPACTS.has(violation.impact ?? ''))
    .map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      targets: violation.nodes.slice(0, 5).map((node) => node.target.join(' ')),
    }));
}

test.describe('axe: no serious or critical violations', () => {
  for (const path of MAIN_PAGES) {
    test(`${path} (light)`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await blockingViolations(page)).toEqual([]);
    });

    test(`${path} (dark)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: 'dark' });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      expect(await blockingViolations(page)).toEqual([]);
    });
  }

  test('command palette dialog', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('combobox', { name: /search pages/i })).toBeVisible();
    expect(await blockingViolations(page)).toEqual([]);
  });
});

test.describe('keyboard-only flows', () => {
  test('skip link moves focus to the main content', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('every focusable element shows a visible focus indicator', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      const indicator = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return 'none';
        const style = window.getComputedStyle(el);
        const hasOutline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0;
        const hasRing = style.boxShadow !== 'none';
        return hasOutline || hasRing ? 'visible' : el.outerHTML.slice(0, 120);
      });
      expect(indicator, 'focused element has no outline or ring').not.toMatch(/^</);
    }
  });

  test('navigate with the command palette', async ({ page }) => {
    await page.goto('/overview');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('ControlOrMeta+k');
    await page.keyboard.type('refunds');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/refunds/);
  });

  test('filter payments and switch saved views by keyboard', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');

    await page.getByLabel('Status').selectOption('failed');
    await expect(page).toHaveURL(/status=failed/);
    await expect(page.getByRole('tab', { name: 'Failed' })).toHaveAttribute('aria-selected', 'true');

    await page.getByRole('tab', { name: 'Failed' }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.getByRole('tab', { name: 'Refunded' })).toBeFocused();
    await expect(page).toHaveURL(/status=refunded/);

    await page.keyboard.press('Home');
    await expect(page).not.toHaveURL(/status=/);
  });

  test('save a view and restore it from the URL', async ({ page }) => {
    await page.goto('/payments?asset=USDC&sort=amount_desc');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: 'Save view' }).click();
    await page.getByLabel('View name').fill('Large USDC');
    await page.keyboard.press('Enter');

    await page.getByRole('tab', { name: 'All' }).click();
    await expect(page).not.toHaveURL(/asset=/);

    await page.getByRole('tab', { name: 'Large USDC' }).click();
    await expect(page).toHaveURL(/asset=USDC&sort=amount_desc/);
  });

  test('open and close a dialog without a mouse', async ({ page }) => {
    await page.goto('/payments');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: 'Save view' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Save view' })).toBeFocused();
  });
});
