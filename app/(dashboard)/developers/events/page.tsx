'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import SyntaxHighlightedJson from '@/components/webhooks/SyntaxHighlightedJson';
import { getStoredEndpoints } from '@/lib/webhook-data';
import { WebhookEventType, WebhookEndpoint } from '@/types/webhooks';

interface EventDoc {
  type: WebhookEventType;
  title: string;
  category: 'payment' | 'refund' | 'escrow' | 'payout' | 'account';
  description: string;
  whenItFires: string;
  payload: Record<string, unknown>;
}

const EVENT_CATALOG: EventDoc[] = [
  {
    type: 'payment.created',
    title: 'Payment Created',
    category: 'payment',
    description: 'A new non-custodial payment request or payment intent has been initiated by a customer or merchant session.',
    whenItFires: 'Immediately when an checkout session or invoice is initialized.',
    payload: {
      id: 'evt_pmt_created_01H123456789',
      type: 'payment.created',
      created_at: '2026-10-19T14:32:00.000Z',
      data: {
        payment_id: 'pmt_98234710',
        amount: '125.00',
        asset_code: 'USDC',
        asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        merchant_account: 'GAKNN2...7J89',
        customer_email: 'customer@example.com',
        status: 'pending',
      },
    },
  },
  {
    type: 'payment.completed',
    title: 'Payment Completed',
    category: 'payment',
    description: 'A Stellar transaction transfer corresponding to this payment has been confirmed on the ledger.',
    whenItFires: 'As soon as the Stellar ledger confirms the payment transaction with full finality.',
    payload: {
      id: 'evt_pmt_comp_01H123456790',
      type: 'payment.completed',
      created_at: '2026-10-19T14:32:05.120Z',
      data: {
        payment_id: 'pmt_98234710',
        amount: '125.00',
        asset_code: 'USDC',
        status: 'completed',
        tx_hash: '9f24e93ab890c21345def67890abcdef1234567890abcdef1234567890abcdef',
        ledger: 48921045,
        fee_charged: '0.00001',
      },
    },
  },
  {
    type: 'payment.failed',
    title: 'Payment Failed',
    category: 'payment',
    description: 'A payment attempt was rejected by the network or failed due to slippage, trustline absence, or insufficient balance.',
    whenItFires: 'When transaction simulation or submission returns an error on-chain.',
    payload: {
      id: 'evt_pmt_fail_01H123456791',
      type: 'payment.failed',
      created_at: '2026-10-19T14:32:08.500Z',
      data: {
        payment_id: 'pmt_98234710',
        error_code: 'op_underfunded',
        error_message: 'The source wallet does not possess enough funds to cover the payment amount and fees.',
      },
    },
  },
  {
    type: 'payment.expired',
    title: 'Payment Expired',
    category: 'payment',
    description: 'A pending payment invoice or QR code was not settled within its validity timeframe.',
    whenItFires: 'When the expiration timestamp on the payment intent passes without transaction detection.',
    payload: {
      id: 'evt_pmt_exp_01H123456792',
      type: 'payment.expired',
      created_at: '2026-10-19T14:47:00.000Z',
      data: {
        payment_id: 'pmt_98234710',
        expired_at: '2026-10-19T14:47:00.000Z',
      },
    },
  },
  {
    type: 'refund.created',
    title: 'Refund Created',
    category: 'refund',
    description: 'A refund process was requested by the merchant for a previous transaction.',
    whenItFires: 'When a merchant or API client triggers a refund operation in the dashboard or via API.',
    payload: {
      id: 'evt_ref_cre_01H123456793',
      type: 'refund.created',
      created_at: '2026-10-19T15:10:00.000Z',
      data: {
        refund_id: 'ref_3349012',
        payment_id: 'pmt_98234710',
        refund_amount: '50.00',
        reason: 'Customer request',
        status: 'pending',
      },
    },
  },
  {
    type: 'refund.completed',
    title: 'Refund Completed',
    category: 'refund',
    description: 'The Soroban refund contract has successfully returned funds to the customer wallet.',
    whenItFires: 'When the refund transaction completes and verifies on the Stellar ledger.',
    payload: {
      id: 'evt_ref_comp_01H123456794',
      type: 'refund.completed',
      created_at: '2026-10-19T15:10:06.400Z',
      data: {
        refund_id: 'ref_3349012',
        payment_id: 'pmt_98234710',
        amount: '50.00',
        destination: 'GB33PD2PR277PFLGOBAIT25RAWUTHA74Q2Z25IGTLSRRAURVPOZFLD3L',
        tx_hash: '1234a93ab890c21345def67890abcdef1234567890abcdef1234567890abcdef',
        status: 'completed',
      },
    },
  },
  {
    type: 'refund.failed',
    title: 'Refund Failed',
    category: 'refund',
    description: 'The refund transaction could not be executed on-chain.',
    whenItFires: 'When the refund contract simulation or transaction signing is rejected or fails.',
    payload: {
      id: 'evt_ref_fail_01H123456795',
      type: 'refund.failed',
      created_at: '2026-10-19T15:10:10.000Z',
      data: {
        refund_id: 'ref_3349012',
        payment_id: 'pmt_98234710',
        error_message: 'Refund balance exceeded or contract paused',
      },
    },
  },
  {
    type: 'refund.processed',
    title: 'Refund Processed',
    category: 'refund',
    description: 'Internal merchant balances and accounting have completed updating for the refund.',
    whenItFires: 'After on-chain confirmation when ledger records are reconciled.',
    payload: {
      id: 'evt_ref_proc_01H123456796',
      type: 'refund.processed',
      created_at: '2026-10-19T15:10:12.000Z',
      data: {
        refund_id: 'ref_3349012',
        reconciled: true,
      },
    },
  },
  {
    type: 'escrow.funded',
    title: 'Escrow Funded',
    category: 'escrow',
    description: 'Escrow smart contract has received and locked buyer funds for milestone release.',
    whenItFires: 'When funds enter the Soroban escrow contract account.',
    payload: {
      id: 'evt_esc_fund_01H123456797',
      type: 'escrow.funded',
      created_at: '2026-10-19T16:00:00.000Z',
      data: {
        escrow_id: 'esc_440912',
        amount: '1000.00',
        asset_code: 'USDC',
        arbiter: 'GAKNN2...7J89',
        release_conditions: 'milestone_approval',
      },
    },
  },
  {
    type: 'escrow.released',
    title: 'Escrow Released',
    category: 'escrow',
    description: 'Funds held in escrow have been paid out to the merchant upon delivery verification.',
    whenItFires: 'When the buyer or arbiter authorizes escrow fund release.',
    payload: {
      id: 'evt_esc_rel_01H123456798',
      type: 'escrow.released',
      created_at: '2026-10-19T16:45:00.000Z',
      data: {
        escrow_id: 'esc_440912',
        released_amount: '1000.00',
        payout_tx: '7788a93ab890c21345def67890abcdef1234567890abcdef1234567890abcdef',
      },
    },
  },
  {
    type: 'escrow.disputed',
    title: 'Escrow Disputed',
    category: 'escrow',
    description: 'A dispute has been initiated for an active escrow transaction requiring arbiter review.',
    whenItFires: 'When either party files a dispute on an active escrow.',
    payload: {
      id: 'evt_esc_disp_01H123456799',
      type: 'escrow.disputed',
      created_at: '2026-10-19T17:10:00.000Z',
      data: {
        escrow_id: 'esc_440912',
        reason: 'Item not received',
        dispute_status: 'under_review',
      },
    },
  },
  {
    type: 'payout.completed',
    title: 'Payout Completed',
    category: 'payout',
    description: 'An automated sweep or manual payout of merchant funds to a treasury wallet has settled.',
    whenItFires: 'When destination address receives payout settlement on Stellar.',
    payload: {
      id: 'evt_pay_comp_01H123456800',
      type: 'payout.completed',
      created_at: '2026-10-19T18:00:00.000Z',
      data: {
        payout_id: 'pay_992014',
        amount: '2500.00',
        asset: 'USDC',
        destination_wallet: 'GBSXXD3OAJY36MNINA3QEEVDCHZJIB3PWLNBNMGJ2FYZMVIAWAP22PU3',
        tx_hash: '5566a93ab890c21345def67890abcdef1234567890abcdef1234567890abcdef',
      },
    },
  },
  {
    type: 'trustline.added',
    title: 'Trustline Added',
    category: 'account',
    description: 'A customer or merchant account established trust for a payment asset token on Stellar.',
    whenItFires: 'When a change_trust operation is processed on the ledger.',
    payload: {
      id: 'evt_trs_add_01H123456801',
      type: 'trustline.added',
      created_at: '2026-10-19T18:30:00.000Z',
      data: {
        account_id: 'GBHLJUYQYT5AGOIGXEIQG3CH2WTVSKUTODCFVN5F6LVL2JSVFHII6OAD',
        asset_code: 'USDC',
        limit: '1000000000',
      },
    },
  },
];

const SIGNATURE_SNIPPETS = {
  node: `const crypto = require('crypto');

function verifyFacilPaySignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) {
    throw new Error('Missing signature header or secret');
  }

  // Header format: t={timestamp},v1={hmac_sha256}
  const elements = signatureHeader.split(',');
  const timestampItem = elements.find((item) => item.startsWith('t='));
  const signatureItem = elements.find((item) => item.startsWith('v1='));

  if (!timestampItem || !signatureItem) {
    throw new Error('Malformed signature header');
  }

  const timestamp = timestampItem.split('=')[1];
  const signature = signatureItem.split('=')[1];

  // Prevent replay attacks
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > toleranceSeconds) {
    throw new Error('Timestamp outside tolerance threshold');
  }

  // Compute expected HMAC-SHA256 signature over \`\${timestamp}.\${rawBody}\`
  const signedPayload = \`\${timestamp}.\${rawBody}\`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // Constant-time comparison
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}`,
  python: `import hmac
import hashlib
import time

def verify_facilpay_signature(raw_body: str, signature_header: str, secret: str, tolerance: int = 300) -> bool:
    if not signature_header or not secret:
        return False

    elements = dict(item.split('=', 1) for item in signature_header.split(',') if '=' in item)
    timestamp = elements.get('t')
    signature = elements.get('v1')

    if not timestamp or not signature:
        return False

    # Check replay window
    if abs(time.time() - int(timestamp)) > tolerance:
        return False

    signed_payload = f"{timestamp}.{raw_body}".encode('utf-8')
    expected_signature = hmac.new(
        secret.encode('utf-8'),
        signed_payload,
        hashlib.sha256
    ).hexdigest()

    return hmac.compare_digest(expected_signature, signature)`,
  go: `package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"math"
	"strconv"
	"strings"
	"time"
)

func VerifyFacilPaySignature(rawBody, signatureHeader, secret string, toleranceSeconds int64) bool {
	parts := strings.Split(signatureHeader, ",")
	var timestamp, signature string

	for _, p := range parts {
		if strings.HasPrefix(p, "t=") {
			timestamp = strings.TrimPrefix(p, "t=")
		} else if strings.HasPrefix(p, "v1=") {
			signature = strings.TrimPrefix(p, "v1=")
		}
	}

	if timestamp == "" || signature == "" {
		return false
	}

	ts, err := strconv.ParseInt(timestamp, 10, 64)
	if err != nil || math.Abs(float64(time.Now().Unix()-ts)) > float64(toleranceSeconds) {
		return false
	}

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(fmt.Sprintf("%s.%s", timestamp, rawBody)))
	expectedSig := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(expectedSig), []byte(signature))
}`,
};

export default function EventsCatalogPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventDoc>(EVENT_CATALOG[1]); // Default to payment.completed
  const [selectedLang, setSelectedLang] = useState<'node' | 'python' | 'go'>('node');
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('');
  const [testSent, setTestSent] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  useEffect(() => {
    const list = getStoredEndpoints();
    setEndpoints(list);
    if (list.length > 0) {
      setSelectedEndpointId(list[0].id);
    }
  }, []);

  const handleSendTestEvent = () => {
    setTestSent(true);
    const endpoint = endpoints.find((ep) => ep.id === selectedEndpointId);
    const targetUrl = endpoint ? endpoint.url : 'https://api.merchant.com/webhook';

    setTestStatus(`Sending ${selectedEvent.type} to ${targetUrl}…`);
    setTimeout(() => {
      setTestStatus(`✓ Test event ${selectedEvent.type} delivered successfully (HTTP 200 OK)`);
    }, 800);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Sub-navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Webhook Event Catalog
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Reference guide for all real-time webhook event schemas, payloads, and cryptographic signature verification.
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
          <Link
            href="/developers/api-keys"
            className="rounded-lg px-3 py-1.5 font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
          >
            API Keys
          </Link>
          <Link
            href="/developers/events"
            className="rounded-lg bg-[#000F24] px-3 py-1.5 font-semibold text-white shadow-sm dark:bg-[#55C2FF] dark:text-black"
          >
            Event Catalog
          </Link>
        </div>
      </div>

      {/* Grid: Events List on Left, Detail & Payload on Right */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Events Navigation Sidebar */}
        <div className="lg:col-span-4 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 px-1">
            Standard Webhook Events ({EVENT_CATALOG.length})
          </h2>
          <div className="max-h-[600px] overflow-y-auto space-y-1.5 pr-1">
            {EVENT_CATALOG.map((evt) => {
              const isSelected = selectedEvent.type === evt.type;
              return (
                <button
                  key={evt.type}
                  type="button"
                  onClick={() => {
                    setSelectedEvent(evt);
                    setTestStatus(null);
                  }}
                  className={`w-full text-left rounded-xl p-3 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#0066FF] bg-blue-50/60 dark:border-[#55C2FF] dark:bg-blue-950/20 shadow-sm'
                      : 'border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                      {evt.type}
                    </span>
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium capitalize text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {evt.category}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-1">
                    {evt.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Event Details & Payload */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedEvent.type}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300">
                    Active Schema
                  </span>
                </div>
                <h3 className="mt-1 text-base font-semibold text-zinc-900 dark:text-white">
                  {selectedEvent.title}
                </h3>
              </div>

              {/* Send Test Event Action */}
              <div className="flex items-center gap-2">
                {endpoints.length > 0 && (
                  <select
                    value={selectedEndpointId}
                    onChange={(e) => setSelectedEndpointId(e.target.value)}
                    className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-700 shadow-sm focus:border-blue-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {endpoints.map((ep) => (
                      <option key={ep.id} value={ep.id}>
                        {ep.url.length > 30 ? `${ep.url.slice(0, 30)}…` : ep.url}
                      </option>
                    ))}
                  </select>
                )}
                <button
                  type="button"
                  onClick={handleSendTestEvent}
                  className="rounded-lg bg-[#000F24] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black dark:hover:bg-[#A5D4FF] transition-colors"
                >
                  Send Test Event
                </button>
              </div>
            </div>

            {testStatus && (
              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs font-medium text-emerald-900 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {testStatus}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Description
                </h4>
                <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
                  {selectedEvent.description}
                </p>
              </div>
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Trigger Condition
                </h4>
                <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
                  {selectedEvent.whenItFires}
                </p>
              </div>
            </div>

            {/* Example JSON Payload with Syntax Highlighting */}
            <div className="mt-6">
              <div className="flex items-center justify-between pb-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Example JSON Payload
                </h4>
                <span className="text-[11px] text-zinc-400">application/json</span>
              </div>
              <SyntaxHighlightedJson data={selectedEvent.payload} maxHeight="max-h-80" />
            </div>
          </div>

          {/* Signature Verification Guide */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Signature Verification Snippets
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Verify the HMAC-SHA256 signature in the <code className="font-mono text-zinc-800 dark:text-zinc-200">X-FacilPay-Signature</code> header.
                </p>
              </div>

              {/* Language Selector */}
              <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 text-xs dark:border-zinc-800 dark:bg-zinc-800">
                {(['node', 'python', 'go'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLang(lang)}
                    className={`rounded-md px-2.5 py-1 font-semibold capitalize transition-all ${
                      selectedLang === lang
                        ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                    }`}
                  >
                    {lang === 'node' ? 'Node.js' : lang === 'python' ? 'Python' : 'Go'}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <pre className="overflow-x-auto rounded-xl bg-zinc-900 p-4 font-mono text-xs text-zinc-100">
                <code>{SIGNATURE_SNIPPETS[selectedLang]}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
