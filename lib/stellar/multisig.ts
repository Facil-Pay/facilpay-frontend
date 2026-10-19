/**
 * lib/stellar/multisig.ts
 *
 * Stellar Multi-Signature Accounts and Payout Management.
 * Implements threshold checks, signer tracking, XDR preservation,
 * threshold progress monitoring (e.g., 2-of-3), and time-bound expiration checks.
 */

import { Payout, PayoutSigner, PayoutMultisigMeta, PayoutStatus } from '@/lib/types';
import { HorizonSigner, HorizonThresholds } from './horizon';

export interface MultisigAccountConfig {
  accountId: string;
  isMultisig: boolean;
  thresholds: HorizonThresholds;
  signers: HorizonSigner[];
  requiredPayoutThreshold: number; // medium threshold for payments
  totalSignerWeight: number;
  description: string;
}

/**
 * Canonical 2-of-3 Demo Testnet Merchant Treasury Account
 */
export const DEMO_MULTISIG_ACCOUNT = 'GDMULTISIG72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A';

export const DEMO_MULTISIG_SIGNERS: HorizonSigner[] = [
  {
    key: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    weight: 1,
    type: 'ed25519_public_key',
  },
  {
    key: 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG',
    weight: 1,
    type: 'ed25519_public_key',
  },
  {
    key: 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV',
    weight: 1,
    type: 'ed25519_public_key',
  },
];

export const DEMO_MULTISIG_THRESHOLDS: HorizonThresholds = {
  low_threshold: 1,
  med_threshold: 2,
  high_threshold: 2,
};

/**
 * Analyzes account signers and thresholds to determine multisig configuration.
 */
export function getMultisigAccountConfig(
  accountId: string,
  signers: HorizonSigner[] = DEMO_MULTISIG_SIGNERS,
  thresholds: HorizonThresholds = DEMO_MULTISIG_THRESHOLDS
): MultisigAccountConfig {
  const isMultisig = thresholds.med_threshold > 1 && signers.length > 1;
  const totalWeight = signers.reduce((acc, s) => acc + s.weight, 0);

  const description = isMultisig
    ? `${thresholds.med_threshold}-of-${signers.length} Multi-Signature Treasury`
    : 'Single-Signature Account';

  return {
    accountId,
    isMultisig,
    thresholds,
    signers,
    requiredPayoutThreshold: thresholds.med_threshold,
    totalSignerWeight: totalWeight,
    description,
  };
}

/**
 * Checks whether a payout has expired based on its timeBounds or expiration date.
 */
export function isPayoutExpired(payout: Payout, referenceDate: Date = new Date()): boolean {
  if (payout.status === 'EXPIRED') return true;

  if (payout.multisig?.expiresAt) {
    const expiresTime = new Date(payout.multisig.expiresAt).getTime();
    if (referenceDate.getTime() > expiresTime) {
      return true;
    }
  }

  if (payout.multisig?.timeBounds?.maxTime) {
    const maxTime = Number(payout.multisig.timeBounds.maxTime) * 1000;
    if (referenceDate.getTime() > maxTime) {
      return true;
    }
  }

  return false;
}

/**
 * Formats a user-friendly expiration message.
 */
export function getExpirationMessage(payout: Payout): string {
  if (isPayoutExpired(payout)) {
    return 'Transaction time bound expired. Signatures can no longer be submitted on-chain. Create a new payout request.';
  }
  if (payout.multisig?.expiresAt) {
    const expDate = new Date(payout.multisig.expiresAt);
    return `Expires: ${expDate.toLocaleString()}`;
  }
  return 'No expiration configured';
}

/**
 * Calculates current signature progress for a multi-sig payout.
 */
export function getMultisigProgress(payout: Payout): {
  signedCount: number;
  totalRequired: number;
  percentage: number;
  isReadyToSubmit: boolean;
  statusText: string;
} {
  const meta = payout.multisig;
  if (!meta || !meta.isMultisig) {
    return {
      signedCount: 1,
      totalRequired: 1,
      percentage: 100,
      isReadyToSubmit: true,
      statusText: 'Single Signature',
    };
  }

  const signedCount = meta.signers.filter((s) => s.signed).length;
  const totalRequired = meta.requiredThreshold;
  const percentage = Math.min(100, Math.round((meta.currentWeight / totalRequired) * 100));
  const isReadyToSubmit = meta.currentWeight >= totalRequired;

  return {
    signedCount,
    totalRequired,
    percentage,
    isReadyToSubmit,
    statusText: `${signedCount} of ${totalRequired} signatures collected (${percentage}%)`,
  };
}

/**
 * Initializes a new payout with multi-sig envelope metadata.
 */
export function initializeMultisigPayout(
  basePayout: Omit<Payout, 'status' | 'multisig'>,
  config: MultisigAccountConfig,
  initiatorPublicKey: string,
  timeBoundHours: number = 24
): Payout {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + timeBoundHours * 60 * 60 * 1000).toISOString();
  const maxTimeSeconds = Math.floor(now.getTime() / 1000) + timeBoundHours * 3600;

  const initiatorSigner = config.signers.find((s) => s.key === initiatorPublicKey);
  const initialWeight = initiatorSigner ? initiatorSigner.weight : 1;

  const signers: PayoutSigner[] = config.signers.map((s, idx) => ({
    key: s.key,
    weight: s.weight,
    signed: s.key === initiatorPublicKey,
    signedAt: s.key === initiatorPublicKey ? now.toISOString() : undefined,
    signature: s.key === initiatorPublicKey ? `sig_mock_${s.key.slice(0, 8)}_${Date.now()}` : undefined,
    label: s.key === initiatorPublicKey ? 'Initiator (You)' : `Signer ${idx + 1}`,
  }));

  const isThresholdMet = initialWeight >= config.requiredPayoutThreshold;

  // Mock canonical Stellar transaction envelope XDR representation
  const mockXdr = Buffer.from(
    JSON.stringify({
      sourceAccount: config.accountId,
      amount: basePayout.amount,
      asset: basePayout.asset,
      destination: basePayout.destinationWallet,
      timeBounds: { minTime: '0', maxTime: String(maxTimeSeconds) },
      signatures: signers.filter((s) => s.signed).map((s) => s.signature),
    })
  ).toString('base64');

  const multisigMeta: PayoutMultisigMeta = {
    isMultisig: config.isMultisig,
    requiredThreshold: config.requiredPayoutThreshold,
    currentWeight: initialWeight,
    signers,
    xdr: mockXdr,
    timeBounds: {
      minTime: '0',
      maxTime: String(maxTimeSeconds),
    },
    expiresAt,
    isExpired: false,
  };

  const status: PayoutStatus = isThresholdMet ? 'COMPLETED' : 'AWAITING_SIGNATURES';

  return {
    ...basePayout,
    status,
    multisig: multisigMeta,
    txHash: isThresholdMet ? basePayout.txHash : '',
  };
}

/**
 * Appends a signature to a pending multi-sig payout.
 * If the threshold is reached, automatically marks as completed/ready to submit.
 */
export function signMultisigPayout(
  payout: Payout,
  signerPublicKey: string,
  referenceDate: Date = new Date()
): { updatedPayout: Payout; submitted: boolean; error?: string } {
  if (isPayoutExpired(payout, referenceDate)) {
    return {
      updatedPayout: {
        ...payout,
        status: 'EXPIRED',
        multisig: payout.multisig ? { ...payout.multisig, isExpired: true } : undefined,
      },
      submitted: false,
      error: 'Transaction time bound expired. Signatures can no longer be submitted on-chain.',
    };
  }

  if (!payout.multisig || !payout.multisig.isMultisig) {
    return {
      updatedPayout: payout,
      submitted: false,
      error: 'This payout is not configured for multi-signature approval.',
    };
  }

  const existingSigner = payout.multisig.signers.find((s) => s.key === signerPublicKey);
  if (!existingSigner) {
    return {
      updatedPayout: payout,
      submitted: false,
      error: `Signer ${signerPublicKey} is not an authorized signer on this account.`,
    };
  }

  if (existingSigner.signed) {
    return {
      updatedPayout: payout,
      submitted: false,
      error: 'This account has already signed this payout transaction.',
    };
  }

  const updatedSigners = payout.multisig.signers.map((s) => {
    if (s.key === signerPublicKey) {
      return {
        ...s,
        signed: true,
        signedAt: referenceDate.toISOString(),
        signature: `sig_mock_${s.key.slice(0, 8)}_${Date.now()}`,
      };
    }
    return s;
  });

  const newWeight = updatedSigners
    .filter((s) => s.signed)
    .reduce((acc, s) => acc + s.weight, 0);

  const isThresholdMet = newWeight >= payout.multisig.requiredThreshold;

  // Update transaction envelope XDR with new signature
  const decodedEnvelope = JSON.parse(Buffer.from(payout.multisig.xdr, 'base64').toString('utf-8'));
  decodedEnvelope.signatures = updatedSigners.filter((s) => s.signed).map((s) => s.signature);
  const updatedXdr = Buffer.from(JSON.stringify(decodedEnvelope)).toString('base64');

  const newTxHash = isThresholdMet
    ? `tx_multisig_${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`
    : '';

  const updatedPayout: Payout = {
    ...payout,
    status: isThresholdMet ? 'COMPLETED' : 'AWAITING_SIGNATURES',
    txHash: isThresholdMet ? newTxHash : payout.txHash,
    multisig: {
      ...payout.multisig,
      currentWeight: newWeight,
      signers: updatedSigners,
      xdr: updatedXdr,
    },
  };

  return {
    updatedPayout,
    submitted: isThresholdMet,
  };
}
