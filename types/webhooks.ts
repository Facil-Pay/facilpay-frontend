export type WebhookDeliveryStatus = 'succeeded' | 'failed' | 'pending_retry';

export interface WebhookAttempt {
  attemptNumber: number;
  timestamp: string;
  httpStatus: number;
  statusText: string;
  responseTimeMs: number;
  result: WebhookDeliveryStatus;
  errorMessage?: string;
}

export interface WebhookRequestData {
  url: string;
  method: string;
  headers: Record<string, string>;
  payload: Record<string, unknown>;
}

export interface WebhookResponseData {
  statusCode: number;
  statusText: string;
  responseTimeMs: number;
  headers: Record<string, string>;
  body: string;
}

export type WebhookEventType =
  | 'payment.created'
  | 'payment.completed'
  | 'payment.failed'
  | 'payment.expired'
  | 'refund.created'
  | 'refund.completed'
  | 'refund.failed'
  | 'refund.processed'
  | 'escrow.funded'
  | 'escrow.released'
  | 'escrow.disputed'
  | 'payout.completed'
  | 'trustline.added'
  | (string & {});

export interface WebhookDelivery {
  id: string;
  eventId: string;
  eventType: WebhookEventType;
  status: WebhookDeliveryStatus;
  httpStatus: number;
  statusText: string;
  attemptCount: number;
  deliveredAt: string;
  endpointId: string;
  request: WebhookRequestData;
  response: WebhookResponseData;
  attempts: WebhookAttempt[];
}

export interface DayHealthStat {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. Mon, Tue
  succeeded: number;
  failed: number;
}

export interface WebhookEndpoint {
  id: string;
  url: string;
  description: string;
  secret: string;
  createdAt: string;
  status: 'active' | 'inactive';
  subscribedEvents: string[];
  successRate24h?: number;
  lastTriggeredAt?: string;
}

export interface WebhookFilterOptions {
  status: 'all' | WebhookDeliveryStatus;
  eventType: 'all' | string;
  dateRange: 'all' | '24h' | '7d' | '30d';
  searchQuery: string;
}

export interface WebhookEventDefinition {
  id: string;
  label: string;
  description: string;
  group: 'payment' | 'refund' | 'escrow' | 'payout' | 'account';
  whenFires?: string;
  samplePayload?: Record<string, unknown>;
}

export interface WebhookEventGroup {
  id: 'payment' | 'refund' | 'escrow' | 'payout' | 'account';
  name: string;
  description: string;
  events: WebhookEventDefinition[];
}

export const WEBHOOK_EVENT_GROUPS: WebhookEventGroup[] = [
  {
    id: 'payment',
    name: 'Payment Events',
    description: 'Triggers related to payment link lifecycle and ledger settlement',
    events: [
      {
        id: 'payment.created',
        label: 'payment.created',
        description: 'Triggered when a new payment link or intent is generated',
        group: 'payment',
      },
      {
        id: 'payment.completed',
        label: 'payment.completed',
        description: 'Triggered when a payment is confirmed and settled on Stellar',
        group: 'payment',
      },
      {
        id: 'payment.failed',
        label: 'payment.failed',
        description: 'Triggered when a payment attempt fails or is rejected',
        group: 'payment',
      },
      {
        id: 'payment.expired',
        label: 'payment.expired',
        description: 'Triggered when a payment window expires before settlement',
        group: 'payment',
      },
    ],
  },
  {
    id: 'refund',
    name: 'Refund Events',
    description: 'Triggers for customer refund requests, approvals, and reversals',
    events: [
      {
        id: 'refund.created',
        label: 'refund.created',
        description: 'Triggered when a refund request is submitted',
        group: 'refund',
      },
      {
        id: 'refund.completed',
        label: 'refund.completed',
        description: 'Triggered when funds have been refunded to the customer',
        group: 'refund',
      },
      {
        id: 'refund.processed',
        label: 'refund.processed',
        description: 'Triggered when a refund has been approved and queued for ledger execution',
        group: 'refund',
      },
      {
        id: 'refund.failed',
        label: 'refund.failed',
        description: 'Triggered if a refund transaction fails on ledger',
        group: 'refund',
      },
    ],
  },
  {
    id: 'escrow',
    name: 'Escrow Events',
    description: 'Triggers for smart escrow deposits, fulfillment releases, and disputes',
    events: [
      {
        id: 'escrow.funded',
        label: 'escrow.funded',
        description: 'Triggered when escrow deposits are locked in the smart contract',
        group: 'escrow',
      },
      {
        id: 'escrow.released',
        label: 'escrow.released',
        description: 'Triggered when funds are released to the merchant',
        group: 'escrow',
      },
      {
        id: 'escrow.disputed',
        label: 'escrow.disputed',
        description: 'Triggered when an order escrow is contested for mediation',
        group: 'escrow',
      },
    ],
  },
  {
    id: 'payout',
    name: 'Payout Events',
    description: 'Automated settlement to merchant bank or designated cold wallet',
    events: [
      {
        id: 'payout.completed',
        label: 'payout.completed',
        description: 'Triggered when scheduled merchant payout transfer is confirmed',
        group: 'payout',
      },
    ],
  },
  {
    id: 'account',
    name: 'Account & Trustline Events',
    description: 'Triggers related to Stellar account trustlines and asset authorizations',
    events: [
      {
        id: 'trustline.added',
        label: 'trustline.added',
        description: 'Triggered when an account establishes a required trustline for an asset',
        group: 'account',
      },
    ],
  },
];

export const ALL_WEBHOOK_EVENT_IDS = WEBHOOK_EVENT_GROUPS.flatMap((g) =>
  g.events.map((e) => e.id)
);

