import { StrKey } from '../lib/stellar/strkey';
import { isFederationAddress, resolveFederationAddress } from '../lib/stellar/federation';
import { isKnownExchangeAddress, getExchangeDetails } from '../lib/stellar/exchanges';
import { CONFIGURABLE_ANCHORS, createSep24Session } from '../lib/sep24/anchors';

describe('Payouts and Withdrawals Specification', () => {
  describe('StrKey.isValidEd25519PublicKey Validation', () => {
    test('validates authentic Stellar public keys', () => {
      // Real valid Stellar testnet / public keys
      const validKey1 = 'GDVO3CBDR37KRZFG5MKF5DKMMC5CXHPKMCQO3IAUU7MWW7IE4MP2SZLI'; // 56 chars, valid checksum
      const validKey2 = 'GCFVJDKWXTKVSZGY5FWTXEGXV7APNPWFY7YXKIGEKODQK6G65GWRRAZA'; // 56 chars, valid checksum

      expect(StrKey.isValidEd25519PublicKey(validKey1)).toBe(true);
      expect(StrKey.isValidEd25519PublicKey(validKey2)).toBe(true);
    });

    test('rejects keys with invalid lengths or non-G prefixes', () => {
      expect(StrKey.isValidEd25519PublicKey('')).toBe(false);
      expect(StrKey.isValidEd25519PublicKey('GDYTYQZ72P7M')).toBe(false); // too short
      expect(StrKey.isValidEd25519PublicKey('SDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A')).toBe(false); // Secret seed 'S'
      expect(StrKey.isValidEd25519PublicKey(null)).toBe(false);
      expect(StrKey.isValidEd25519PublicKey(12345)).toBe(false);
    });

    test('rejects keys with checksum corruption or invalid Base32 characters', () => {
      // Corrupt last character
      const corruptedKey = 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7B';
      expect(StrKey.isValidEd25519PublicKey(corruptedKey)).toBe(false);

      // Invalid character (8, 9, 0, 1 are not in RFC 4648 Base32 alphabet except 2-7)
      const invalidCharKey = 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E89';
      expect(StrKey.isValidEd25519PublicKey(invalidCharKey)).toBe(false);
    });
  });

  describe('Federation Address Resolution (SEP-2)', () => {
    test('identifies valid federation address syntax', () => {
      expect(isFederationAddress('merchant*facilpay.io')).toBe(true);
      expect(isFederationAddress('deposit*binance.com')).toBe(true);
      expect(isFederationAddress('notafederationaddress')).toBe(false);
      expect(isFederationAddress('missingdomain*')).toBe(false);
      expect(isFederationAddress('*missinguser.com')).toBe(false);
    });

    test('resolves known federation addresses to account ID and memo', async () => {
      const record = await resolveFederationAddress('deposit*binance.com');
      expect(record).not.toBeNull();
      expect(record?.account_id).toBe('GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG');
      expect(record?.memo).toBe('109283741');
      expect(record?.isExchange).toBe(true);
      expect(record?.exchangeName).toBe('Binance');
    });

    test('resolves FacilPay merchant federation address', async () => {
      const record = await resolveFederationAddress('merchant*facilpay.io');
      expect(record).not.toBeNull();
      expect(record?.account_id).toBe('GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A');
    });
  });

  describe('Known Exchange Address & Memo Detection', () => {
    test('flags Binance pooled hot wallet as requiring a memo', () => {
      const binanceAddress = 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG';
      expect(isKnownExchangeAddress(binanceAddress)).toBe(true);

      const details = getExchangeDetails(binanceAddress);
      expect(details?.name).toBe('Binance');
      expect(details?.memoRequired).toBe(true);
    });

    test('flags Coinbase address as requiring a memo', () => {
      const coinbaseAddress = 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV';
      expect(isKnownExchangeAddress(coinbaseAddress)).toBe(true);

      const details = getExchangeDetails(coinbaseAddress);
      expect(details?.name).toBe('Coinbase');
      expect(details?.memoRequired).toBe(true);
    });

    test('returns null for generic self-custody cold wallets', () => {
      const normalWallet = 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A';
      expect(isKnownExchangeAddress(normalWallet)).toBe(false);
      expect(getExchangeDetails(normalWallet)).toBeNull();
    });
  });

  describe('SEP-24 Interactive Off-Ramp Protocol', () => {
    test('configurable anchor list includes major regulated anchors', () => {
      expect(CONFIGURABLE_ANCHORS.length).toBeGreaterThanOrEqual(4);
      const anchorIds = CONFIGURABLE_ANCHORS.map((a) => a.id);
      expect(anchorIds).toContain('moneygram');
      expect(anchorIds).toContain('anclap');
      expect(anchorIds).toContain('yellowcard');
    });

    test('creates interactive withdrawal session with correct parameters', () => {
      const anclap = CONFIGURABLE_ANCHORS.find((a) => a.id === 'anclap')!;
      const session = createSep24Session(anclap, {
        amount: 5000,
        asset: 'USDC',
      });

      expect(session.transaction.id).toContain('sep24_anclap_');
      expect(session.transaction.status).toBe('incomplete');
      expect(session.transaction.amountIn).toBe(5000);
      expect(session.transaction.feeAmount).toBeGreaterThan(0);
      expect(session.transaction.amountOut).toBe(5000 - session.transaction.feeAmount);
      expect(session.interactiveUrl).toContain('asset_code=USDC');
      expect(session.interactiveUrl).toContain('amount=5000');
    });
  });
});
