/**
 * lib/types/subscription.ts
 *
 * Recurring plans and customer subscriptions.
 */

import type { AssetType } from "./asset";

export type BillingInterval = "weekly" | "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "ACTIVE" | "PAST_DUE" | "PAUSED" | "CANCELLED";

export interface RecurringPlan {
  id: string;
  name: string;
  description: string;
  amount: number;
  asset: AssetType;
  interval: BillingInterval;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
}

export interface Subscription {
  id: string;
  customerName: string;
  customerEmail: string;
  planId: string;
  amount: number;
  asset: AssetType;
  interval: BillingInterval;
  status: SubscriptionStatus;
  startedAt: string;
  nextBillingAt: string | null;
  lastPaymentStatus: "PAID" | "FAILED" | "PENDING" | null;
}
