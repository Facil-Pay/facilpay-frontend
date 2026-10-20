import { describe, it, expect } from 'vitest';
import {
  WEBHOOK_CATALOG,
  SIGNATURE_VERIFICATION_SNIPPETS,
  getCatalogItem,
  getCatalogByCategory,
} from '../lib/webhook-catalog';
import {
  WebhookEventType,
  WEBHOOK_EVENT_GROUPS,
  ALL_WEBHOOK_EVENT_IDS,
} from '../types/webhooks';
import { sendTestWebhookEvent, DEFAULT_ENDPOINT } from '../lib/webhook-data';

describe('Webhook Event Catalog Specification (#81)', () => {
  const EXPECTED_EVENT_TYPES: WebhookEventType[] = [
    'payment.created',
    'payment.completed',
    'payment.failed',
    'payment.expired',
    'refund.created',
    'refund.completed',
    'refund.failed',
    'refund.processed',
    'escrow.funded',
    'escrow.released',
    'escrow.disputed',
    'payout.completed',
    'trustline.added',
  ];

  describe('Acceptance Criteria 1: Every event type in types/webhooks.ts is documented', () => {
    it('documents all 13 canonical webhook event types in the catalog', () => {
      const catalogIds = WEBHOOK_CATALOG.map((item) => item.id);

      for (const expectedType of EXPECTED_EVENT_TYPES) {
        expect(
          catalogIds,
          `Event type ${expectedType} must be present in WEBHOOK_CATALOG`
        ).toContain(expectedType);
      }
    });

    it('each catalog item contains complete metadata and trigger description', () => {
      for (const item of WEBHOOK_CATALOG) {
        expect(item.name).toBe(item.id);
        expect(item.summary.length).toBeGreaterThan(15);
        expect(item.whenFires.length).toBeGreaterThan(20);
        expect(item.categoryLabel.length).toBeGreaterThan(0);
        expect(item.fields.length).toBeGreaterThan(0);
      }
    });

    it('getCatalogItem resolves items by event type ID', () => {
      const paymentCompleted = getCatalogItem('payment.completed');
      expect(paymentCompleted).toBeDefined();
      expect(paymentCompleted?.name).toBe('payment.completed');
      expect(paymentCompleted?.category).toBe('payment');

      const escrowFunded = getCatalogItem('escrow.funded');
      expect(escrowFunded).toBeDefined();
      expect(escrowFunded?.category).toBe('escrow');
    });

    it('getCatalogByCategory filters by category properly', () => {
      const payments = getCatalogByCategory('payment');
      expect(payments).toHaveLength(4);

      const refunds = getCatalogByCategory('refund');
      expect(refunds).toHaveLength(4);

      const escrows = getCatalogByCategory('escrow');
      expect(escrows).toHaveLength(3);

      const all = getCatalogByCategory('all');
      expect(all).toHaveLength(WEBHOOK_CATALOG.length);
    });
  });

  describe('Acceptance Criteria 2: Payload examples match TypeScript types', () => {
    it('every catalog sample payload contains required root envelope fields', () => {
      for (const item of WEBHOOK_CATALOG) {
        const payload = item.samplePayload;
        expect(payload).toBeDefined();
        expect(payload.id).toMatch(/^evt_/);
        expect(payload.event).toBe(item.id);
        expect(payload.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(['stellar_mainnet', 'stellar_testnet']).toContain(payload.network);
        expect(payload.data).toBeTypeOf('object');
        expect(payload.data).not.toBeNull();
      }
    });

    it('sample payload data matches documented fields schema', () => {
      for (const item of WEBHOOK_CATALOG) {
        const requiredFields = item.fields.filter((f) => f.required);
        for (const req of requiredFields) {
          const value = (item.samplePayload.data as Record<string, unknown>)[req.field];
          expect(
            value,
            `Field ${req.field} in ${item.id} must be defined in sample payload data`
          ).not.toBeUndefined();
        }
      }
    });
  });

  describe('Signature Verification Snippets', () => {
    it('provides verification code for Node.js, Python, and Go', () => {
      expect(SIGNATURE_VERIFICATION_SNIPPETS.nodejs).toBeDefined();
      expect(SIGNATURE_VERIFICATION_SNIPPETS.python).toBeDefined();
      expect(SIGNATURE_VERIFICATION_SNIPPETS.go).toBeDefined();
    });

    it('Node.js snippet implements timingSafeEqual and replay tolerance', () => {
      const snippet = SIGNATURE_VERIFICATION_SNIPPETS.nodejs;
      expect(snippet).toContain('timingSafeEqual');
      expect(snippet).toContain('X-FacilPay-Signature');
      expect(snippet).toContain('toleranceSeconds');
      expect(snippet).toContain('sha256');
    });

    it('Python snippet implements compare_digest and replay tolerance', () => {
      const snippet = SIGNATURE_VERIFICATION_SNIPPETS.python;
      expect(snippet).toContain('compare_digest');
      expect(snippet).toContain('X-FacilPay-Signature');
      expect(snippet).toContain('tolerance_seconds');
      expect(snippet).toContain('sha256');
    });

    it('Go snippet implements hmac.Equal and replay tolerance', () => {
      const snippet = SIGNATURE_VERIFICATION_SNIPPETS.go;
      expect(snippet).toContain('hmac.Equal');
      expect(snippet).toContain('X-FacilPay-Signature');
      expect(snippet).toContain('toleranceSeconds');
      expect(snippet).toContain('sha256');
    });
  });

  describe('Send Test Event Integration', () => {
    it('dispatches a test event delivery with valid payload and signature headers', () => {
      const testResult = sendTestWebhookEvent(DEFAULT_ENDPOINT.id, 'payment.completed');

      expect(testResult).toBeDefined();
      expect(testResult.status).toBe(200);
      expect(testResult.delivery.eventType).toBe('payment.completed');
      expect(testResult.delivery.request.headers['X-FacilPay-Signature']).toMatch(/^t=\d+,v1=[a-f0-9]+/);
      expect(testResult.delivery.request.headers['X-FacilPay-Event-ID']).toMatch(/^evt_test_/);
      expect(testResult.delivery.request.payload.event).toBe('payment.completed');
    });
  });
});
