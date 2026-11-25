/**
 * lib/mocks/handlers.ts
 *
 * MSW v2 request handlers.  These intercept every fetch made through
 * apiClient when NEXT_PUBLIC_USE_MOCKS=true and return realistic fixture data.
 *
 * Handler conventions:
 *  - All paths are relative to NEXT_PUBLIC_API_BASE_URL (e.g. /payments)
 *  - List endpoints honour `page` and `pageSize` query params
 *  - Detail endpoints return 404 when the ID is unknown
 *  - Mutation handlers return the updated resource with a 200/201 status
 */

import { http, HttpResponse, delay } from "msw";
import { env }                        from "@/lib/env";
import {
  getPaymentFixtures,
  getDashboardFixture,
  REFUND_FIXTURES,
  ESCROW_FIXTURES,
  WEBHOOK_FIXTURES,
  WEBHOOK_DELIVERY_FIXTURE,
  API_KEY_FIXTURES,
  MERCHANT_FIXTURE,
  TEAM_FIXTURES,
  PAYOUT_FIXTURES,
  getAnalyticsInsightsFixture,
  getLinkAnalyticsFixture,
  paginate,
} from "./fixtures";
import type { AnalyticsRange } from "@/lib/types/analytics";
import type {
  Branding,
  BusinessProfile,
  CheckoutFieldsConfig,
  LinkedWallet,
  MerchantSession,
  PaymentPreferences,
  UploadLogoRequest,
} from "@/lib/types/settings";

const base = env.NEXT_PUBLIC_API_BASE_URL;

// Simulate ~200 ms network latency
const LATENCY = 200;

// ─── Payments ─────────────────────────────────────────────────────────────────

const paymentHandlers = [
  // GET /payments
  http.get(`${base}/payments`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get("page")     ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const search   = url.searchParams.get("search")?.toLowerCase();
    const status   = url.searchParams.get("status");
    const network  = url.searchParams.get("network");

    let items = getPaymentFixtures();
    if (status)  items = items.filter((p) => p.status  === status);
    if (network) items = items.filter((p) => p.network === network);
    // Matches IDs, transaction hash, customer email/address and free text.
    if (search)  items = items.filter((p) =>
      [
        p.id,
        p.reference,
        p.onChain?.txHash,
        p.sender.name,
        p.sender.email,
        p.sender.walletAddress,
        p.recipient.name,
        p.description,
      ].some((value) => value?.toLowerCase().includes(search))
    );

    return HttpResponse.json(paginate(items, page, pageSize));
  }),

  // GET /payments/:id
  http.get(`${base}/payments/:id`, async ({ params }) => {
    await delay(LATENCY);
    const payment = getPaymentFixtures().find((p) => p.id === params.id);
    if (!payment) {
      return HttpResponse.json(
        { code: "payment_not_found", message: `Payment ${params.id} not found.` },
        { status: 404 }
      );
    }
    return HttpResponse.json(payment);
  }),

  // POST /payments
  http.post(`${base}/payments`, async ({ request }) => {
    await delay(LATENCY);
    const body = await request.json() as Record<string, unknown>;
    const stub = {
      ...getPaymentFixtures()[0],
      id:        `pay_new_${Date.now()}`,
      reference: `FP-2026-${String(Math.floor(Math.random() * 99999)).padStart(5, "0")}`,
      status:    "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };
    return HttpResponse.json(stub, { status: 201 });
  }),

  // POST /payments/:id/cancel
  http.post(`${base}/payments/:id/cancel`, async ({ params }) => {
    await delay(LATENCY);
    const payment = getPaymentFixtures().find((p) => p.id === params.id);
    if (!payment) return HttpResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
    return HttpResponse.json({ ...payment, status: "cancelled", updatedAt: new Date().toISOString() });
  }),

  // POST /payments/:id/retry
  http.post(`${base}/payments/:id/retry`, async ({ params }) => {
    await delay(LATENCY);
    const payment = getPaymentFixtures().find((p) => p.id === params.id);
    if (!payment) return HttpResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
    return HttpResponse.json({ ...payment, status: "processing", updatedAt: new Date().toISOString() });
  }),

  // POST /payments/:id/refund
  http.post(`${base}/payments/:paymentId/refund`, async ({ params }) => {
    await delay(LATENCY);
    const refund = REFUND_FIXTURES.find((r) => r.paymentId === params.paymentId)
      ?? { ...REFUND_FIXTURES[0], id: `ref_new_${Date.now()}`, paymentId: params.paymentId as string };
    return HttpResponse.json(refund, { status: 201 });
  }),
];

// ─── Dashboard ────────────────────────────────────────────────────────────────

const dashboardHandlers = [
  http.get(`${base}/dashboard`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(getDashboardFixture());
  }),
];

// ─── Refunds ──────────────────────────────────────────────────────────────────

function filterRefunds(search: URLSearchParams) {
  const status = search.get("status");
  const asset  = search.get("asset");
  const from   = search.get("from");
  const to     = search.get("to");
  const q      = search.get("q")?.toLowerCase().trim();
  return REFUND_FIXTURES.filter((r) => {
    const day = r.createdAt.slice(0, 10);
    if (status && r.status !== status) return false;
    if (asset && r.currency !== asset) return false;
    if (from && day < from) return false;
    if (to && day > to) return false;
    if (q && ![r.id, r.reference, r.paymentId, r.txHash ?? ""].some((v) => v.toLowerCase().includes(q))) return false;
    return true;
  });
}

const refundHandlers = [
  http.get(`${base}/refunds`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get("page")     ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    return HttpResponse.json(paginate(filterRefunds(url.searchParams), page, pageSize));
  }),

  http.get(`${base}/refunds/summary`, async ({ request }) => {
    await delay(LATENCY);
    const items = filterRefunds(new URL(request.url).searchParams);
    const totalRefunded = items
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + (r.amountUsd ?? r.amount), 0);
    return HttpResponse.json({
      totalRefunded,
      currency: "USD",
      refundRate: totalRefunded / 48_250,
      pendingCount: items.filter((r) => r.status === "pending" || r.status === "processing").length,
    });
  }),

  http.post(`${base}/refunds/:id/retry`, async ({ params }) => {
    await delay(LATENCY);
    const refund = REFUND_FIXTURES.find((r) => r.id === params.id);
    if (!refund) return HttpResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
    if (refund.status !== "failed") {
      return HttpResponse.json({ code: "invalid_state", message: "Only failed refunds can be retried." }, { status: 409 });
    }
    return HttpResponse.json({
      refund: { ...refund, status: "processing", updatedAt: new Date().toISOString() },
    });
  }),

  http.post(`${base}/refunds/:id/submit`, async ({ params }) => {
    await delay(LATENCY);
    const refund = REFUND_FIXTURES.find((r) => r.id === params.id);
    if (!refund) return HttpResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
    return HttpResponse.json({ ...refund, status: "processing", updatedAt: new Date().toISOString() });
  }),

  http.get(`${base}/payments/:paymentId/refunds`, async ({ params }) => {
    await delay(LATENCY);
    const items = REFUND_FIXTURES.filter((r) => r.paymentId === params.paymentId);
    return HttpResponse.json(paginate(items, 1, 10));
  }),

  http.get(`${base}/refunds/:id`, async ({ params }) => {
    await delay(LATENCY);
    const refund = REFUND_FIXTURES.find((r) => r.id === params.id);
    if (!refund) return HttpResponse.json({ code: "not_found", message: "Refund not found." }, { status: 404 });
    return HttpResponse.json(refund);
  }),

  http.post(`${base}/refunds/:id/cancel`, async ({ params }) => {
    await delay(LATENCY);
    const refund = REFUND_FIXTURES.find((r) => r.id === params.id);
    if (!refund) return HttpResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
    return HttpResponse.json({ ...refund, status: "cancelled", updatedAt: new Date().toISOString() });
  }),
];

// ─── Escrows ──────────────────────────────────────────────────────────────────

const escrowHandlers = [
  http.get(`${base}/escrows`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get("page")     ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    return HttpResponse.json(paginate(ESCROW_FIXTURES, page, pageSize));
  }),

  http.get(`${base}/escrows/:id`, async ({ params }) => {
    await delay(LATENCY);
    const escrow = ESCROW_FIXTURES.find((e) => e.id === params.id);
    if (!escrow) return HttpResponse.json({ code: "not_found", message: "Escrow not found." }, { status: 404 });
    return HttpResponse.json(escrow);
  }),
];

// ─── Webhooks ─────────────────────────────────────────────────────────────────

const webhookHandlers = [
  http.get(`${base}/webhooks`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get("page")     ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    return HttpResponse.json(paginate(WEBHOOK_FIXTURES, page, pageSize));
  }),

  http.get(`${base}/webhooks/:id`, async ({ params }) => {
    await delay(LATENCY);
    const wh = WEBHOOK_FIXTURES.find((w) => w.id === params.id);
    if (!wh) return HttpResponse.json({ code: "not_found", message: "Webhook not found." }, { status: 404 });
    return HttpResponse.json(wh);
  }),

  http.post(`${base}/webhooks`, async ({ request }) => {
    await delay(LATENCY);
    const body = await request.json() as Record<string, unknown>;
    const stub = {
      ...WEBHOOK_FIXTURES[0],
      id: `wh_new_${Date.now()}`,
      secret: "whsec_mock_secret_for_development_only",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      failureCount: 0,
      ...body,
    };
    return HttpResponse.json(stub, { status: 201 });
  }),

  http.patch(`${base}/webhooks/:id`, async ({ params, request }) => {
    await delay(LATENCY);
    const wh   = WEBHOOK_FIXTURES.find((w) => w.id === params.id);
    if (!wh) return HttpResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...wh, ...body, updatedAt: new Date().toISOString() });
  }),

  http.delete(`${base}/webhooks/:id`, async ({ params }) => {
    await delay(LATENCY);
    const exists = WEBHOOK_FIXTURES.some((w) => w.id === params.id);
    if (!exists) return HttpResponse.json({ code: "not_found", message: "Not found." }, { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${base}/webhooks/:id/deliveries`, async ({ params }) => {
    await delay(LATENCY);
    // Return empty paginated list for non-fixture IDs
    const deliveries = params.id === WEBHOOK_FIXTURES[0].id
      ? [WEBHOOK_DELIVERY_FIXTURE]
      : [];
    return HttpResponse.json(paginate(deliveries, 1, 10));
  }),
];

// ─── Merchant ─────────────────────────────────────────────────────────────────

const merchantHandlers = [
  http.get(`${base}/merchant`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(MERCHANT_FIXTURE);
  }),

  http.get(`${base}/merchant/team`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(TEAM_FIXTURES);
  }),

  http.post(`${base}/merchant/team/invite`, async ({ request }) => {
    await delay(LATENCY);
    const body = await request.json() as Record<string, unknown>;
    const stub = {
      ...TEAM_FIXTURES[1],
      id: `tm_new_${Date.now()}`,
      status: "invited",
      invitedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };
    return HttpResponse.json(stub, { status: 201 });
  }),

  http.patch(`${base}/merchant/team/:id`, async ({ params, request }) => {
    await delay(LATENCY);
    const member = TEAM_FIXTURES.find((m) => m.id === params.id);
    if (!member) return HttpResponse.json({ code: "not_found", message: "Team member not found." }, { status: 404 });
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...member, ...body, updatedAt: new Date().toISOString() });
  }),

  http.delete(`${base}/merchant/team/:id`, async () => {
    await delay(LATENCY);
    return new HttpResponse(null, { status: 204 });
  }),
];

// ─── API Keys ─────────────────────────────────────────────────────────────────

const apiKeyHandlers = [
  http.get(`${base}/api-keys`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get("page")     ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    return HttpResponse.json(paginate(API_KEY_FIXTURES, page, pageSize));
  }),

  http.post(`${base}/api-keys`, async ({ request }) => {
    await delay(LATENCY);
    const body = await request.json() as Record<string, unknown>;
    const stub = {
      ...API_KEY_FIXTURES[0],
      id: `key_new_${Date.now()}`,
      prefix: "fp_live_sk_***",
      key: `fp_live_sk_mock_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };
    return HttpResponse.json(stub, { status: 201 });
  }),

  http.post(`${base}/api-keys/:id/roll`, async ({ params, request }) => {
    await delay(LATENCY);
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const rolledKey = {
      ...API_KEY_FIXTURES[0],
      id: `key_rolled_${Date.now()}`,
      prefix: "fp_live_sk_***",
      key: `fp_live_sk_mock_rolled_${Date.now()}`,
      status: "rolling",
      createdAt: new Date().toISOString(),
      rollingExpiresAt: new Date(Date.now() + 86400000).toISOString(),
      ...body,
    };
    return HttpResponse.json(rolledKey, { status: 200 });
  }),

  http.delete(`${base}/api-keys/:id`, async () => {
    await delay(LATENCY);
    return new HttpResponse(null, { status: 204 });
  }),
];

// ─── Payouts ──────────────────────────────────────────────────────────────────

const payoutHandlers = [
  http.get(`${base}/payouts`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get("page")     ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    return HttpResponse.json(paginate(PAYOUT_FIXTURES, page, pageSize));
  }),

  http.get(`${base}/payouts/:id`, async ({ params }) => {
    await delay(LATENCY);
    const payout = PAYOUT_FIXTURES.find((p) => p.id === params.id);
    if (!payout) return HttpResponse.json({ code: "not_found", message: "Payout not found." }, { status: 404 });
    return HttpResponse.json(payout);
  }),

  http.post(`${base}/payouts`, async ({ request }) => {
    await delay(LATENCY);
    const body = await request.json() as Record<string, unknown>;
    const stub = {
      ...PAYOUT_FIXTURES[0],
      id: `po_new_${Date.now()}`,
      reference: `PAY-OUT-${Date.now()}`,
      status: "scheduled",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...body,
    };
    return HttpResponse.json(stub, { status: 201 });
  }),
];

// ─── Combined export ──────────────────────────────────────────────────────────

// ─── Analytics ────────────────────────────────────────────────────────────────

const analyticsHandlers = [
  http.get(`${base}/analytics/insights`, async ({ request }) => {
    await delay(LATENCY);
    const url   = new URL(request.url);
    const range = (url.searchParams.get("range") ?? "90d") as AnalyticsRange;
    const asset = url.searchParams.get("asset") ?? undefined;
    return HttpResponse.json(getAnalyticsInsightsFixture(range, asset));
  }),

  // Issue #134 — per-link analytics shown on a payment's detail page.
  http.get(`${base}/payments/:id/link-analytics`, async ({ params }) => {
    await delay(LATENCY);
    return HttpResponse.json(getLinkAnalyticsFixture(params.id as string));
  }),
];

// ─── Settings ─────────────────────────────────────────────────────────────────

let businessProfile: BusinessProfile = {
  businessName: "Northstar Goods",
  legalName: "Northstar Goods Ltd.",
  website: "https://northstar.example",
  supportEmail: "support@northstar.example",
  country: "NG",
  category: "retail",
  settlementAddress: "GBT5PBINLNRI5RJPJBOPSMODBGIHALJQJ2ISTANRF54BGM2WVIBECCNB",
};

let branding: Branding = { logoUrl: null, brandColor: "#20A7EE" };

let paymentPreferences: PaymentPreferences = {
  acceptedAssets: ["XLM", "USDC"],
  defaultLinkExpiryHours: 24,
  defaultRedirectUrl: "https://northstar.example/thanks",
  memoPrefix: "NSG",
};

let sessions: MerchantSession[] = [
  { id: "sess_current", device: "MacBook Pro", browser: "Chrome 140", ipAddress: "102.89.34.10", location: "Lagos, NG", lastActiveAt: new Date().toISOString(), createdAt: "2026-09-20T08:00:00Z", current: true },
  { id: "sess_iphone", device: "iPhone 16", browser: "Safari", ipAddress: "102.89.40.2", location: "Lagos, NG", lastActiveAt: "2026-09-26T19:12:00Z", createdAt: "2026-09-01T10:00:00Z", current: false },
  { id: "sess_windows", device: "Windows PC", browser: "Edge 139", ipAddress: "41.58.12.77", location: "Abuja, NG", lastActiveAt: "2026-09-18T07:45:00Z", createdAt: "2026-08-15T09:30:00Z", current: false },
];

const linkedWallets: LinkedWallet[] = [
  { address: "GBT5PBINLNRI5RJPJBOPSMODBGIHALJQJ2ISTANRF54BGM2WVIBECCNB", label: "Treasury", provider: "freighter", isSettlement: true, linkedAt: "2026-06-02T12:00:00Z" },
  { address: "GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A", label: "Refunds hot wallet", provider: "xbull", isSettlement: false, linkedAt: "2026-07-19T15:30:00Z" },
];

let checkoutFieldsConfig: CheckoutFieldsConfig = {
  fields: [
    { id: "field_email", type: "email", label: "Email address", placeholder: "you@example.com", required: true },
    { id: "field_phone", type: "phone", label: "Phone number", placeholder: "+1 555 000 0000", required: false },
  ],
};

const settingsHandlers = [
  http.get(`${base}/merchant/profile`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(businessProfile);
  }),

  http.patch(`${base}/merchant/profile`, async ({ request }) => {
    await delay(LATENCY);
    businessProfile = { ...businessProfile, ...((await request.json()) as Partial<BusinessProfile>) };
    return HttpResponse.json(businessProfile);
  }),

  http.get(`${base}/merchant/branding`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(branding);
  }),

  http.post(`${base}/merchant/branding/logo`, async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as UploadLogoRequest;
    // The mock simply echoes the data URL back as the hosted logo URL
    return HttpResponse.json({ logoUrl: body.dataUrl }, { status: 201 });
  }),

  http.patch(`${base}/merchant/branding`, async ({ request }) => {
    await delay(LATENCY);
    branding = { ...branding, ...((await request.json()) as Partial<Branding>) };
    return HttpResponse.json(branding);
  }),

  // Issue #135 — lets the branding editor send a sample receipt to the
  // merchant's own address using the current (possibly unsaved) form values.
  http.post(`${base}/merchant/branding/test-receipt`, async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as { to: string };
    return HttpResponse.json({ sent: true, to: body.to });
  }),

  http.get(`${base}/merchant/preferences`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(paymentPreferences);
  }),

  http.patch(`${base}/merchant/preferences`, async ({ request }) => {
    await delay(LATENCY);
    paymentPreferences = { ...paymentPreferences, ...((await request.json()) as Partial<PaymentPreferences>) };
    return HttpResponse.json(paymentPreferences);
  }),

  http.get(`${base}/merchant/sessions`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(sessions);
  }),

  http.post(`${base}/merchant/sessions/revoke-others`, async () => {
    await delay(LATENCY);
    sessions = sessions.filter((s) => s.current);
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${base}/merchant/sessions/:id`, async ({ params }) => {
    await delay(LATENCY);
    sessions = sessions.filter((s) => s.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${base}/merchant/wallets`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(linkedWallets);
  }),

  http.get(`${base}/merchant/checkout-fields`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(checkoutFieldsConfig);
  }),

  http.patch(`${base}/merchant/checkout-fields`, async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as CheckoutFieldsConfig;
    checkoutFieldsConfig = body;
    return HttpResponse.json(checkoutFieldsConfig);
  }),
];

// ─── Two-factor authentication ────────────────────────────────────────────────
//
// The mock accepts any 6-digit code except 000000 (use it to exercise the
// error path) and each recovery code exactly once.

const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

let twoFactor = {
  enabled: false,
  enrolledAt: null as string | null,
  pendingSecret: null as string | null,
  recoveryCodes: [] as string[],
};
const loginChallenges = new Set<string>();
const stepUpTokens = new Set<string>();

function randomRecoveryCode(): string {
  const pick = () => RECOVERY_ALPHABET[Math.floor(Math.random() * RECOVERY_ALPHABET.length)];
  return `${Array.from({ length: 4 }, pick).join("")}-${Array.from({ length: 4 }, pick).join("")}`;
}

function acceptCode(raw: string, allowRecovery = true): boolean {
  const code = raw.replace(/\s+/g, "").toUpperCase();
  if (/^\d{6}$/.test(code)) return code !== "000000";
  if (!allowRecovery) return false;
  const dashed = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
  const index = twoFactor.recoveryCodes.indexOf(dashed);
  if (index === -1) return false;
  twoFactor.recoveryCodes.splice(index, 1);
  return true;
}

// 422, not 401: apiClient treats 401 as an expired session.
const invalidCode = () =>
  HttpResponse.json({ code: "invalid_two_factor_code", message: "That code is incorrect or has expired." }, { status: 422 });

const twoFactorStatus = () => ({
  enabled: twoFactor.enabled,
  enrolledAt: twoFactor.enrolledAt,
  recoveryCodesRemaining: twoFactor.recoveryCodes.length,
});

const twoFactorHandlers = [
  http.get(`${base}/merchant/2fa`, async () => {
    await delay(LATENCY);
    return HttpResponse.json(twoFactorStatus());
  }),

  http.post(`${base}/merchant/2fa/enroll`, async () => {
    await delay(LATENCY);
    if (twoFactor.enabled) {
      return HttpResponse.json({ code: "already_enabled", message: "Two-factor authentication is already on." }, { status: 409 });
    }
    const secret = Array.from({ length: 32 }, () => "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]).join("");
    twoFactor.pendingSecret = secret;
    const label = encodeURIComponent(`FacilPay:${businessProfile.supportEmail}`);
    return HttpResponse.json({ secret, otpauthUrl: `otpauth://totp/${label}?secret=${secret}&issuer=FacilPay&digits=6&period=30` });
  }),

  http.post(`${base}/merchant/2fa/enroll/confirm`, async ({ request }) => {
    await delay(LATENCY);
    const { code } = (await request.json()) as { code: string };
    if (!twoFactor.pendingSecret || !acceptCode(code, false)) return invalidCode();
    const recoveryCodes = Array.from({ length: 10 }, randomRecoveryCode);
    twoFactor = { enabled: true, enrolledAt: new Date().toISOString(), pendingSecret: null, recoveryCodes: [...recoveryCodes] };
    return HttpResponse.json({ recoveryCodes });
  }),

  http.post(`${base}/merchant/2fa/disable`, async ({ request }) => {
    await delay(LATENCY);
    const { password, code } = (await request.json()) as { password: string; code: string };
    if (!password) return HttpResponse.json({ code: "invalid_password", message: "Password is incorrect." }, { status: 422 });
    if (!acceptCode(code)) return invalidCode();
    twoFactor = { enabled: false, enrolledAt: null, pendingSecret: null, recoveryCodes: [] };
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${base}/merchant/2fa/verify`, async ({ request }) => {
    await delay(LATENCY);
    const { code } = (await request.json()) as { action: string; code: string };
    if (!twoFactor.enabled || !acceptCode(code)) return invalidCode();
    const token = `stepup_${Math.random().toString(36).slice(2)}`;
    stepUpTokens.add(token);
    return HttpResponse.json({ token, expiresAt: new Date(Date.now() + 5 * 60_000).toISOString() });
  }),
];

// ─── Auth ─────────────────────────────────────────────────────────────────────

const authHandlers = [
  http.post(`${base}/auth/login`, async () => {
    await delay(LATENCY);
    if (twoFactor.enabled) {
      const challengeId = `chal_${Math.random().toString(36).slice(2)}`;
      loginChallenges.add(challengeId);
      return HttpResponse.json({ status: "two_factor_required", challengeId });
    }
    return HttpResponse.json({ status: "authenticated", token: `mock_${Date.now()}` });
  }),

  http.post(`${base}/auth/login/2fa`, async ({ request }) => {
    await delay(LATENCY);
    const { challengeId, code } = (await request.json()) as { challengeId: string; code: string };
    if (!loginChallenges.has(challengeId) || !acceptCode(code)) return invalidCode();
    loginChallenges.delete(challengeId);
    return HttpResponse.json({ token: `mock_${Date.now()}` });
  }),
];

/** Mirrors the API: a changed settlement address needs a step-up token while 2FA is on. */
const stepUpGuardHandlers = [
  http.patch(`${base}/merchant/profile`, async ({ request }) => {
    const body = (await request.clone().json()) as Partial<BusinessProfile>;
    const changesSettlement = body.settlementAddress !== undefined && body.settlementAddress !== businessProfile.settlementAddress;
    const token = request.headers.get("X-FacilPay-2FA-Token");
    if (twoFactor.enabled && changesSettlement && !(token && stepUpTokens.delete(token))) {
      await delay(LATENCY);
      return HttpResponse.json({ code: "step_up_required", message: "Confirm this change with a two-factor code." }, { status: 403 });
    }
    // Fall through to the regular profile handler
    return undefined;
  }),
];

// ─── Payment Links ────────────────────────────────────────────────────────────
// Module-level store so PATCH/POST mutations survive for the session.

interface PaymentLinkRecord {
  id: string;
  title: string;
  amount: string;
  currency: 'USDC' | 'EURC' | 'XLM';
  description: string;
  paymentUrl: string;
  createdAt: string;
  status: 'active' | 'paid' | 'expired';
  maxUses: number | null;
  useCount: number;
  expiresAt: string | null;
}

let paymentLinks: PaymentLinkRecord[] = [
  {
    id: 'pl_test_fixture_01',
    title: 'Product Launch Special',
    amount: '49.00',
    currency: 'USDC',
    description: 'Limited-time offer — first 10 customers only.',
    paymentUrl: 'https://pay.facilpay.io/pay/pl_test_fixture_01',
    createdAt: '2026-11-01T10:00:00Z',
    status: 'active',
    maxUses: 10,
    useCount: 7,
    expiresAt: '2026-12-31T23:59:59Z',
  },
  {
    id: 'pl_test_fixture_02',
    title: 'One-off Invoice #INV-2042',
    amount: '1200.00',
    currency: 'USDC',
    description: 'Professional services invoice.',
    paymentUrl: 'https://pay.facilpay.io/pay/pl_test_fixture_02',
    createdAt: '2026-11-10T08:00:00Z',
    status: 'active',
    maxUses: 1,
    useCount: 0,
    expiresAt: null,
  },
  {
    id: 'pl_test_fixture_03',
    title: 'Black Friday Deal',
    amount: '19.99',
    currency: 'USDC',
    description: 'Black Friday promo — expired.',
    paymentUrl: 'https://pay.facilpay.io/pay/pl_test_fixture_03',
    createdAt: '2026-11-15T00:00:00Z',
    status: 'expired',
    maxUses: null,
    useCount: 0,
    expiresAt: '2026-11-30T23:59:59Z',
  },
];

const paymentLinkHandlers = [
  // GET /payment-links
  http.get(`${base}/payment-links`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get('page')     ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    return HttpResponse.json(paginate(paymentLinks, page, pageSize));
  }),

  // GET /payment-links/:id
  http.get(`${base}/payment-links/:id`, async ({ params }) => {
    await delay(LATENCY);
    const link = paymentLinks.find((l) => l.id === params.id);
    if (!link) return HttpResponse.json({ code: 'not_found', message: 'Payment link not found.' }, { status: 404 });
    return HttpResponse.json(link);
  }),

  // POST /payment-links
  http.post(`${base}/payment-links`, async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as Partial<PaymentLinkRecord>;
    // Validate expiry is not in the past
    if (body.expiresAt && new Date(body.expiresAt).getTime() <= Date.now()) {
      return HttpResponse.json({ code: 'validation_error', message: 'expiresAt must be in the future.' }, { status: 422 });
    }
    if (body.maxUses !== undefined && body.maxUses !== null && body.maxUses < 1) {
      return HttpResponse.json({ code: 'validation_error', message: 'maxUses must be a positive integer.' }, { status: 422 });
    }
    const newLink: PaymentLinkRecord = {
      id: `pl_${Date.now().toString(36)}`,
      title: body.title ?? 'Untitled',
      amount: body.amount ?? '0.00',
      currency: body.currency ?? 'USDC',
      description: body.description ?? '',
      paymentUrl: `https://pay.facilpay.io/pay/pl_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      maxUses: body.maxUses ?? null,
      useCount: 0,
      expiresAt: body.expiresAt ?? null,
    };
    paymentLinks = [newLink, ...paymentLinks];
    return HttpResponse.json(newLink, { status: 201 });
  }),

  // PATCH /payment-links/:id — allows editing or clearing maxUses / expiresAt
  http.patch(`${base}/payment-links/:id`, async ({ params, request }) => {
    await delay(LATENCY);
    const idx = paymentLinks.findIndex((l) => l.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: 'not_found', message: 'Payment link not found.' }, { status: 404 });
    const body = (await request.json()) as Partial<PaymentLinkRecord>;
    if (body.expiresAt && new Date(body.expiresAt).getTime() <= Date.now()) {
      return HttpResponse.json({ code: 'validation_error', message: 'expiresAt must be in the future.' }, { status: 422 });
    }
    if (body.maxUses !== undefined && body.maxUses !== null && body.maxUses < 1) {
      return HttpResponse.json({ code: 'validation_error', message: 'maxUses must be a positive integer.' }, { status: 422 });
    }
    const updated = { ...paymentLinks[idx], ...body, updatedAt: new Date().toISOString() };
    paymentLinks[idx] = updated as PaymentLinkRecord;
    return HttpResponse.json(updated);
  }),

  // DELETE /payment-links/:id
  http.delete(`${base}/payment-links/:id`, async ({ params }) => {
    await delay(LATENCY);
    const exists = paymentLinks.some((l) => l.id === params.id);
    if (!exists) return HttpResponse.json({ code: 'not_found', message: 'Payment link not found.' }, { status: 404 });
    paymentLinks = paymentLinks.filter((l) => l.id !== params.id);
    return new HttpResponse(null, { status: 204 });
  }),
];


// --- Coupons ------------------------------------------------------------------

interface CouponRecord {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency?: string;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  status: 'active' | 'archived';
  createdAt: string;
  updatedAt: string;
}

let coupons: CouponRecord[] = [
  {
    id: 'coup_01',
    code: 'LAUNCH20',
    type: 'percentage',
    value: 20,
    expiresAt: '2026-12-31T23:59:59Z',
    maxRedemptions: 100,
    redemptionCount: 14,
    status: 'active',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'coup_02',
    code: 'SAVE5',
    type: 'fixed',
    value: 5,
    currency: 'USDC',
    expiresAt: null,
    maxRedemptions: null,
    redemptionCount: 42,
    status: 'active',
    createdAt: '2026-10-15T00:00:00Z',
    updatedAt: '2026-10-15T00:00:00Z',
  },
  {
    id: 'coup_03',
    code: 'OLDPROMO',
    type: 'percentage',
    value: 15,
    expiresAt: '2026-10-01T00:00:00Z',
    maxRedemptions: 50,
    redemptionCount: 50,
    status: 'archived',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
  },
];

function validateCouponCode(
  code: string,
  orderAmount: number,
  currency: string
): { valid: true; coupon: CouponRecord; discountAmount: number } | { valid: false; error: string } {
  const c = coupons.find((x) => x.code.toUpperCase() === code.toUpperCase().trim());
  if (!c) return { valid: false, error: 'Coupon code not found.' };
  if (c.status === 'archived') return { valid: false, error: 'This coupon has been archived.' };
  if (c.expiresAt && new Date(c.expiresAt).getTime() <= Date.now()) return { valid: false, error: 'This coupon has expired.' };
  if (c.maxRedemptions !== null && c.redemptionCount >= c.maxRedemptions) return { valid: false, error: 'This coupon has reached its redemption limit.' };
  const discount =
    c.type === 'percentage'
      ? Math.min(orderAmount, (c.value / 100) * orderAmount)
      : Math.min(orderAmount, c.value);
  return { valid: true, coupon: c, discountAmount: Math.round(discount * 100) / 100 };
}

const couponHandlers = [
  http.get(`${base}/coupons`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get('page')     ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 10);
    const status   = url.searchParams.get('status');
    const items    = status ? coupons.filter((c) => c.status === status) : coupons;
    return HttpResponse.json(paginate(items, page, pageSize));
  }),

  http.get(`${base}/coupons/:id`, async ({ params }) => {
    await delay(LATENCY);
    const c = coupons.find((x) => x.id === params.id);
    if (!c) return HttpResponse.json({ code: 'not_found', message: 'Coupon not found.' }, { status: 404 });
    return HttpResponse.json(c);
  }),

  http.post(`${base}/coupons`, async ({ request }) => {
    await delay(LATENCY);
    const body = (await request.json()) as Partial<CouponRecord>;
    if (!body.code?.trim()) return HttpResponse.json({ code: 'validation_error', message: 'code is required.' }, { status: 422 });
    if (coupons.some((c) => c.code.toUpperCase() === body.code!.toUpperCase()))
      return HttpResponse.json({ code: 'validation_error', message: 'A coupon with this code already exists.' }, { status: 422 });
    if (body.expiresAt && new Date(body.expiresAt).getTime() <= Date.now())
      return HttpResponse.json({ code: 'validation_error', message: 'expiresAt must be in the future.' }, { status: 422 });
    if (body.maxRedemptions !== undefined && body.maxRedemptions !== null && body.maxRedemptions < 1)
      return HttpResponse.json({ code: 'validation_error', message: 'maxRedemptions must be a positive integer.' }, { status: 422 });
    const newCoupon: CouponRecord = {
      id: `coup_${Date.now().toString(36)}`,
      code: body.code.trim().toUpperCase(),
      type: body.type ?? 'percentage',
      value: body.value ?? 10,
      currency: body.currency,
      expiresAt: body.expiresAt ?? null,
      maxRedemptions: body.maxRedemptions ?? null,
      redemptionCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    coupons = [newCoupon, ...coupons];
    return HttpResponse.json(newCoupon, { status: 201 });
  }),

  http.patch(`${base}/coupons/:id`, async ({ params, request }) => {
    await delay(LATENCY);
    const idx = coupons.findIndex((c) => c.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: 'not_found', message: 'Coupon not found.' }, { status: 404 });
    const body = (await request.json()) as Partial<CouponRecord>;
    coupons[idx] = { ...coupons[idx], ...body, updatedAt: new Date().toISOString() };
    return HttpResponse.json(coupons[idx]);
  }),

  http.post(`${base}/coupons/validate`, async ({ request }) => {
    await delay(LATENCY);
    const { code, orderAmount, currency } = (await request.json()) as { code: string; orderAmount: number; currency: string };
    const result = validateCouponCode(code, orderAmount, currency ?? 'USDC');
    if (!result.valid) return HttpResponse.json({ code: 'invalid_coupon', message: result.error }, { status: 422 });
    return HttpResponse.json({
      coupon: result.coupon,
      discountAmount: result.discountAmount,
      finalAmount: Math.round((orderAmount - result.discountAmount) * 100) / 100,
    });
  }),

  http.post(`${base}/coupons/:id/redeem`, async ({ params }) => {
    await delay(LATENCY);
    const idx = coupons.findIndex((c) => c.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: 'not_found', message: 'Coupon not found.' }, { status: 404 });
    coupons[idx] = { ...coupons[idx], redemptionCount: coupons[idx].redemptionCount + 1, updatedAt: new Date().toISOString() };
    return HttpResponse.json(coupons[idx]);
  }),
];

export const handlers = [
  ...stepUpGuardHandlers,
  ...authHandlers,
  ...twoFactorHandlers,
  ...paymentHandlers,
  ...dashboardHandlers,
  ...refundHandlers,
  ...escrowHandlers,
  ...webhookHandlers,
  ...merchantHandlers,
  ...apiKeyHandlers,
  ...payoutHandlers,
  ...analyticsHandlers,
  ...settingsHandlers,
  ...paymentLinkHandlers,
  ...couponHandlers,
];
