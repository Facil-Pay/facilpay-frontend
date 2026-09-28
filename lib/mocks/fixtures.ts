/**
 * lib/mocks/fixtures.ts
 *
 * Realistic mock fixtures shared across all MSW handlers.
 * These are built on top of the existing 20-payment mock dataset so the
 * mock API responses look identical to what the real backend will return.
 */

import { getMockPayments } from "@/app/lib/api/payments";
import { getDashboardData } from "@/app/lib/api/dashboard";
import type { Paginated, PaginationMeta } from "@/lib/types/pagination";
import type { Payment }   from "@/lib/types/payment";
import type { Refund }    from "@/lib/types/refund";
import type { AnalyticsInsights, AnalyticsRange } from "@/lib/types/analytics";
import type { Escrow }    from "@/lib/types/escrow";
import type { Webhook }   from "@/lib/types/webhook";
import type { ApiKey }    from "@/lib/types/apiKey";
import type { Merchant, TeamMember } from "@/lib/types/merchant";
import type { Payout }    from "@/lib/types/payout";

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function paginate<T>(
  items: T[],
  page = 1,
  pageSize = 10
): Paginated<T> {
  const total = items.length;
  const start = (page - 1) * pageSize;
  const data  = items.slice(start, start + pageSize);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const meta: PaginationMeta = {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
  return { data, meta };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

/** Cast existing mock payments to the API-layer Payment type. */
export function getPaymentFixtures(): Payment[] {
  // The app/lib type and lib/types shapes are compatible — cast is safe.
  return getMockPayments() as unknown as Payment[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function getDashboardFixture() {
  return getDashboardData();
}

// ─── Refunds ──────────────────────────────────────────────────────────────────

export const REFUND_FIXTURES: Refund[] = [
  {
    id: "ref_01a2b3c4d5e6f7a8b9c0d1e2",
    paymentId: "pay_04m2an5p6q7r8s9t0u1v2w3y",
    reference: "REF-2026-00001",
    status: "completed",
    reason: "customer_request",
    reasonDetail: "Customer dispute resolved in buyer's favour.",
    amount: 875.5,
    currency: "USDC",
    amountUsd: 875.5,
    txHash: "refund_tx_hash_001",
    initiatedBy: "RetailEdge POS (admin)",
    createdAt: "2026-09-21T09:30:00Z",
    updatedAt: "2026-09-21T09:45:00Z",
    completedAt: "2026-09-21T09:45:00Z",
  },
  {
    id: "ref_02b3c4d5e6f7a8b9c0d1e2f3",
    paymentId: "pay_11t9hu2w3x4y5z6a7b8c9d0f",
    reference: "REF-2026-00002",
    status: "completed",
    reason: "product_unacceptable",
    reasonDetail: "Plugin incompatible with customer environment.",
    amount: 489.99,
    currency: "USDC",
    amountUsd: 489.99,
    initiatedBy: "NeonCart (support)",
    createdAt: "2026-08-21T09:00:00Z",
    updatedAt: "2026-08-21T10:00:00Z",
    completedAt: "2026-08-21T10:00:00Z",
  },
  {
    id: "ref_03c4d5e6f7a8b9c0d1e2f3a4",
    paymentId: "pay_04m2an5p6q7r8s9t0u1v2w3y",
    reference: "REF-2026-00003",
    status: "failed",
    reason: "duplicate_payment",
    reasonDetail: "Customer was charged twice at checkout.",
    amount: 120,
    currency: "XLM",
    amountUsd: 14.4,
    initiatedBy: "Ada Obi (admin)",
    createdAt: "2026-09-24T12:05:00Z",
    updatedAt: "2026-09-24T12:07:00Z",
    failureReason: "Transaction expired before the merchant wallet signed it.",
    events: [
      { status: "pending", at: "2026-09-24T12:05:00Z", note: "Refund requested" },
      { status: "processing", at: "2026-09-24T12:05:30Z", note: "Awaiting wallet signature" },
      { status: "failed", at: "2026-09-24T12:07:00Z", note: "tx_too_late" },
    ],
  },
  {
    id: "ref_04d5e6f7a8b9c0d1e2f3a4b5",
    paymentId: "pay_11t9hu2w3x4y5z6a7b8c9d0f",
    reference: "REF-2026-00004",
    status: "pending",
    reason: "product_not_received",
    amount: 45,
    currency: "EURC",
    amountUsd: 48.9,
    initiatedBy: "Sam Lee (support)",
    createdAt: "2026-09-26T08:15:00Z",
    updatedAt: "2026-09-26T08:15:00Z",
  },
  {
    id: "ref_05e6f7a8b9c0d1e2f3a4b5c6",
    paymentId: "pay_04m2an5p6q7r8s9t0u1v2w3y",
    reference: "REF-2026-00005",
    status: "processing",
    reason: "other",
    reasonDetail: "Goodwill credit.",
    amount: 25,
    currency: "USDC",
    amountUsd: 25,
    txHash: "refund_tx_hash_005",
    initiatedBy: "Ada Obi (admin)",
    createdAt: "2026-09-26T16:40:00Z",
    updatedAt: "2026-09-26T16:41:00Z",
  },
];

// ─── Escrows ──────────────────────────────────────────────────────────────────

export const ESCROW_FIXTURES: Escrow[] = [
  {
    id: "esc_01a2b3c4d5e6f7a8b9c0d1e2",
    reference: "ESC-2026-00001",
    status: "funded",
    payerId: "acc_sender_001",
    payeeId: "acc_recipient_007",
    amount: 5000.0,
    currency: "USDC",
    amountUsd: 5000.0,
    contractId: "",
    escrowAddress: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGKEVEFQ3NJ6SZ2WI2ZPFC",
    conditions: [
      {
        id: "cond_01",
        type: "approval",
        description: "Both parties must approve release.",
        isMet: false,
      },
    ],
    description: "Milestone 1 — Design phase",
    createdAt: "2026-09-20T10:00:00Z",
    updatedAt: "2026-09-20T10:05:00Z",
    expiresAt: "2026-10-20T10:00:00Z",
  },
];

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export const WEBHOOK_FIXTURES: Webhook[] = [
  {
    id: "wh_01a2b3c4d5e6f7a8b9c0d1e2",
    merchantId: "merch_01",
    url: "https://example.com/webhooks/facilpay",
    description: "Production webhook for payment events",
    status: "active",
    events: [
      "payment.completed",
      "payment.failed",
      "refund.completed",
    ],
    failureCount: 0,
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-09-24T09:18:43Z",
    lastDeliveryAt: "2026-09-24T09:18:43Z",
  },
  {
    id: "wh_02b3c4d5e6f7a8b9c0d1e2f3",
    merchantId: "merch_01",
    url: "https://staging.example.com/webhooks/facilpay",
    description: "Staging — all events",
    status: "active",
    events: [
      "payment.created",
      "payment.processing",
      "payment.completed",
      "payment.failed",
      "refund.created",
      "refund.completed",
    ],
    failureCount: 2,
    createdAt: "2026-07-15T11:00:00Z",
    updatedAt: "2026-09-10T08:00:00Z",
    lastDeliveryAt: "2026-09-26T07:32:10Z",
  },
];

// ─── API Keys ─────────────────────────────────────────────────────────────────

export const API_KEY_FIXTURES: ApiKey[] = [
  {
    id: "key_01a2b3c4d5e6f7a8b9c0d1e2",
    merchantId: "merch_01",
    name: "Production server key",
    prefix: "fp_live_sk_***",
    status: "active",
    permissions: [
      "payments:read",
      "payments:write",
      "refunds:read",
      "refunds:write",
    ],
    lastUsedAt: "2026-09-26T07:30:00Z",
    createdAt: "2026-06-01T09:00:00Z",
    updatedAt: "2026-06-01T09:00:00Z",
  },
  {
    id: "key_02b3c4d5e6f7a8b9c0d1e2f3",
    merchantId: "merch_01",
    name: "Read-only analytics key",
    prefix: "fp_live_pk_***",
    status: "active",
    permissions: ["payments:read", "payouts:read"],
    lastUsedAt: "2026-09-25T15:00:00Z",
    createdAt: "2026-08-01T09:00:00Z",
    updatedAt: "2026-08-01T09:00:00Z",
  },
];

// ─── Merchant + team ──────────────────────────────────────────────────────────

export const MERCHANT_FIXTURE: Merchant = {
  id: "merch_01",
  name: "Demo Merchant Ltd",
  slug: "demo-merchant",
  status: "active",
  tier: "growth",
  email: "admin@demo-merchant.com",
  phone: "+44 20 7946 0958",
  website: "https://demo-merchant.com",
  address: {
    line1: "123 Fintech Street",
    city: "London",
    postalCode: "EC2V 8RF",
    country: "GB",
  },
  stellarAccountId: "GDEMO123AAABBBCCCDDDEEEFFFGGGHHH",
  defaultCurrency: "USD",
  enabledNetworks: ["stellar", "ethereum"],
  kycVerifiedAt: "2026-05-01T10:00:00Z",
  createdAt: "2026-04-01T09:00:00Z",
  updatedAt: "2026-09-01T09:00:00Z",
};

export const TEAM_FIXTURES: TeamMember[] = [
  {
    id: "tm_01",
    merchantId: "merch_01",
    userId: "usr_01",
    name: "Alice Johnson",
    email: "alice@demo-merchant.com",
    role: "owner",
    status: "active",
    joinedAt: "2026-04-01T09:00:00Z",
    lastActiveAt: "2026-09-26T11:00:00Z",
    createdAt: "2026-04-01T09:00:00Z",
    updatedAt: "2026-09-26T11:00:00Z",
  },
  {
    id: "tm_02",
    merchantId: "merch_01",
    userId: "usr_02",
    name: "Bob Smith",
    email: "bob@demo-merchant.com",
    role: "developer",
    status: "active",
    joinedAt: "2026-06-15T09:00:00Z",
    lastActiveAt: "2026-09-25T16:00:00Z",
    createdAt: "2026-06-15T09:00:00Z",
    updatedAt: "2026-09-25T16:00:00Z",
  },
];

// ─── Payouts ──────────────────────────────────────────────────────────────────

export const PAYOUT_FIXTURES: Payout[] = [
  {
    id: "po_01a2b3c4d5e6f7a8b9c0d1e2",
    merchantId: "merch_01",
    reference: "PAY-OUT-2026-001",
    status: "completed",
    amount: 10000.0,
    currency: "USDC",
    amountUsd: 10000.0,
    fee: 10.0,
    netAmount: 9990.0,
    destination: {
      type: "stellar",
      address: "GDEMO123AAABBBCCCDDDEEEFFFGGGHHH",
      label: "Main Stellar wallet",
    },
    txHash: "payout_tx_hash_001",
    scheduledAt: "2026-09-25T10:00:00Z",
    createdAt: "2026-09-25T10:00:00Z",
    updatedAt: "2026-09-25T10:30:00Z",
    completedAt: "2026-09-25T10:30:00Z",
    note: "Weekly settlement",
  },
];

// ─── Analytics insights ───────────────────────────────────────────────────────

const RANGE_SCALE: Record<AnalyticsRange, number> = { "7d": 0.08, "30d": 0.33, "90d": 1, "1y": 4 };

/** Deterministic insights scaled to the requested range so widgets visibly respond to it. */
export function getAnalyticsInsightsFixture(range: AnalyticsRange, asset?: string): AnalyticsInsights {
  const k = RANGE_SCALE[range] ?? 1;
  const scale = (n: number) => Math.round(n * k * 100) / 100;
  const count = (n: number) => Math.max(1, Math.round(n * k));

  const allAssets = [
    { asset: "USDC", volume: scale(61_400), txCount: count(1_420) },
    { asset: "XLM", volume: scale(18_900), txCount: count(980) },
    { asset: "EURC", volume: scale(9_650), txCount: count(310) },
    { asset: "AQUA", volume: scale(1_200), txCount: count(64) },
  ];
  const assets = asset ? allAssets.filter((a) => a.asset === asset) : allAssets;
  const share = asset ? (assets[0]?.volume ?? 0) / allAssets.reduce((s, a) => s + a.volume, 0) : 1;
  const part = (n: number) => Math.max(0, Math.round(n * share * 100) / 100);

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86_400_000).toISOString();

  return {
    assets,
    funnel: [
      { key: "link_opened", count: count(6_800 * share) },
      { key: "wallet_connected", count: count(4_150 * share) },
      { key: "transaction_signed", count: count(2_980 * share) },
      { key: "payment_confirmed", count: count(2_774 * share) },
    ],
    topCustomers: [
      { identifier: "GBT5PBINLNRI5RJPJBOPSMODBGIHALJQJ2ISTANRF54BGM2WVIBECCNB", email: "ops@northstar.io", paymentCount: count(48), total: part(scale(9_820)), lastPaymentAt: daysAgo(1) },
      { identifier: "GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A", paymentCount: count(37), total: part(scale(7_410)), lastPaymentAt: daysAgo(2) },
      { identifier: "billing@retailedge.com", email: "billing@retailedge.com", paymentCount: count(31), total: part(scale(6_055)), lastPaymentAt: daysAgo(3) },
      { identifier: "GCEZWKCA5VLDNRLN3RPRJMRZOX3Z6G5CHCGSNFHEYVXM3XOJMDS674JZ", paymentCount: count(26), total: part(scale(5_300)), lastPaymentAt: daysAgo(1) },
      { identifier: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3B2WSQHG4W37", paymentCount: count(22), total: part(scale(4_780)), lastPaymentAt: daysAgo(5) },
      { identifier: "finance@neoncart.app", email: "finance@neoncart.app", paymentCount: count(19), total: part(scale(3_960)), lastPaymentAt: daysAgo(4) },
      { identifier: "GBDEVU63Y6NTHJQQZIKVTC23NWLQVP3WJ2RI2OTSJTNYOIGICST6DUXR", paymentCount: count(17), total: part(scale(3_410)), lastPaymentAt: daysAgo(6) },
      { identifier: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN", paymentCount: count(15), total: part(scale(2_990)), lastPaymentAt: daysAgo(8) },
      { identifier: "hello@lumenbooks.co", email: "hello@lumenbooks.co", paymentCount: count(12), total: part(scale(2_455)), lastPaymentAt: daysAgo(2) },
      { identifier: "GCKFBEIYV2U22IO2BJ4KVJOIP7XPWQGQFKKWXR6DOSJBV7STMAQSMTGG", paymentCount: count(11), total: part(scale(2_120)), lastPaymentAt: daysAgo(10) },
    ],
    paymentMethods: [
      { method: "wallet_connect", count: count(1_690 * share), volume: part(scale(52_300)) },
      { method: "qr_scan", count: count(820 * share), volume: part(scale(28_100)) },
      { method: "manual_transfer", count: count(264 * share), volume: part(scale(10_750)) },
    ],
    geography: [
      { country: "NG", volume: part(scale(24_600)), txCount: count(710 * share) },
      { country: "US", volume: part(scale(19_300)), txCount: count(540 * share) },
      { country: "BR", volume: part(scale(14_800)), txCount: count(480 * share) },
      { country: "DE", volume: part(scale(9_900)), txCount: count(260 * share) },
      { country: "KE", volume: part(scale(7_400)), txCount: count(250 * share) },
    ],
  };
}
