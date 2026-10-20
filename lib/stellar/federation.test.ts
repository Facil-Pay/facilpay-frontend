import { describe, expect, it, vi, beforeEach } from 'vitest';
import { isFederationAddress, resolveFederationAddress } from './federation';

describe('Federation', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('isFederationAddress', () => {
    it('identifies valid federation addresses', () => {
      expect(isFederationAddress('alice*example.com')).toBe(true);
      expect(isFederationAddress('merchant*facilpay.io')).toBe(true);
    });

    it('rejects invalid federation addresses', () => {
      expect(isFederationAddress('')).toBe(false);
      expect(isFederationAddress('nodomain*')).toBe(false);
      expect(isFederationAddress('*example.com')).toBe(false);
      expect(isFederationAddress('alice@example.com')).toBe(false);
      expect(isFederationAddress('alice*example*com')).toBe(false);
    });
  });

  describe('resolveFederationAddress', () => {
    it('resolves built-in registry addresses offline', async () => {
      const result = await resolveFederationAddress('merchant*facilpay.io');
      expect(result).not.toBeNull();
      expect(result?.stellar_address).toBe('merchant*facilpay.io');
      expect(result?.memo).toBe('FP-MERCH-01');
    });

    it('resolves online federation with mocked fetch', async () => {
      const mockAccount = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ account_id: mockAccount, memo: '12345', memo_type: 'id' }),
      } as any);

      const result = await resolveFederationAddress('user*customdomain.org');
      expect(result).not.toBeNull();
      expect(result?.account_id).toBe(mockAccount);
      expect(result?.memo).toBe('12345');
      expect(result?.memo_type).toBe('id');
    });

    it('returns null for syntactically invalid federation addresses', async () => {
      const result = await resolveFederationAddress('invalid-address-without-star');
      expect(result).toBeNull();
    });
  });
});
