import {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEndpoint,
  WebhookEventType,
  DayHealthStat,
} from '@/types/webhooks';

export const STORAGE_KEYS = {
  WEBHOOK_DELIVERIES: 'facilpay_webhook_deliveries',
  WEBHOOK_ENDPOINTS: 'facilpay_webhook_endpoints',
} as const;

export const DEFAULT_ENDPOINT: WebhookEndpoint = {
  id: 'ep_prod_89a2b',
  url: 'https://api.acmestore.com/api/v1/webhooks/facilpay',
  description: 'Primary Production Payment & Order Processing Webhook',
  secret: 'whsec_7f9b8c2d1e0a4f5e6b7c8d9e0f1a2b3c4d5e6f7a',
  createdAt: '2026-09-20T10:00:00Z',
  status: 'active',
  subscribedEvents: [
    'payment.created',
    'payment.completed',
    'payment.failed',
    'refund.completed',
    'escrow.released',
  ],
  successRate24h: 94,
};

export const INITIAL_ENDPOINTS: WebhookEndpoint[] = [
  DEFAULT_ENDPOINT,
  {
    id: 'ep_local_dev11',
    url: 'http://localhost:3000/api/webhooks',
    description: 'Local Dev Server (Testnet Listener)',
    secret: 'whsec_4b1a8c9e0d2f3a4b5c6d7e8f9a0b1c2d',
    createdAt: '2026-09-22T14:30:00Z',
    status: 'active',
    subscribedEvents: ['payment.completed', 'refund.created', 'refund.completed'],
    successRate24h: 100,
  },
  {
    id: 'ep_backup_09x',
    url: 'https://hooks.slack.com/services/T000/B000/XXXXX',
    description: 'Internal Ops Alerts & Notifications',
    secret: 'whsec_9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f',
    createdAt: '2026-09-24T08:15:00Z',
    status: 'inactive',
    subscribedEvents: ['payment.failed', 'refund.failed', 'escrow.disputed'],
    successRate24h: 75,
  },
];


const NOW = Date.now();
const HOUR = 3600 * 1000;
const DAY = 24 * HOUR;

export const INITIAL_DELIVERIES: WebhookDelivery[] = [
  {
    id: 'del_01j8m99a',
    eventId: 'evt_pay_99a8b1c2',
    eventType: 'payment.completed',
    status: 'succeeded',
    httpStatus: 200,
    statusText: 'OK',
    attemptCount: 1,
    deliveredAt: new Date(NOW - 15 * 60 * 1000).toISOString(),
    endpointId: 'ep_prod_89a2b',
    request: {
      url: 'https://api.acmestore.com/api/v1/webhooks/facilpay',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FacilPay-Webhooks/1.0',
        'X-FacilPay-Signature': 't=1790418376,v1=7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
        'X-FacilPay-Event-ID': 'evt_pay_99a8b1c2',
        'X-FacilPay-Delivery-ID': 'del_01j8m99a',
      },
      payload: {
        id: 'evt_pay_99a8b1c2',
        event: 'payment.completed',
        timestamp: new Date(NOW - 15 * 60 * 1000).toISOString(),
        data: {
          payment_id: 'pl_test_7f9b2d01',
          transaction_hash: '9f8c3d2e1b0a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e',
          amount: '50.00',
          currency: 'USDC',
          asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          customer_account: 'GABCD3XYZ99238KLMS72782910AAJJWWQQOPPLKKJJHGFEDCBA7766554433221',
          merchant_account: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
          status: 'settled',
          network: 'stellar_testnet',
          metadata: {
            order_id: 'ord_90192',
            customer_email: 'buyer@example.com',
          },
        },
      },
    },
    response: {
      statusCode: 200,
      statusText: 'OK',
      responseTimeMs: 142,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'date': new Date(NOW - 15 * 60 * 1000).toUTCString(),
        'server': 'nginx/1.24.0',
        'x-request-id': 'req_acme_99218',
      },
      body: JSON.stringify({ received: true, order_status: 'paid', order_id: 'ord_90192' }, null, 2),
    },
    attempts: [
      {
        attemptNumber: 1,
        timestamp: new Date(NOW - 15 * 60 * 1000).toISOString(),
        httpStatus: 200,
        statusText: 'OK',
        responseTimeMs: 142,
        result: 'succeeded',
      },
    ],
  },
  {
    id: 'del_01j8m99b',
    eventId: 'evt_pay_77c8d9e0',
    eventType: 'payment.completed',
    status: 'failed',
    httpStatus: 500,
    statusText: 'Internal Server Error',
    attemptCount: 3,
    deliveredAt: new Date(NOW - 45 * 60 * 1000).toISOString(),
    endpointId: 'ep_prod_89a2b',
    request: {
      url: 'https://api.acmestore.com/api/v1/webhooks/facilpay',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FacilPay-Webhooks/1.0',
        'X-FacilPay-Signature': 't=1790416576,v1=3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d',
        'X-FacilPay-Event-ID': 'evt_pay_77c8d9e0',
        'X-FacilPay-Delivery-ID': 'del_01j8m99b',
      },
      payload: {
        id: 'evt_pay_77c8d9e0',
        event: 'payment.completed',
        timestamp: new Date(NOW - 75 * 60 * 1000).toISOString(),
        data: {
          payment_id: 'pl_test_4d3e2a09',
          transaction_hash: '2b4c6d8e0f2a4b6c8d0e2f4a7a9f8b2c4d1e3f5a7b9c2d4e6f8a0b2c4d6e8f0a',
          amount: '120.00',
          currency: 'EURC',
          customer_account: 'GDEMO8899AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPQQRRSSTTUUVVWWXXYYZZ12',
          merchant_account: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
          status: 'settled',
        },
      },
    },
    response: {
      statusCode: 500,
      statusText: 'Internal Server Error',
      responseTimeMs: 3120,
      headers: {
        'content-type': 'application/json',
        'date': new Date(NOW - 45 * 60 * 1000).toUTCString(),
        'server': 'cloudflare',
      },
      body: JSON.stringify(
        {
          error: 'DatabaseConnectionTimeoutError',
          message: 'Connection pool exhausted while processing order webhook.',
          stack: 'Error: Connection pool exhausted\n    at Pool.acquire (/app/node_modules/pg-pool/index.js:312:11)\n    at Object.handleWebhook (/app/src/webhooks/facilpay.ts:42:19)',
        },
        null,
        2
      ),
    },
    attempts: [
      {
        attemptNumber: 1,
        timestamp: new Date(NOW - 75 * 60 * 1000).toISOString(),
        httpStatus: 500,
        statusText: 'Internal Server Error',
        responseTimeMs: 2800,
        result: 'failed',
        errorMessage: 'HTTP 500: DatabaseConnectionTimeoutError',
      },
      {
        attemptNumber: 2,
        timestamp: new Date(NOW - 60 * 60 * 1000).toISOString(),
        httpStatus: 504,
        statusText: 'Gateway Timeout',
        responseTimeMs: 10000,
        result: 'failed',
        errorMessage: 'HTTP 504: Endpoint timed out after 10000ms',
      },
      {
        attemptNumber: 3,
        timestamp: new Date(NOW - 45 * 60 * 1000).toISOString(),
        httpStatus: 500,
        statusText: 'Internal Server Error',
        responseTimeMs: 3120,
        result: 'failed',
        errorMessage: 'HTTP 500: DatabaseConnectionTimeoutError',
      },
    ],
  },
  {
    id: 'del_01j8m99c',
    eventId: 'evt_ref_33b2c1a0',
    eventType: 'refund.processed',
    status: 'pending_retry',
    httpStatus: 502,
    statusText: 'Bad Gateway',
    attemptCount: 2,
    deliveredAt: new Date(NOW - 2 * HOUR).toISOString(),
    endpointId: 'ep_prod_89a2b',
    request: {
      url: 'https://api.acmestore.com/api/v1/webhooks/facilpay',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FacilPay-Webhooks/1.0',
        'X-FacilPay-Signature': 't=1790412000,v1=9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f',
        'X-FacilPay-Event-ID': 'evt_ref_33b2c1a0',
        'X-FacilPay-Delivery-ID': 'del_01j8m99c',
      },
      payload: {
        id: 'evt_ref_33b2c1a0',
        event: 'refund.processed',
        timestamp: new Date(NOW - 2 * HOUR).toISOString(),
        data: {
          refund_id: 'ref_981240',
          original_payment_id: 'pl_test_7f9b2d01',
          refund_amount: '15.00',
          currency: 'USDC',
          reason: 'Customer requested cancellation',
          transaction_hash: '5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f',
        },
      },
    },
    response: {
      statusCode: 502,
      statusText: 'Bad Gateway',
      responseTimeMs: 450,
      headers: {
        'content-type': 'text/html',
        'server': 'cloudflare',
      },
      body: '<html><body><h1>502 Bad Gateway</h1><p>The web server reported a bad gateway error.</p></body></html>',
    },
    attempts: [
      {
        attemptNumber: 1,
        timestamp: new Date(NOW - 2 * HOUR - 15 * 60 * 1000).toISOString(),
        httpStatus: 502,
        statusText: 'Bad Gateway',
        responseTimeMs: 420,
        result: 'failed',
        errorMessage: 'HTTP 502: Bad Gateway',
      },
      {
        attemptNumber: 2,
        timestamp: new Date(NOW - 2 * HOUR).toISOString(),
        httpStatus: 502,
        statusText: 'Bad Gateway',
        responseTimeMs: 450,
        result: 'pending_retry',
        errorMessage: 'Next retry scheduled with exponential backoff (attempt 3 of 5)',
      },
    ],
  },
  {
    id: 'del_01j8m99d',
    eventId: 'evt_tru_11a2b3c4',
    eventType: 'trustline.added',
    status: 'succeeded',
    httpStatus: 200,
    statusText: 'OK',
    attemptCount: 1,
    deliveredAt: new Date(NOW - 5 * HOUR).toISOString(),
    endpointId: 'ep_prod_89a2b',
    request: {
      url: 'https://api.acmestore.com/api/v1/webhooks/facilpay',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FacilPay-Webhooks/1.0',
        'X-FacilPay-Signature': 't=1790400000,v1=5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f',
        'X-FacilPay-Event-ID': 'evt_tru_11a2b3c4',
        'X-FacilPay-Delivery-ID': 'del_01j8m99d',
      },
      payload: {
        id: 'evt_tru_11a2b3c4',
        event: 'trustline.added',
        timestamp: new Date(NOW - 5 * HOUR).toISOString(),
        data: {
          account: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
          asset_code: 'USDC',
          asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          limit: '922337203685.4775807',
        },
      },
    },
    response: {
      statusCode: 200,
      statusText: 'OK',
      responseTimeMs: 95,
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({ acknowledged: true, trustline: 'USDC' }, null, 2),
    },
    attempts: [
      {
        attemptNumber: 1,
        timestamp: new Date(NOW - 5 * HOUR).toISOString(),
        httpStatus: 200,
        statusText: 'OK',
        responseTimeMs: 95,
        result: 'succeeded',
      },
    ],
  },
  {
    id: 'del_01j8m99e',
    eventId: 'evt_pay_55f6a7b8',
    eventType: 'payment.failed',
    status: 'failed',
    httpStatus: 404,
    statusText: 'Not Found',
    attemptCount: 2,
    deliveredAt: new Date(NOW - 1 * DAY).toISOString(),
    endpointId: 'ep_prod_89a2b',
    request: {
      url: 'https://api.acmestore.com/api/v1/webhooks/facilpay',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FacilPay-Webhooks/1.0',
        'X-FacilPay-Signature': 't=1790320000,v1=1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
        'X-FacilPay-Event-ID': 'evt_pay_55f6a7b8',
        'X-FacilPay-Delivery-ID': 'del_01j8m99e',
      },
      payload: {
        id: 'evt_pay_55f6a7b8',
        event: 'payment.failed',
        timestamp: new Date(NOW - 1 * DAY).toISOString(),
        data: {
          payment_id: 'pl_test_901a9b',
          failure_reason: 'insufficient_funds',
          attempted_amount: '250.00',
          currency: 'USDC',
        },
      },
    },
    response: {
      statusCode: 404,
      statusText: 'Not Found',
      responseTimeMs: 82,
      headers: {
        'content-type': 'text/plain',
      },
      body: 'Cannot POST /api/v1/webhooks/facilpay - route not registered',
    },
    attempts: [
      {
        attemptNumber: 1,
        timestamp: new Date(NOW - 1 * DAY - 20 * 60 * 1000).toISOString(),
        httpStatus: 404,
        statusText: 'Not Found',
        responseTimeMs: 85,
        result: 'failed',
        errorMessage: 'HTTP 404: Not Found',
      },
      {
        attemptNumber: 2,
        timestamp: new Date(NOW - 1 * DAY).toISOString(),
        httpStatus: 404,
        statusText: 'Not Found',
        responseTimeMs: 82,
        result: 'failed',
        errorMessage: 'HTTP 404: Not Found',
      },
    ],
  },
  {
    id: 'del_01j8m99f',
    eventId: 'evt_pay_12d3e4f5',
    eventType: 'payment.completed',
    status: 'succeeded',
    httpStatus: 200,
    statusText: 'OK',
    attemptCount: 1,
    deliveredAt: new Date(NOW - 2 * DAY).toISOString(),
    endpointId: 'ep_prod_89a2b',
    request: {
      url: 'https://api.acmestore.com/api/v1/webhooks/facilpay',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FacilPay-Webhooks/1.0',
        'X-FacilPay-Signature': 't=1790240000,v1=4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c',
        'X-FacilPay-Event-ID': 'evt_pay_12d3e4f5',
        'X-FacilPay-Delivery-ID': 'del_01j8m99f',
      },
      payload: {
        id: 'evt_pay_12d3e4f5',
        event: 'payment.completed',
        data: { amount: '75.00', currency: 'USDC' },
      },
    },
    response: {
      statusCode: 200,
      statusText: 'OK',
      responseTimeMs: 110,
      headers: { 'content-type': 'application/json' },
      body: '{"status":"ok"}',
    },
    attempts: [
      {
        attemptNumber: 1,
        timestamp: new Date(NOW - 2 * DAY).toISOString(),
        httpStatus: 200,
        statusText: 'OK',
        responseTimeMs: 110,
        result: 'succeeded',
      },
    ],
  },
];

export function getStoredDeliveries(endpointId?: string): WebhookDelivery[] {
  if (typeof window === 'undefined') return INITIAL_DELIVERIES;
  try {
    const item = window.localStorage.getItem(STORAGE_KEYS.WEBHOOK_DELIVERIES);
    let list: WebhookDelivery[] = item ? JSON.parse(item) : INITIAL_DELIVERIES;
    if (endpointId) {
      list = list.filter((d) => d.endpointId === endpointId || !d.endpointId);
    }
    return list;
  } catch (err) {
    console.warn('Error reading stored webhook deliveries:', err);
    return INITIAL_DELIVERIES;
  }
}

export function saveStoredDeliveries(deliveries: WebhookDelivery[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.WEBHOOK_DELIVERIES, JSON.stringify(deliveries));
  } catch (err) {
    console.warn('Error saving webhook deliveries:', err);
  }
}

export interface EndpointHealthSummary {
  totalDeliveries: number;
  succeededDeliveries: number;
  failedDeliveries: number;
  failureRate: number; // e.g. 25 (%)
  successRate: number; // e.g. 75 (%)
  isWarning: boolean; // failureRate > 20%
  sevenDayStats: DayHealthStat[];
  avgLatencyMs: number;
}

export function calculateEndpointHealth(deliveries: WebhookDelivery[]): EndpointHealthSummary {
  const total = deliveries.length;
  const failed = deliveries.filter((d) => d.status === 'failed' || d.status === 'pending_retry').length;
  const succeeded = deliveries.filter((d) => d.status === 'succeeded').length;

  const failureRate = total > 0 ? Math.round((failed / total) * 100) : 0;
  const successRate = total > 0 ? Math.round((succeeded / total) * 100) : 100;
  const isWarning = failureRate > 20;

  // Build 7-day stats
  const days: DayHealthStat[] = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const targetDate = new Date(now.getTime() - i * DAY);
    const dateStr = targetDate.toISOString().split('T')[0];
    const dayLabel = targetDate.toLocaleDateString(undefined, { weekday: 'short' });

    // Count deliveries matching this day
    const dayDeliveries = deliveries.filter((d) => d.deliveredAt.startsWith(dateStr));
    const daySucceeded = dayDeliveries.filter((d) => d.status === 'succeeded').length;
    const dayFailed = dayDeliveries.filter((d) => d.status !== 'succeeded').length;

    // Provide representative historical baseline if day has few events
    const baselineSucceeded = daySucceeded || Math.max(1, 12 - i * 2);
    const baselineFailed = dayFailed || (i === 1 || i === 0 ? 3 : 1);

    days.push({
      date: dateStr,
      dayLabel,
      succeeded: dayDeliveries.length > 0 ? daySucceeded : baselineSucceeded,
      failed: dayDeliveries.length > 0 ? dayFailed : baselineFailed,
    });
  }

  const avgLatencyMs =
    total > 0
      ? Math.round(
          deliveries.reduce((sum, d) => sum + (d.response?.responseTimeMs || 120), 0) / total
        )
      : 120;

  return {
    totalDeliveries: total,
    succeededDeliveries: succeeded,
    failedDeliveries: failed,
    failureRate,
    successRate,
    isWarning,
    sevenDayStats: days,
    avgLatencyMs,
  };
}

export function retrySingleDelivery(
  deliveryId: string,
  deliveries: WebhookDelivery[]
): { updatedList: WebhookDelivery[]; updatedItem: WebhookDelivery | null } {
  let updatedItem: WebhookDelivery | null = null;

  const updatedList = deliveries.map((d) => {
    if (d.id !== deliveryId) return d;

    const newAttemptNumber = d.attemptCount + 1;
    const nowIso = new Date().toISOString();
    const newAttempt = {
      attemptNumber: newAttemptNumber,
      timestamp: nowIso,
      httpStatus: 200,
      statusText: 'OK (Manual Retry)',
      responseTimeMs: Math.floor(Math.random() * 80) + 70,
      result: 'succeeded' as const,
    };

    const updated: WebhookDelivery = {
      ...d,
      status: 'succeeded',
      httpStatus: 200,
      statusText: 'OK (Resent)',
      attemptCount: newAttemptNumber,
      deliveredAt: nowIso,
      response: {
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: newAttempt.responseTimeMs,
        headers: {
          'content-type': 'application/json',
          'date': new Date().toUTCString(),
          'x-resend': 'manual_trigger',
        },
        body: JSON.stringify({ received: true, resend: true, timestamp: nowIso }, null, 2),
      },
      attempts: [...d.attempts, newAttempt],
    };

    updatedItem = updated;
    return updated;
  });

  saveStoredDeliveries(updatedList);
  return { updatedList, updatedItem };
}

export function bulkRetryDeliveries(
  deliveryIds: string[],
  deliveries: WebhookDelivery[]
): WebhookDelivery[] {
  const nowIso = new Date().toISOString();

  const updatedList = deliveries.map((d) => {
    if (!deliveryIds.includes(d.id)) return d;

    const newAttemptNumber = d.attemptCount + 1;
    const newAttempt = {
      attemptNumber: newAttemptNumber,
      timestamp: nowIso,
      httpStatus: 200,
      statusText: 'OK (Bulk Retry)',
      responseTimeMs: Math.floor(Math.random() * 90) + 60,
      result: 'succeeded' as const,
    };

    return {
      ...d,
      status: 'succeeded' as const,
      httpStatus: 200,
      statusText: 'OK (Bulk Resent)',
      attemptCount: newAttemptNumber,
      deliveredAt: nowIso,
      response: {
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: newAttempt.responseTimeMs,
        headers: {
          'content-type': 'application/json',
          'date': new Date().toUTCString(),
          'x-bulk-resend': 'true',
        },
        body: JSON.stringify({ received: true, bulk_retry: true, timestamp: nowIso }, null, 2),
      },
      attempts: [...d.attempts, newAttempt],
    };
  });

  saveStoredDeliveries(updatedList);
  return updatedList;
}

// -------------------------------------------------------------
// Webhook Endpoints CRUD & Management Helpers
// -------------------------------------------------------------

export function generateSigningSecret(): string {
  const bytes = new Uint8Array(20);
  globalThis.crypto.getRandomValues(bytes);
  return `whsec_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function validateWebhookUrl(
  url: string,
  isTestnet: boolean = true
): { isValid: boolean; error?: string } {
  const trimmed = (url || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Endpoint URL is required' };
  }

  try {
    const parsed = new URL(trimmed);
    const isHttps = parsed.protocol === 'https:';
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname === '[::1]';

    if (isHttps) {
      return { isValid: true };
    }

    if (isTestnet && isLocalhost && parsed.protocol === 'http:') {
      return { isValid: true };
    }

    if (isLocalhost && !isTestnet) {
      return {
        isValid: false,
        error: 'Localhost (http://) is only permitted on Stellar Testnet.',
      };
    }

    return {
      isValid: false,
      error: 'Endpoint URL must use secure HTTPS (https://). Localhost (http://) is only allowed on Testnet.',
    };
  } catch {
    return {
      isValid: false,
      error: 'Invalid URL format. Please include protocol, e.g., https://api.yourdomain.com/webhooks',
    };
  }
}

export function getStoredEndpoints(): WebhookEndpoint[] {
  if (typeof window === 'undefined') return INITIAL_ENDPOINTS;
  try {
    const item = window.localStorage.getItem(STORAGE_KEYS.WEBHOOK_ENDPOINTS);
    if (!item) {
      window.localStorage.setItem(STORAGE_KEYS.WEBHOOK_ENDPOINTS, JSON.stringify(INITIAL_ENDPOINTS));
      return INITIAL_ENDPOINTS;
    }
    const parsed: unknown = JSON.parse(item);
    if (!Array.isArray(parsed) || parsed.length === 0) return INITIAL_ENDPOINTS;

    const now = Date.now();
    const endpoints = (parsed as WebhookEndpoint[]).map((endpoint) => {
      const previousSecrets = endpoint.previousSecrets?.filter(
        ({ expiresAt }) => new Date(expiresAt).getTime() > now
      );
      return previousSecrets?.length
        ? { ...endpoint, previousSecrets }
        : { ...endpoint, previousSecrets: undefined };
    });
    if (JSON.stringify(endpoints) !== item) saveStoredEndpoints(endpoints);
    return endpoints;
  } catch (err) {
    console.warn('Error reading stored webhook endpoints:', err);
    return INITIAL_ENDPOINTS;
  }
}

export function saveStoredEndpoints(endpoints: WebhookEndpoint[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEYS.WEBHOOK_ENDPOINTS, JSON.stringify(endpoints));
    return true;
  } catch (err) {
    console.warn('Error saving webhook endpoints:', err);
    return false;
  }
}

export function getEndpointById(id: string): WebhookEndpoint | undefined {
  const endpoints = getStoredEndpoints();
  return endpoints.find((ep) => ep.id === id);
}

export function createEndpoint(data: {
  url: string;
  description: string;
  subscribedEvents: string[];
  status?: 'active' | 'inactive';
}): { endpoint: WebhookEndpoint; generatedSecret: string } {
  const endpoints = getStoredEndpoints();
  const secret = generateSigningSecret();
  const newEndpoint: WebhookEndpoint = {
    id: `ep_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    url: data.url.trim(),
    description: data.description.trim(),
    secret,
    createdAt: new Date().toISOString(),
    status: data.status || 'active',
    subscribedEvents: data.subscribedEvents,
    successRate24h: 100,
  };

  const updated = [newEndpoint, ...endpoints];
  saveStoredEndpoints(updated);
  return { endpoint: newEndpoint, generatedSecret: secret };
}

export function updateEndpoint(
  id: string,
  updates: Partial<Omit<WebhookEndpoint, 'id' | 'secret' | 'createdAt'>>
): WebhookEndpoint | null {
  const endpoints = getStoredEndpoints();
  let updatedEndpoint: WebhookEndpoint | null = null;

  const nextEndpoints = endpoints.map((ep) => {
    if (ep.id === id) {
      updatedEndpoint = { ...ep, ...updates };
      return updatedEndpoint;
    }
    return ep;
  });

  if (updatedEndpoint) {
    saveStoredEndpoints(nextEndpoints);
  }
  return updatedEndpoint;
}

export function deleteEndpoint(id: string): boolean {
  const endpoints = getStoredEndpoints();
  const nextEndpoints = endpoints.filter((ep) => ep.id !== id);
  if (nextEndpoints.length === endpoints.length) return false;
  saveStoredEndpoints(nextEndpoints);
  return true;
}

export function rollEndpointSecret(
  id: string,
  overlap: 'now' | '1h' | '24h' | '7d' = 'now'
): {
  endpoint: WebhookEndpoint | null;
  newSecret: string;
  error?: string;
} {
  const endpoints = getStoredEndpoints();
  const newSecret = generateSigningSecret();
  const now = Date.now();
  const overlapMs = {
    now: 0,
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
  }[overlap];
  let updatedEndpoint: WebhookEndpoint | null = null;

  const nextEndpoints = endpoints.map((ep) => {
    if (ep.id === id) {
      const previousSecrets = (ep.previousSecrets || []).filter(
        ({ expiresAt }) => new Date(expiresAt).getTime() > now
      );
      if (overlapMs > 0) {
        previousSecrets.push({
          secret: ep.secret,
          expiresAt: new Date(now + overlapMs).toISOString(),
        });
      }
      updatedEndpoint = {
        ...ep,
        secret: newSecret,
        secretRevealDisabled: true,
        previousSecrets: previousSecrets.length ? previousSecrets : undefined,
      };
      return updatedEndpoint;
    }
    return ep;
  });

  if (!updatedEndpoint) return { endpoint: null, newSecret, error: 'Webhook endpoint was not found.' };
  if (!saveStoredEndpoints(nextEndpoints)) {
    return { endpoint: null, newSecret, error: 'Could not save the rotated webhook secret.' };
  }
  return { endpoint: updatedEndpoint, newSecret };
}

export function toggleEndpointStatus(id: string): WebhookEndpoint | null {
  const endpoints = getStoredEndpoints();
  let updatedEndpoint: WebhookEndpoint | null = null;

  const nextEndpoints = endpoints.map((ep) => {
    if (ep.id === id) {
      const nextStatus = ep.status === 'active' ? 'inactive' : 'active';
      updatedEndpoint = { ...ep, status: nextStatus };
      return updatedEndpoint;
    }
    return ep;
  });

  if (updatedEndpoint) {
    saveStoredEndpoints(nextEndpoints);
  }
  return updatedEndpoint;
}

export function calculateEndpoint24hSuccessRate(
  endpointId: string,
  deliveries?: WebhookDelivery[]
): number {
  const allDeliveries = deliveries || getStoredDeliveries(endpointId);
  const now = Date.now();
  const oneDayAgo = now - 24 * 3600 * 1000;

  const recent = allDeliveries.filter(
    (d) =>
      (d.endpointId === endpointId || (!d.endpointId && endpointId === DEFAULT_ENDPOINT.id)) &&
      new Date(d.deliveredAt).getTime() >= oneDayAgo
  );

  if (recent.length === 0) {
    const ep = getEndpointById(endpointId);
    return ep?.successRate24h ?? 100;
  }

  const succeeded = recent.filter((d) => d.status === 'succeeded').length;
  return Math.round((succeeded / recent.length) * 100);
}

export function sendTestWebhookEvent(
  endpointId: string,
  eventType: string
): { delivery: WebhookDelivery; status: number; statusText: string; responseTimeMs: number } {
  const endpoint = getEndpointById(endpointId) || DEFAULT_ENDPOINT;
  const nowIso = new Date().toISOString();
  const eventId = `evt_test_${Date.now().toString(36)}`;
  const deliveryId = `del_test_${Date.now().toString(36)}`;
  const latency = Math.floor(Math.random() * 65) + 75; // realistic 75-140ms
  const timestampSec = Math.floor(Date.now() / 1000);

  const payload: Record<string, unknown> = {
    id: eventId,
    event: eventType,
    created_at: nowIso,
    network: 'stellar_testnet',
    data: {
      id: `ref_${Date.now().toString(36)}`,
      amount: '50.00',
      currency: 'USDC',
      status: 'confirmed',
      merchant_account: 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF',
      customer_account: 'GABCD3XYZ99238KLMS72782910AAJJWWQQOPPLKKJJHGFEDCBA7766554433221',
      description: `Test event ping for ${eventType}`,
    },
  };

  const delivery: WebhookDelivery = {
    id: deliveryId,
    eventId,
    eventType: eventType as WebhookEventType,
    status: 'succeeded',
    httpStatus: 200,
    statusText: 'OK',
    attemptCount: 1,
    deliveredAt: nowIso,
    endpointId,
    request: {
      url: endpoint.url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FacilPay-Webhooks/1.0',
        'X-FacilPay-Signature': `t=${timestampSec},v1=5e4d3c2b1a0f9e8d7c6b5a4f3e2d1c0b9a8f7e6d`,
        'X-FacilPay-Event-ID': eventId,
        'X-FacilPay-Delivery-ID': deliveryId,
      },
      payload,
    },
    response: {
      statusCode: 200,
      statusText: 'OK',
      responseTimeMs: latency,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'date': new Date().toUTCString(),
        'x-facilpay-test-mode': 'true',
      },
      body: JSON.stringify(
        {
          received: true,
          test_event: eventType,
          status: 'acknowledged',
          timestamp: nowIso,
        },
        null,
        2
      ),
    },
    attempts: [
      {
        attemptNumber: 1,
        timestamp: nowIso,
        httpStatus: 200,
        statusText: 'OK',
        responseTimeMs: latency,
        result: 'succeeded',
      },
    ],
  };

  // Prepend to stored deliveries
  const currentDeliveries = getStoredDeliveries();
  saveStoredDeliveries([delivery, ...currentDeliveries]);

  // Update endpoint's lastTriggeredAt
  updateEndpoint(endpointId, { lastTriggeredAt: nowIso });

  return {
    delivery,
    status: 200,
    statusText: 'OK',
    responseTimeMs: latency,
  };
}

