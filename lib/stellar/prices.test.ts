import { describe, expect, it } from 'vitest';
import { calculateTotalPortfolioUsd, DEFAULT_PRICE_FEEDS, getFiatEstimate } from './prices';

describe('Prices', () => {
  describe('getFiatEstimate', () => {
    it('calculates USD estimate for USDC correctly', () => {
      const est = getFiatEstimate('USDC', 100);
      expect(est.isUnavailable).toBe(false);
      expect(est.unitPrice).toBe(1.0);
      expect(est.totalFiat).toBe(100.0);
      expect(est.formatted).toContain('USD');
    });

    it('calculates EUR estimate when requested', () => {
      const est = getFiatEstimate('USDC', 100, 'EUR');
      expect(est.currency).toBe('EUR');
      expect(est.formatted).toContain('€');
    });

    it('handles unknown assets gracefully', () => {
      const est = getFiatEstimate('UNKNOWN_COIN', 50);
      expect(est.isUnavailable).toBe(true);
      expect(est.unitPrice).toBeNull();
      expect(est.totalFiat).toBeNull();
      expect(est.formatted).toBe('Price unavailable');
    });

    it('handles NaN amounts gracefully', () => {
      const est = getFiatEstimate('XLM', NaN);
      expect(est.isUnavailable).toBe(true);
    });
  });

  describe('calculateTotalPortfolioUsd', () => {
    it('sums portfolio USD correctly', () => {
      const balances = [
        { assetCode: 'USDC', totalBalance: 100 },
        { assetCode: 'XLM', totalBalance: 1000 },
      ];
      const result = calculateTotalPortfolioUsd(balances);
      const expectedTotal = 100 * 1.0 + 1000 * DEFAULT_PRICE_FEEDS.XLM;
      expect(result.totalUsd).toBeCloseTo(expectedTotal);
      expect(result.hasUnavailablePrices).toBe(false);
    });

    it('flags unavailable prices in portfolio', () => {
      const balances = [
        { assetCode: 'USDC', totalBalance: 50 },
        { assetCode: 'MYTOKEN', totalBalance: 10 },
      ];
      const result = calculateTotalPortfolioUsd(balances);
      expect(result.hasUnavailablePrices).toBe(true);
      expect(result.totalUsd).toBe(50);
    });
  });
});

