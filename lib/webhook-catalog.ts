import { WebhookEventType } from '@/types/webhooks';

export interface WebhookFieldDoc {
  field: string;
  type: string;
  description: string;
  required?: boolean;
}

export interface WebhookEventCatalogItem {
  id: WebhookEventType;
  name: string;
  category: 'payment' | 'refund' | 'escrow' | 'payout' | 'account';
  categoryLabel: string;
  summary: string;
  whenFires: string;
  samplePayload: {
    id: string;
    event: WebhookEventType;
    created_at: string;
    network: 'stellar_mainnet' | 'stellar_testnet';
    data: Record<string, unknown>;
  };
  fields: WebhookFieldDoc[];
}

export const SIGNATURE_VERIFICATION_SNIPPETS = {
  nodejs: `const crypto = require('crypto');

/**
 * Verify FacilPay Webhook Signature in Node.js
 *
 * Header: X-FacilPay-Signature: t=1790418376,v1=7a8b9c0d1e2f3a4b...
 *
 * @param {string} rawBody - Raw unparsed HTTP request body string
 * @param {string} signatureHeader - Value of 'X-FacilPay-Signature' header
 * @param {string} secret - Webhook endpoint signing secret (e.g. 'whsec_...')
 * @param {number} toleranceSeconds - Allowed clock drift (default 300s = 5m)
 * @returns {boolean}
 */
function verifyFacilPaySignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) {
    throw new Error('Missing signature header or secret');
  }

  // 1. Extract timestamp and v1 signature from header
  const elements = signatureHeader.split(',');
  const timestampItem = elements.find((item) => item.startsWith('t='));
  const signatureItem = elements.find((item) => item.startsWith('v1='));

  if (!timestampItem || !signatureItem) {
    throw new Error('Malformed signature header');
  }

  const timestamp = timestampItem.split('=')[1];
  const signature = signatureItem.split('=')[1];

  // 2. Prevent replay attacks: check timestamp freshness
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > toleranceSeconds) {
    throw new Error('Webhook timestamp outside allowed tolerance window');
  }

  // 3. Compute expected HMAC-SHA256 signature over \`\${timestamp}.\${rawBody}\`
  const signedPayload = \`\${timestamp}.\${rawBody}\`;
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // 4. Timing-safe comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

module.exports = { verifyFacilPaySignature };`,

  python: `import hmac
import hashlib
import time

def verify_facilpay_signature(
    raw_body: bytes,
    signature_header: str,
    secret: str,
    tolerance_seconds: int = 300
) -> bool:
    """
    Verify FacilPay Webhook Signature in Python 3.
    
    Header format:
      X-FacilPay-Signature: t=1790418376,v1=7a8b9c0d1e2f3a4b...
      
    :param raw_body: Raw unprocessed HTTP request body as bytes
    :param signature_header: Value of 'X-FacilPay-Signature' HTTP header
    :param secret: Webhook signing secret (e.g. 'whsec_...')
    :param tolerance_seconds: Allowed clock drift window in seconds (default 300)
    :return: True if signature is valid and timestamp fresh
    """
    if not signature_header or not secret:
        raise ValueError("Missing signature header or secret")

    # 1. Parse timestamp and v1 signature components
    elements = dict(item.split("=", 1) for item in signature_header.split(","))
    timestamp = elements.get("t")
    signature = elements.get("v1")

    if not timestamp or not signature:
        raise ValueError("Malformed signature header")

    # 2. Replay attack prevention: verify timestamp freshness
    now = int(time.time())
    if abs(now - int(timestamp)) > tolerance_seconds:
        raise ValueError("Webhook timestamp outside allowed tolerance window")

    # 3. Compute HMAC-SHA256 signature over "<timestamp>.<raw_body>"
    signed_payload = f"{timestamp}.".encode("utf-8") + raw_body
    computed_hash = hmac.new(
        secret.encode("utf-8"),
        signed_payload,
        hashlib.sha256
    ).hexdigest()

    # 4. Constant-time comparison to prevent side-channel timing attacks
    return hmac.compare_digest(computed_hash, signature)`,

  go: `package webhook

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"
)

// VerifyFacilPaySignature verifies the X-FacilPay-Signature header
// Format: X-FacilPay-Signature: t=1790418376,v1=7a8b9c0d1e2f3a4b...
func VerifyFacilPaySignature(rawBody []byte, signatureHeader string, secret string, toleranceSeconds int64) (bool, error) {
	if signatureHeader == "" || secret == "" {
		return false, errors.New("missing signature header or secret")
	}

	var timestampStr, signature string
	for _, part := range strings.Split(signatureHeader, ",") {
		kv := strings.SplitN(part, "=", 2)
		if len(kv) == 2 {
			switch kv[0] {
			case "t":
				timestampStr = kv[1]
			case "v1":
				signature = kv[1]
			}
		}
	}

	if timestampStr == "" || signature == "" {
		return false, errors.New("malformed signature header")
	}

	ts, err := strconv.ParseInt(timestampStr, 10, 64)
	if err != nil {
		return false, fmt.Errorf("invalid timestamp format: %w", err)
	}

	// 2. Prevent replay attacks: check timestamp freshness
	now := time.Now().Unix()
	if int64(math.Abs(float64(now-ts))) > toleranceSeconds {
		return false, errors.New("webhook timestamp outside allowed tolerance window")
	}

	// 3. Compute HMAC-SHA256 signature over "<timestamp>.<rawBody>"
	signedPayload := append([]byte(timestampStr+"."), rawBody...)
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write(signedPayload)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	// 4. Constant-time byte slice comparison
	return hmac.Equal([]byte(expectedSignature), []byte(signature)), nil
}`,
};

export const WEBHOOK_CATALOG: WebhookEventCatalogItem[] = [
  // ── Payment Events ───────────────────────────────────────────────
  {
    id: 'payment.created',
    name: 'payment.created',
    category: 'payment',
    categoryLabel: 'Payments',
    summary: 'Triggered when a new payment link, QR checkout, or payment intent is created.',
    whenFires: 'Fires immediately when a merchant API call or dashboard action generates a new payable checkout session.',
    samplePayload: {
      id: 'evt_pay_created_01j9a8b1',
      event: 'payment.created',
      created_at: '2026-10-20T12:00:00.000Z',
      network: 'stellar_testnet',
      data: {
        id: 'pl_01j9a8b1c2d3',
        amount: '125.00',
        currency: 'USDC',
        asset_code: 'USDC',
        asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        status: 'pending',
        customer_account: null,
        merchant_account: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
        expires_at: '2026-10-20T12:30:00.000Z',
        metadata: {
          order_id: 'ord_9901',
          customer_email: 'buyer@example.com',
        },
      },
    },
    fields: [
      { field: 'id', type: 'string', description: 'Unique payment identifier (prefix pl_)', required: true },
      { field: 'amount', type: 'string', description: 'Payment amount formatted as decimal string', required: true },
      { field: 'currency', type: 'string', description: 'Asset code (USDC, XLM, EURC)', required: true },
      { field: 'status', type: 'string', description: 'Initial state: pending', required: true },
      { field: 'merchant_account', type: 'string', description: 'Receiving Stellar G... public key', required: true },
      { field: 'expires_at', type: 'string', description: 'ISO 8601 expiration timestamp', required: true },
      { field: 'metadata', type: 'object', description: 'Custom merchant metadata key-value pairs', required: false },
    ],
  },
  {
    id: 'payment.completed',
    name: 'payment.completed',
    category: 'payment',
    categoryLabel: 'Payments',
    summary: 'Triggered when a payment is verified, settled on the Stellar ledger, and credited to the merchant.',
    whenFires: 'Fires immediately after Stellar consensus confirms the payment transaction with 100% finality.',
    samplePayload: {
      id: 'evt_pay_completed_99a8b1c2',
      event: 'payment.completed',
      created_at: '2026-10-20T12:05:00.000Z',
      network: 'stellar_testnet',
      data: {
        id: 'pl_01j9a8b1c2d3',
        transaction_hash: '9f8c3d2e1b0a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e',
        ledger_sequence: 4829104,
        amount: '125.00',
        currency: 'USDC',
        fee_xlm: '0.00001',
        status: 'settled',
        customer_account: 'GABCD3XYZ99238KLMS72782910AAJJWWQQOPPLKKJJHGFEDCBA7766554433221',
        merchant_account: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
        metadata: {
          order_id: 'ord_9901',
          customer_email: 'buyer@example.com',
        },
      },
    },
    fields: [
      { field: 'id', type: 'string', description: 'Unique payment identifier', required: true },
      { field: 'transaction_hash', type: 'string', description: '64-character hex Stellar transaction hash', required: true },
      { field: 'ledger_sequence', type: 'number', description: 'Ledger sequence number confirming the transaction', required: true },
      { field: 'amount', type: 'string', description: 'Settled payment amount', required: true },
      { field: 'currency', type: 'string', description: 'Asset currency code', required: true },
      { field: 'status', type: 'string', description: 'Settlement state: settled', required: true },
      { field: 'customer_account', type: 'string', description: 'Payer Stellar public key', required: true },
      { field: 'merchant_account', type: 'string', description: 'Payee Stellar public key', required: true },
    ],
  },
  {
    id: 'payment.failed',
    name: 'payment.failed',
    category: 'payment',
    categoryLabel: 'Payments',
    summary: 'Triggered when a payment attempt fails, is rejected on-chain, or encounters an execution error.',
    whenFires: 'Fires when Horizon or Soroban RPC returns op_underfunded, tx_failed, or an invalid transaction envelope.',
    samplePayload: {
      id: 'evt_pay_failed_10283b4c',
      event: 'payment.failed',
      created_at: '2026-10-20T12:10:00.000Z',
      network: 'stellar_testnet',
      data: {
        id: 'pl_01j9a8b1c2d3',
        status: 'failed',
        error_code: 'op_underfunded',
        error_message: 'Customer account does not hold sufficient balance to execute the transaction',
        amount: '125.00',
        currency: 'USDC',
        customer_account: 'GABCD3XYZ99238KLMS72782910AAJJWWQQOPPLKKJJHGFEDCBA7766554433221',
      },
    },
    fields: [
      { field: 'id', type: 'string', description: 'Payment identifier', required: true },
      { field: 'status', type: 'string', description: 'Status: failed', required: true },
      { field: 'error_code', type: 'string', description: 'Horizon error code (e.g. op_underfunded, op_no_trust)', required: true },
      { field: 'error_message', type: 'string', description: 'Human-readable explanation of rejection', required: true },
    ],
  },
  {
    id: 'payment.expired',
    name: 'payment.expired',
    category: 'payment',
    categoryLabel: 'Payments',
    summary: 'Triggered when a payment checkout session reaches its expiration time without receiving funds.',
    whenFires: 'Fires when the checkout timer expires (default: 30 minutes after creation).',
    samplePayload: {
      id: 'evt_pay_expired_44721c90',
      event: 'payment.expired',
      created_at: '2026-10-20T12:30:00.000Z',
      network: 'stellar_testnet',
      data: {
        id: 'pl_01j9a8b1c2d3',
        status: 'expired',
        amount: '125.00',
        currency: 'USDC',
        expired_at: '2026-10-20T12:30:00.000Z',
      },
    },
    fields: [
      { field: 'id', type: 'string', description: 'Payment identifier', required: true },
      { field: 'status', type: 'string', description: 'Status: expired', required: true },
      { field: 'expired_at', type: 'string', description: 'ISO 8601 timestamp when expiration occurred', required: true },
    ],
  },

  // ── Refund Events ────────────────────────────────────────────────
  {
    id: 'refund.created',
    name: 'refund.created',
    category: 'refund',
    categoryLabel: 'Refunds',
    summary: 'Triggered when a merchant or support agent initiates a refund request.',
    whenFires: 'Fires immediately upon submitting a refund for an existing settled payment.',
    samplePayload: {
      id: 'evt_ref_created_39218d5e',
      event: 'refund.created',
      created_at: '2026-10-20T13:00:00.000Z',
      network: 'stellar_testnet',
      data: {
        id: 'ref_55a91b2c3d4e',
        payment_id: 'pl_01j9a8b1c2d3',
        amount: '50.00',
        currency: 'USDC',
        reason: 'customer_return',
        status: 'pending_approval',
        initiated_by: 'merchant@acmestore.com',
      },
    },
    fields: [
      { field: 'id', type: 'string', description: 'Unique refund identifier (prefix ref_)', required: true },
      { field: 'payment_id', type: 'string', description: 'Associated payment identifier', required: true },
      { field: 'amount', type: 'string', description: 'Refund amount in original currency', required: true },
      { field: 'status', type: 'string', description: 'State: pending_approval', required: true },
    ],
  },
  {
    id: 'refund.processed',
    name: 'refund.processed',
    category: 'refund',
    categoryLabel: 'Refunds',
    summary: 'Triggered when a refund has passed multi-sig or automated approval and is queued for ledger execution.',
    whenFires: 'Fires when all required signer approvals or automated risk checks are satisfied.',
    samplePayload: {
      id: 'evt_ref_processed_77391e6f',
      event: 'refund.processed',
      created_at: '2026-10-20T13:05:00.000Z',
      network: 'stellar_testnet',
      data: {
        id: 'ref_55a91b2c3d4e',
        payment_id: 'pl_01j9a8b1c2d3',
        amount: '50.00',
        currency: 'USDC',
        status: 'processing',
        approved_by: 'lead_finance@acmestore.com',
      },
    },
    fields: [
      { field: 'id', type: 'string', description: 'Refund identifier', required: true },
      { field: 'status', type: 'string', description: 'State: processing', required: true },
      { field: 'approved_by', type: 'string', description: 'Authorizer identity or policy id', required: true },
    ],
  },
  {
    id: 'refund.completed',
    name: 'refund.completed',
    category: 'refund',
    categoryLabel: 'Refunds',
    summary: 'Triggered when refund funds have been transferred back to the customer on the Stellar ledger.',
    whenFires: 'Fires when the reversal transaction closes on ledger with confirmed status.',
    samplePayload: {
      id: 'evt_ref_completed_88192f70',
      event: 'refund.completed',
      created_at: '2026-10-20T13:06:00.000Z',
      network: 'stellar_testnet',
      data: {
        id: 'ref_55a91b2c3d4e',
        payment_id: 'pl_01j9a8b1c2d3',
        transaction_hash: '4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d',
        amount: '50.00',
        currency: 'USDC',
        status: 'succeeded',
        destination_account: 'GABCD3XYZ99238KLMS72782910AAJJWWQQOPPLKKJJHGFEDCBA7766554433221',
      },
    },
    fields: [
      { field: 'id', type: 'string', description: 'Refund identifier', required: true },
      { field: 'transaction_hash', type: 'string', description: 'Stellar transaction hash of reversal', required: true },
      { field: 'status', type: 'string', description: 'State: succeeded', required: true },
      { field: 'destination_account', type: 'string', description: 'Customer Stellar wallet receiving refund', required: true },
    ],
  },
  {
    id: 'refund.failed',
    name: 'refund.failed',
    category: 'refund',
    categoryLabel: 'Refunds',
    summary: 'Triggered if a refund transaction encounters an on-chain failure or submission error.',
    whenFires: 'Fires if customer revoked trustline, or merchant payout reserves are exhausted.',
    samplePayload: {
      id: 'evt_ref_failed_99210g81',
      event: 'refund.failed',
      created_at: '2026-10-20T13:07:00.000Z',
      network: 'stellar_testnet',
      data: {
        id: 'ref_55a91b2c3d4e',
        payment_id: 'pl_01j9a8b1c2d3',
        amount: '50.00',
        currency: 'USDC',
        status: 'failed',
        error_code: 'op_no_trust',
        error_message: 'Customer wallet does not maintain required USDC trustline',
      },
    },
    fields: [
      { field: 'id', type: 'string', description: 'Refund identifier', required: true },
      { field: 'status', type: 'string', description: 'State: failed', required: true },
      { field: 'error_code', type: 'string', description: 'Failure error code', required: true },
    ],
  },

  // ── Escrow Events ────────────────────────────────────────────────
  {
    id: 'escrow.funded',
    name: 'escrow.funded',
    category: 'escrow',
    categoryLabel: 'Smart Escrows',
    summary: 'Triggered when buyer funds are locked into a Soroban smart contract escrow instance.',
    whenFires: 'Fires when the Soroban contract deposit event is confirmed in ledger state.',
    samplePayload: {
      id: 'evt_escrow_funded_11827h92',
      event: 'escrow.funded',
      created_at: '2026-10-20T14:00:00.000Z',
      network: 'stellar_testnet',
      data: {
        escrow_id: 'esc_77392a1b',
        contract_id: 'CA3D5KRYMCMUZKDTWSGXZHAM3DTWUCFB2TCDZMOWDY7O4V6D5C76W2DT',
        order_id: 'ord_9901',
        amount: '300.00',
        currency: 'USDC',
        buyer_account: 'GABCD3XYZ99238KLMS72782910AAJJWWQQOPPLKKJJHGFEDCBA7766554433221',
        merchant_account: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
        auto_release_at: '2026-10-27T14:00:00.000Z',
        status: 'locked',
      },
    },
    fields: [
      { field: 'escrow_id', type: 'string', description: 'Unique escrow identifier (prefix esc_)', required: true },
      { field: 'contract_id', type: 'string', description: 'Soroban smart contract C... ID', required: true },
      { field: 'auto_release_at', type: 'string', description: 'ISO 8601 deadline for automatic fund release', required: true },
      { field: 'status', type: 'string', description: 'State: locked', required: true },
    ],
  },
  {
    id: 'escrow.released',
    name: 'escrow.released',
    category: 'escrow',
    categoryLabel: 'Smart Escrows',
    summary: 'Triggered when escrow funds are disbursed from the smart contract to the merchant.',
    whenFires: 'Fires when buyer confirms order receipt, or inspection period expires without dispute.',
    samplePayload: {
      id: 'evt_escrow_released_22918i03',
      event: 'escrow.released',
      created_at: '2026-10-20T14:30:00.000Z',
      network: 'stellar_testnet',
      data: {
        escrow_id: 'esc_77392a1b',
        amount: '300.00',
        currency: 'USDC',
        status: 'released',
        released_to: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
        transaction_hash: '2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f',
      },
    },
    fields: [
      { field: 'escrow_id', type: 'string', description: 'Escrow identifier', required: true },
      { field: 'status', type: 'string', description: 'State: released', required: true },
      { field: 'released_to', type: 'string', description: 'Destination Stellar account', required: true },
    ],
  },
  {
    id: 'escrow.disputed',
    name: 'escrow.disputed',
    category: 'escrow',
    categoryLabel: 'Smart Escrows',
    summary: 'Triggered when an order escrow is contested for mediation or arbitration.',
    whenFires: 'Fires when buyer opens a dispute before auto-release deadline, freezing funds in contract.',
    samplePayload: {
      id: 'evt_escrow_disputed_33019j14',
      event: 'escrow.disputed',
      created_at: '2026-10-20T14:45:00.000Z',
      network: 'stellar_testnet',
      data: {
        escrow_id: 'esc_77392a1b',
        dispute_id: 'disp_88192a0b',
        reason: 'item_not_received',
        status: 'disputed',
        arbitration_deadline: '2026-10-30T14:45:00.000Z',
      },
    },
    fields: [
      { field: 'escrow_id', type: 'string', description: 'Escrow identifier', required: true },
      { field: 'dispute_id', type: 'string', description: 'Case file ID', required: true },
      { field: 'reason', type: 'string', description: 'Dispute reason code', required: true },
      { field: 'status', type: 'string', description: 'State: disputed', required: true },
    ],
  },

  // ── Payout Events ────────────────────────────────────────────────
  {
    id: 'payout.completed',
    name: 'payout.completed',
    category: 'payout',
    categoryLabel: 'Payouts',
    summary: 'Triggered when scheduled merchant balance settlement transfer has executed on-chain.',
    whenFires: 'Fires when automated settlement sweep delivers aggregated earnings to merchant cold storage.',
    samplePayload: {
      id: 'evt_payout_completed_44120k25',
      event: 'payout.completed',
      created_at: '2026-10-20T15:00:00.000Z',
      network: 'stellar_testnet',
      data: {
        payout_id: 'po_99182b3c4d',
        amount: '1450.00',
        currency: 'USDC',
        fee_deducted: '1.50',
        net_amount: '1448.50',
        destination_account: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
        transaction_hash: '1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
        status: 'completed',
      },
    },
    fields: [
      { field: 'payout_id', type: 'string', description: 'Payout identifier (prefix po_)', required: true },
      { field: 'amount', type: 'string', description: 'Gross payout amount', required: true },
      { field: 'net_amount', type: 'string', description: 'Net amount credited after platform fees', required: true },
      { field: 'destination_account', type: 'string', description: 'Merchant payout address', required: true },
      { field: 'status', type: 'string', description: 'State: completed', required: true },
    ],
  },

  // ── Account Events ───────────────────────────────────────────────
  {
    id: 'trustline.added',
    name: 'trustline.added',
    category: 'account',
    categoryLabel: 'Stellar & Accounts',
    summary: 'Triggered when an account establishes or updates a trustline for a supported payment token.',
    whenFires: 'Fires when change_trust operation is confirmed on ledger for merchant or customer accounts.',
    samplePayload: {
      id: 'evt_trustline_added_55231l36',
      event: 'trustline.added',
      created_at: '2026-10-20T15:30:00.000Z',
      network: 'stellar_testnet',
      data: {
        account: 'GABCD3XYZ99238KLMS72782910AAJJWWQQOPPLKKJJHGFEDCBA7766554433221',
        asset_code: 'USDC',
        asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        limit: '1000000.00',
        status: 'active',
      },
    },
    fields: [
      { field: 'account', type: 'string', description: 'Stellar public key establishing trustline', required: true },
      { field: 'asset_code', type: 'string', description: 'Asset alphanumeric code', required: true },
      { field: 'asset_issuer', type: 'string', description: 'Issuer Stellar account', required: true },
      { field: 'limit', type: 'string', description: 'Max credit allowance limit', required: true },
    ],
  },
];

export function getCatalogItem(id: string): WebhookEventCatalogItem | undefined {
  return WEBHOOK_CATALOG.find((item) => item.id === id);
}

export function getCatalogByCategory(category: string): WebhookEventCatalogItem[] {
  if (category === 'all') return WEBHOOK_CATALOG;
  return WEBHOOK_CATALOG.filter((item) => item.category === category);
}
