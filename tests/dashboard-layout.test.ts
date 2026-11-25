import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_DASHBOARD_LAYOUT,
  getDashboardLayout,
  saveDashboardLayout,
  STORAGE_KEYS,
  type DashboardLayout,
} from '../lib/storage';

afterEach(() => {
  localStorage.clear();
});

describe('dashboard layout storage', () => {
  it('persists layouts separately for each user', () => {
    const customLayout: DashboardLayout = {
      order: [...DEFAULT_DASHBOARD_LAYOUT.order].reverse(),
      hidden: ['stats'],
    };

    saveDashboardLayout('merchant-1', customLayout);

    expect(getDashboardLayout('merchant-1')).toEqual(customLayout);
    expect(getDashboardLayout('merchant-2')).toEqual(DEFAULT_DASHBOARD_LAYOUT);
  });

  it('drops unknown entries and restores missing widgets from a stored layout', () => {
    localStorage.setItem(
      `${STORAGE_KEYS.DASHBOARD_LAYOUT}_merchant`,
      JSON.stringify({ order: ['stats', 'unknown'], hidden: ['recentPayments', 'unknown'] })
    );

    expect(getDashboardLayout('merchant')).toEqual({
      order: ['stats', 'gettingStarted', 'paymentLink', 'recentPayments', 'integrations'],
      hidden: ['recentPayments'],
    });
  });
});
