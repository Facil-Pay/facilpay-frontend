import { describe, it, expect } from 'vitest';
import {
  DEMO_MULTISIG_ACCOUNT,
  DEMO_MULTISIG_SIGNERS,
  DEMO_MULTISIG_THRESHOLDS,
  getMultisigAccountConfig,
  initializeMultisigPayout,
  signMultisigPayout,
  isPayoutExpired,
  getExpirationMessage,
  getMultisigProgress,
} from '../lib/stellar/multisig';
import { Payout } from '../lib/types';

describe('Stellar Multi-Signature Accounts and Payouts Specification', () => {
  describe('Account Signers and Thresholds Configuration', () => {
    it('correctly configures a 2-of-3 multi-signature treasury account', () => {
      const config = getMultisigAccountConfig(
        DEMO_MULTISIG_ACCOUNT,
        DEMO_MULTISIG_SIGNERS,
        DEMO_MULTISIG_THRESHOLDS
      );

      expect(config.isMultisig).toBe(true);
      expect(config.requiredPayoutThreshold).toBe(2);
      expect(config.totalSignerWeight).toBe(3);
      expect(config.signers.length).toBe(3);
      expect(config.description).toBe('2-of-3 Multi-Signature Treasury');
    });

    it('identifies single-signature accounts correctly', () => {
      const singleSigner = [
        {
          key: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
          weight: 1,
          type: 'ed25519_public_key',
        },
      ];
      const singleThreshold = { low_threshold: 0, med_threshold: 1, high_threshold: 1 };

      const config = getMultisigAccountConfig('GSINGLEACCOUNT', singleSigner, singleThreshold);
      expect(config.isMultisig).toBe(false);
      expect(config.requiredPayoutThreshold).toBe(1);
      expect(config.description).toBe('Single-Signature Account');
    });
  });

  describe('Payout Initiation & AWAITING_SIGNATURES with XDR', () => {
    const basePayoutData: Omit<Payout, 'status' | 'multisig'> = {
      id: 'pout_multisig_test_01',
      date: '2026-03-01T12:00:00.000Z',
      amount: 10000,
      asset: 'USDC',
      destinationWallet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      destinationLabel: 'Circle Testnet Ops',
      payoutMethod: 'Stellar Direct Transfer',
      txHash: '',
      fee: 0.00001,
    };

    it('saves a 2-of-3 payout as AWAITING_SIGNATURES when initiated by a single signer', () => {
      const config = getMultisigAccountConfig(
        DEMO_MULTISIG_ACCOUNT,
        DEMO_MULTISIG_SIGNERS,
        DEMO_MULTISIG_THRESHOLDS
      );

      const initiatorKey = DEMO_MULTISIG_SIGNERS[0].key;
      const payout = initializeMultisigPayout(basePayoutData, config, initiatorKey, 24);

      expect(payout.status).toBe('AWAITING_SIGNATURES');
      expect(payout.multisig).toBeDefined();
      expect(payout.multisig?.isMultisig).toBe(true);
      expect(payout.multisig?.requiredThreshold).toBe(2);
      expect(payout.multisig?.currentWeight).toBe(1);
      expect(payout.multisig?.xdr).toBeTruthy();

      const progress = getMultisigProgress(payout);
      expect(progress.signedCount).toBe(1);
      expect(progress.totalRequired).toBe(2);
      expect(progress.percentage).toBe(50);
      expect(progress.isReadyToSubmit).toBe(false);
      expect(progress.statusText).toContain('1 of 2 signatures collected (50%)');
    });
  });

  describe('Team Multi-Signature Approval and Automatic Submission', () => {
    const basePayoutData: Omit<Payout, 'status' | 'multisig'> = {
      id: 'pout_multisig_test_02',
      date: '2026-03-01T12:00:00.000Z',
      amount: 25000,
      asset: 'USDC',
      destinationWallet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      destinationLabel: 'Liquidity Provider Withdrawal',
      payoutMethod: 'Stellar Direct Transfer',
      txHash: '',
      fee: 0.00001,
    };

    it('rejects duplicate signatures from the same account', () => {
      const config = getMultisigAccountConfig(
        DEMO_MULTISIG_ACCOUNT,
        DEMO_MULTISIG_SIGNERS,
        DEMO_MULTISIG_THRESHOLDS
      );
      const initiatorKey = DEMO_MULTISIG_SIGNERS[0].key;
      const payout = initializeMultisigPayout(basePayoutData, config, initiatorKey, 24);

      const result = signMultisigPayout(payout, initiatorKey);
      expect(result.submitted).toBe(false);
      expect(result.error).toContain('already signed');
    });

    it('rejects signatures from unauthorized external accounts', () => {
      const config = getMultisigAccountConfig(
        DEMO_MULTISIG_ACCOUNT,
        DEMO_MULTISIG_SIGNERS,
        DEMO_MULTISIG_THRESHOLDS
      );
      const initiatorKey = DEMO_MULTISIG_SIGNERS[0].key;
      const payout = initializeMultisigPayout(basePayoutData, config, initiatorKey, 24);

      const unauthorizedKey = 'GUNAUTHORIZEDKEY72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5';
      const result = signMultisigPayout(payout, unauthorizedKey);
      expect(result.submitted).toBe(false);
      expect(result.error).toContain('not an authorized signer');
    });

    it('submits automatically once 2 of 3 threshold is achieved', () => {
      const config = getMultisigAccountConfig(
        DEMO_MULTISIG_ACCOUNT,
        DEMO_MULTISIG_SIGNERS,
        DEMO_MULTISIG_THRESHOLDS
      );
      const initiatorKey = DEMO_MULTISIG_SIGNERS[0].key;
      const initialPayout = initializeMultisigPayout(basePayoutData, config, initiatorKey, 24);

      // Second member signs
      const secondSignerKey = DEMO_MULTISIG_SIGNERS[1].key;
      const signResult = signMultisigPayout(initialPayout, secondSignerKey);

      expect(signResult.submitted).toBe(true);
      expect(signResult.error).toBeUndefined();

      const finalPayout = signResult.updatedPayout;
      expect(finalPayout.status).toBe('COMPLETED');
      expect(finalPayout.multisig?.currentWeight).toBe(2);
      expect(finalPayout.txHash).toBeTruthy();

      const progress = getMultisigProgress(finalPayout);
      expect(progress.signedCount).toBe(2);
      expect(progress.totalRequired).toBe(2);
      expect(progress.percentage).toBe(100);
      expect(progress.isReadyToSubmit).toBe(true);
    });
  });

  describe('Time Bound Expiration Criteria', () => {
    const basePayoutData: Omit<Payout, 'status' | 'multisig'> = {
      id: 'pout_multisig_test_03',
      date: '2026-03-01T12:00:00.000Z',
      amount: 5000,
      asset: 'USDC',
      destinationWallet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      payoutMethod: 'Stellar Direct Transfer',
      txHash: '',
      fee: 0.00001,
    };

    it('flags payout as EXPIRED when time bounds pass', () => {
      const config = getMultisigAccountConfig(
        DEMO_MULTISIG_ACCOUNT,
        DEMO_MULTISIG_SIGNERS,
        DEMO_MULTISIG_THRESHOLDS
      );
      const initiatorKey = DEMO_MULTISIG_SIGNERS[0].key;
      // 1 hour window
      const payout = initializeMultisigPayout(basePayoutData, config, initiatorKey, 1);

      // Simulated reference date 2 hours into the future
      const futureDate = new Date(Date.now() + 2 * 3600 * 1000);

      expect(isPayoutExpired(payout, futureDate)).toBe(true);

      // Attempting to sign an expired payout fails with clear error message
      const secondSignerKey = DEMO_MULTISIG_SIGNERS[1].key;
      const result = signMultisigPayout(payout, secondSignerKey, futureDate);

      expect(result.submitted).toBe(false);
      expect(result.updatedPayout.status).toBe('EXPIRED');
      expect(result.error).toBe(
        'Transaction time bound expired. Signatures can no longer be submitted on-chain.'
      );

      const msg = getExpirationMessage(result.updatedPayout);
      expect(msg).toBe(
        'Transaction time bound expired. Signatures can no longer be submitted on-chain. Create a new payout request.'
      );
    });
  });
});
