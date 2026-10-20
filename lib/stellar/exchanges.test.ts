import { describe, expect, it } from 'vitest';
import { getExchangeDetails, isKnownExchangeAddress, KNOWN_EXCHANGE_ADDRESSES } from './exchanges';

describe('exchanges', () => {
  const binanceAddress = 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG';
  const coinbaseAddress = 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV';

  describe('getExchangeDetails', () => {
    it('returns exchange info for a known Binance address', () => {
      const info = getExchangeDetails(binanceAddress);
      expect(info).not.toBeNull();
      expect(info?.name).toBe('Binance');
      expect(info?.memoRequired).toBe(true);
    });

    it('returns exchange info for a known Coinbase address', () => {
      const info = getExchangeDetails(coinbaseAddress);
      expect(info).not.toBeNull();
      expect(info?.name).toBe('Coinbase');
    });

    it('returns null for an unknown address', () => {
      expect(getExchangeDetails('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF')).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(getExchangeDetails('')).toBeNull();
    });

    it('matches by federation domain containing binance', () => {
      const info = getExchangeDetails('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', 'binance.com');
      expect(info).not.toBeNull();
      expect(info?.name).toBe('Binance');
    });

    it('matches by federation domain containing coinbase', () => {
      const info = getExchangeDetails('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', 'coinbase.com');
      expect(info).not.toBeNull();
      expect(info?.name).toBe('Coinbase');
    });

    it('returns null for an unrecognized federation domain', () => {
      const info = getExchangeDetails('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', 'unknown-exchange.io');
      expect(info).toBeNull();
    });

    it('trims whitespace from the address before lookup', () => {
      const info = getExchangeDetails(`  ${binanceAddress}  `);
      expect(info).not.toBeNull();
      expect(info?.name).toBe('Binance');
    });
  });

  describe('isKnownExchangeAddress', () => {
    it('returns true for a known exchange address', () => {
      expect(isKnownExchangeAddress(binanceAddress)).toBe(true);
    });

    it('returns false for an unknown address', () => {
      expect(isKnownExchangeAddress('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(isKnownExchangeAddress('')).toBe(false);
    });

    it('returns true when matched by federation domain', () => {
      expect(isKnownExchangeAddress('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF', 'kraken.com')).toBe(true);
    });
  });

  describe('KNOWN_EXCHANGE_ADDRESSES', () => {
    it('has at least 3 entries', () => {
      expect(Object.keys(KNOWN_EXCHANGE_ADDRESSES).length).toBeGreaterThanOrEqual(3);
    });

    it('all entries have required fields', () => {
      for (const info of Object.values(KNOWN_EXCHANGE_ADDRESSES)) {
        expect(typeof info.name).toBe('string');
        expect(typeof info.website).toBe('string');
        expect(typeof info.memoRequired).toBe('boolean');
        expect(typeof info.memoTypeDescription).toBe('string');
      }
    });
  });
});
