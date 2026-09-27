/**
 * lib/types/webhook.ts
 *
 * Webhook and WebhookDelivery domain types.
 */

export type WebhookEvent =
  | "payment.created"
  | "payment.processing"
  | "payment.completed"
  | "payment.failed"
  | "payment.refunded"
  | "payment.cancelled"
  | "refund.created"
  | "refund.completed"
  | "refund.failed"
  | "escrow.funded"
  | "escrow.released"
  | "escrow.disputed"
  | "payout.created"
  | "payout.completed"
  | "payout.failed";

export type WebhookStatus = "active" | "disabled" | "failing";

export interface Webhook {
  id: string;
  merchantId: string;
  url: string;
  description?: string;
  status: WebhookStatus;
  /** Events this webhook is subscribed to */
  events: WebhookEvent[];
  /** HMAC-SHA256 signing secret (returned only at creation) */
  secret?: string;
  /** Number of consecutive delivery failures */
  failureCount: number;
  createdAt: string;
  updatedAt: string;
  lastDeliveryAt?: string;
}

export type WebhookDeliveryStatus = "success" | "failed" | "pending";

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  status: WebhookDeliveryStatus;
  /** HTTP status code returned by the endpoint */
  responseStatus?: number;
  /** Response body snippet (first 1 KB) */
  responseBody?: string;
  /** Request payload sent to the endpoint */
  requestBody: string;
  attemptCount: number;
  createdAt: string;
  deliveredAt?: string;
  nextRetryAt?: string;
}

export interface CreateWebhookRequest {
  url: string;
  events: WebhookEvent[];
  description?: string;
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: WebhookEvent[];
  description?: string;
  status?: "active" | "disabled";
}
