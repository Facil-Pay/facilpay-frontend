import { describe, expect, it } from 'vitest';
import { calculateXlmReserve, HorizonAccountResponse, parseHorizonBalances } from './horizon';

describe('Horizon', () => {
  describe('calculateXlmReserve', () => {
    it('calculates reserve correctly for basic account', () => {
      // 2 base reserves (2 * 0.5 = 1.0 XLM)
      const reserve = calculateXlmReserve(10, 0, 0);
      expect(reserve.total).toBe(10);
      expect(reserve.minReserve).toBe(1.0);
      expect(reserve.available).toBe(9.0);
    });

    it('accounts for subentries and selling liabilities', () => {
      // 2 base + 2 subentries = 4 * 0.5 = 2.0 XLM + 0.5 liabilities = 2.5 XLM min reserve
      const reserve = calculateXlmReserve(10, 2, 0.5);
      expect(reserve.minReserve).toBe(2.5);
      expect(reserve.available).toBe(7.5);
    });
  });

  describe('parseHorizonBalances', () => {
    it('parses native and credit balances and orders native XLM first', () => {
      const mockAccount: HorizonAccountResponse = {
        id: 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV',
        sequence: '1000',
        subentry_count: 1,
        balances: [
          {
            asset_type: 'credit_alphanum4',
            asset_code: 'USDC',
            asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
            balance: '50.0000000',
            limit: '1000.0000000',
          },
          {
            asset_type: 'native',
            balance: '100.0000000',
          },
        ],
      };

      const parsed = parseHorizonBalances(mockAccount);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].assetCode).toBe('XLM');
      expect(parsed[0].isNative).toBe(true);
      expect(parsed[0].totalBalance).toBe(100);
      expect(parsed[0].reserveDetails).toBeDefined();

      expect(parsed[1].assetCode).toBe('USDC');
      expect(parsed[1].isNative).toBe(false);
      expect(parsed[1].totalBalance).toBe(50);
      expect(parsed[1].limit).toBe('1000.0000000');
    });
  });
});

