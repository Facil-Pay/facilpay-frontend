import { describe, expect, it } from 'vitest';
import { StrKey } from './strkey';

describe('StrKey', () => {
  const validGAddress = 'GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF';
  const validMAddress = 'MA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVAAAAAAAAAAAAAJLK';

  describe('isValidEd25519PublicKey', () => {
    it('returns true for a valid G address', () => {
      expect(StrKey.isValidEd25519PublicKey(validGAddress)).toBe(true);
    });

    it('returns false for invalid addresses', () => {
      expect(StrKey.isValidEd25519PublicKey('')).toBe(false);
      expect(StrKey.isValidEd25519PublicKey(null)).toBe(false);
      expect(StrKey.isValidEd25519PublicKey(undefined)).toBe(false);
      expect(StrKey.isValidEd25519PublicKey('G123')).toBe(false);
      // Wrong prefix
      expect(StrKey.isValidEd25519PublicKey('SAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF')).toBe(false);
      // Checksum corrupted
      const corrupted = validGAddress.slice(0, -2) + 'ZZ';
      expect(StrKey.isValidEd25519PublicKey(corrupted)).toBe(false);
    });
  });

  describe('isValidMuxedAccount', () => {
    it('returns true for a valid M address', () => {
      expect(StrKey.isValidMuxedAccount(validMAddress)).toBe(true);
    });

    it('returns false for non-M or invalid addresses', () => {
      expect(StrKey.isValidMuxedAccount(validGAddress)).toBe(false);
      expect(StrKey.isValidMuxedAccount('')).toBe(false);
      expect(StrKey.isValidMuxedAccount('M123')).toBe(false);
    });
  });

  describe('truncateAddress', () => {
    it('truncates address correctly', () => {
      expect(StrKey.truncateAddress(validGAddress)).toBe('GAAA...AWHF');
      expect(StrKey.truncateAddress('short')).toBe('short');
      expect(StrKey.truncateAddress('')).toBe('');
    });
  });
});
