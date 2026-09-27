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
  API_KEY_FIXTURES,
  MERCHANT_FIXTURE,
  TEAM_FIXTURES,
  PAYOUT_FIXTURES,
  paginate,
} from "./fixtures";

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
    if (search)  items = items.filter(
      (p) =>
        p.reference.toLowerCase().includes(search) ||
        p.sender.name.toLowerCase().includes(search) ||
        p.recipient.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
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

const refundHandlers = [
  http.get(`${base}/refunds`, async ({ request }) => {
    await delay(LATENCY);
    const url      = new URL(request.url);
    const page     = Number(url.searchParams.get("page")     ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    return HttpResponse.json(paginate(REFUND_FIXTURES, page, pageSize));
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
      ? [{
          id: "del_01",
          webhookId: WEBHOOK_FIXTURES[0].id,
          event: "payment.completed" as const,
          status: "success" as const,
          responseStatus: 200,
          requestBody: JSON.stringify({ type: "payment.completed" }),
          attemptCount: 1,
          createdAt: "2026-09-24T09:18:43Z",
          deliveredAt: "2026-09-24T09:18:44Z",
        }]
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

export const handlers = [
  ...paymentHandlers,
  ...dashboardHandlers,
  ...refundHandlers,
  ...escrowHandlers,
  ...webhookHandlers,
  ...merchantHandlers,
  ...apiKeyHandlers,
  ...payoutHandlers,
];
