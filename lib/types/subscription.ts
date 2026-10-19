/**
 * lib/types/subscription.ts
 *
 * Domain types for recurring billing, subscription plans,
 * customer subscriptions, and invoice histories.
 */

export type PlanInterval = 'weekly' | 'monthly' | 'yearly';
export type PlanStatus = 'active' | 'archived';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  amount: number;
  asset: 'USDC' | 'EURC' | 'XLM';
  interval: PlanInterval;
  trialDays: number;
  status: PlanStatus;
  subscriberCount: number;
  createdAt: string;
  updatedAt: string;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'paused';

export interface SubscriptionInvoice {
  id: string;
  subscriptionId: string;
  amount: number;
  asset: string;
  status: 'paid' | 'pending' | 'failed';
  date: string; // ISO 8601
  periodStart: string;
  periodEnd: string;
  txHash?: string;
  stellarExpertUrl?: string;
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  customerEmail: string;
  customerWallet: string;
  amount: number;
  asset: 'USDC' | 'EURC' | 'XLM';
  interval: PlanInterval;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextChargeDate: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  pausedAt?: string;
  createdAt: string;
  invoices: SubscriptionInvoice[];
}

export interface CreatePlanInput {
  name: string;
  description?: string;
  amount: number;
  asset: 'USDC' | 'EURC' | 'XLM';
  interval: PlanInterval;
  trialDays?: number;
}

export interface UpdatePlanInput {
  name?: string;
  description?: string;
  amount?: number;
  trialDays?: number;
}
