/**
 * lib/subscriptions.ts
 *
 * Domain operations, mock store, and state management for
 * recurring billing plans, customer subscriptions, and invoices.
 */

import {
  SubscriptionPlan,
  Subscription,
  SubscriptionInvoice,
  CreatePlanInput,
  UpdatePlanInput,
  PlanInterval,
} from '@/lib/types/subscription';

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_starter_monthly',
    name: 'Starter Tier',
    description: 'Basic recurring API & webhook access for emerging Web3 projects.',
    amount: 19.0,
    asset: 'USDC',
    interval: 'monthly',
    trialDays: 0,
    status: 'active',
    subscriberCount: 24,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'plan_pro_monthly',
    name: 'Pro Professional',
    description: 'Full merchant tooling, automated settlements, and priority support.',
    amount: 49.0,
    asset: 'USDC',
    interval: 'monthly',
    trialDays: 14,
    status: 'active',
    subscriberCount: 58,
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z',
  },
  {
    id: 'plan_enterprise_yearly',
    name: 'Enterprise Annual',
    description: 'Custom multi-sig thresholds, unlimited volume, dedicated SLA.',
    amount: 490.0,
    asset: 'USDC',
    interval: 'yearly',
    trialDays: 30,
    status: 'active',
    subscriberCount: 8,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
  {
    id: 'plan_euro_monthly',
    name: 'Euro Business Monthly',
    description: 'SEPA and EURC billing gateway for European merchants.',
    amount: 25.0,
    asset: 'EURC',
    interval: 'monthly',
    trialDays: 7,
    status: 'active',
    subscriberCount: 15,
    createdAt: '2026-01-12T00:00:00.000Z',
    updatedAt: '2026-01-12T00:00:00.000Z',
  },
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: 'sub_20260201_8a9b0c',
    planId: 'plan_pro_monthly',
    planName: 'Pro Professional',
    customerEmail: 'alex.chen@innovate.co',
    customerWallet: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7AB',
    amount: 49.0,
    asset: 'USDC',
    interval: 'monthly',
    status: 'active',
    currentPeriodStart: '2026-02-01T00:00:00.000Z',
    currentPeriodEnd: '2026-03-01T00:00:00.000Z',
    nextChargeDate: '2026-03-01T00:00:00.000Z',
    createdAt: '2026-01-01T12:00:00.000Z',
    invoices: [
      {
        id: 'inv_20260201_01',
        subscriptionId: 'sub_20260201_8a9b0c',
        amount: 49.0,
        asset: 'USDC',
        status: 'paid',
        date: '2026-02-01T00:05:12.000Z',
        periodStart: '2026-02-01T00:00:00.000Z',
        periodEnd: '2026-03-01T00:00:00.000Z',
        txHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      {
        id: 'inv_20260101_01',
        subscriptionId: 'sub_20260201_8a9b0c',
        amount: 49.0,
        asset: 'USDC',
        status: 'paid',
        date: '2026-01-01T12:05:00.000Z',
        periodStart: '2026-01-01T00:00:00.000Z',
        periodEnd: '2026-02-01T00:00:00.000Z',
        txHash: '5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
        stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
      },
    ],
  },
  {
    id: 'sub_20260210_1d2e3f',
    planId: 'plan_starter_monthly',
    planName: 'Starter Tier',
    customerEmail: 'devin@stellarforge.org',
    customerWallet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    amount: 19.0,
    asset: 'USDC',
    interval: 'monthly',
    status: 'past_due',
    currentPeriodStart: '2026-02-10T00:00:00.000Z',
    currentPeriodEnd: '2026-03-10T00:00:00.000Z',
    nextChargeDate: '2026-02-11T00:00:00.000Z',
    createdAt: '2026-01-10T09:30:00.000Z',
    invoices: [
      {
        id: 'inv_20260210_02',
        subscriptionId: 'sub_20260210_1d2e3f',
        amount: 19.0,
        asset: 'USDC',
        status: 'failed',
        date: '2026-02-10T00:01:00.000Z',
        periodStart: '2026-02-10T00:00:00.000Z',
        periodEnd: '2026-03-10T00:00:00.000Z',
      },
      {
        id: 'inv_20260110_02',
        subscriptionId: 'sub_20260210_1d2e3f',
        amount: 19.0,
        asset: 'USDC',
        status: 'paid',
        date: '2026-01-10T09:30:00.000Z',
        periodStart: '2026-01-10T00:00:00.000Z',
        periodEnd: '2026-02-10T00:00:00.000Z',
        txHash: '7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef',
        stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef',
      },
    ],
  },
  {
    id: 'sub_20260115_4a5b6c',
    planId: 'plan_enterprise_yearly',
    planName: 'Enterprise Annual',
    customerEmail: 'billing@solarkit.io',
    customerWallet: 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG',
    amount: 490.0,
    asset: 'USDC',
    interval: 'yearly',
    status: 'active',
    currentPeriodStart: '2026-01-15T00:00:00.000Z',
    currentPeriodEnd: '2027-01-15T00:00:00.000Z',
    nextChargeDate: '2027-01-15T00:00:00.000Z',
    createdAt: '2026-01-15T14:20:00.000Z',
    invoices: [
      {
        id: 'inv_20260115_03',
        subscriptionId: 'sub_20260115_4a5b6c',
        amount: 490.0,
        asset: 'USDC',
        status: 'paid',
        date: '2026-01-15T14:20:00.000Z',
        periodStart: '2026-01-15T00:00:00.000Z',
        periodEnd: '2027-01-15T00:00:00.000Z',
        txHash: '3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
        stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
      },
    ],
  },
  {
    id: 'sub_20260120_9x8y7z',
    planId: 'plan_euro_monthly',
    planName: 'Euro Business Monthly',
    customerEmail: 'marc@parisnode.fr',
    customerWallet: 'GCRQYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7AB',
    amount: 25.0,
    asset: 'EURC',
    interval: 'monthly',
    status: 'paused',
    currentPeriodStart: '2026-01-20T00:00:00.000Z',
    currentPeriodEnd: '2026-02-20T00:00:00.000Z',
    nextChargeDate: '2026-03-20T00:00:00.000Z',
    pausedAt: '2026-02-15T10:00:00.000Z',
    createdAt: '2026-01-20T11:00:00.000Z',
    invoices: [
      {
        id: 'inv_20260120_04',
        subscriptionId: 'sub_20260120_9x8y7z',
        amount: 25.0,
        asset: 'EURC',
        status: 'paid',
        date: '2026-01-20T11:05:00.000Z',
        periodStart: '2026-01-20T00:00:00.000Z',
        periodEnd: '2026-02-20T00:00:00.000Z',
        txHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      },
    ],
  },
  {
    id: 'sub_20260105_cancelled_05',
    planId: 'plan_starter_monthly',
    planName: 'Starter Tier',
    customerEmail: 'old.client@archive.com',
    customerWallet: 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV',
    amount: 19.0,
    asset: 'USDC',
    interval: 'monthly',
    status: 'cancelled',
    currentPeriodStart: '2026-01-05T00:00:00.000Z',
    currentPeriodEnd: '2026-02-05T00:00:00.000Z',
    nextChargeDate: '—',
    cancelledAt: '2026-02-01T15:00:00.000Z',
    createdAt: '2026-01-05T10:00:00.000Z',
    invoices: [
      {
        id: 'inv_20260105_05',
        subscriptionId: 'sub_20260105_cancelled_05',
        amount: 19.0,
        asset: 'USDC',
        status: 'paid',
        date: '2026-01-05T10:05:00.000Z',
        periodStart: '2026-01-05T00:00:00.000Z',
        periodEnd: '2026-02-05T00:00:00.000Z',
      },
    ],
  },
];

/**
 * Calculates next charge date based on plan interval and reference date.
 */
export function calculateNextChargeDate(interval: PlanInterval, referenceDate: Date = new Date()): string {
  const next = new Date(referenceDate);
  if (interval === 'weekly') {
    next.setUTCDate(next.getUTCDate() + 7);
  } else if (interval === 'yearly') {
    next.setUTCFullYear(next.getUTCFullYear() + 1);
  } else {
    // default monthly
    next.setUTCMonth(next.getUTCMonth() + 1);
  }
  return next.toISOString();
}

/**
 * Plan CRUD operations
 */
export function createPlan(input: CreatePlanInput): SubscriptionPlan {
  if (!input.name.trim()) {
    throw new Error('Plan name is required.');
  }
  if (input.amount <= 0) {
    throw new Error('Plan amount must be greater than 0.');
  }

  const now = new Date().toISOString();
  const id = `plan_${input.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString(36)}`;

  return {
    id,
    name: input.name.trim(),
    description: input.description?.trim(),
    amount: input.amount,
    asset: input.asset,
    interval: input.interval,
    trialDays: Math.max(0, input.trialDays || 0),
    status: 'active',
    subscriberCount: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function updatePlan(
  plan: SubscriptionPlan,
  updates: UpdatePlanInput
): SubscriptionPlan {
  return {
    ...plan,
    name: updates.name !== undefined ? updates.name.trim() : plan.name,
    description: updates.description !== undefined ? updates.description.trim() : plan.description,
    amount: updates.amount !== undefined ? updates.amount : plan.amount,
    trialDays: updates.trialDays !== undefined ? Math.max(0, updates.trialDays) : plan.trialDays,
    updatedAt: new Date().toISOString(),
  };
}

export function archivePlan(plan: SubscriptionPlan): SubscriptionPlan {
  return {
    ...plan,
    status: 'archived',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Subscription Lifecycle Actions
 */
export function pauseSubscription(sub: Subscription): Subscription {
  if (sub.status === 'cancelled') {
    throw new Error('Cancelled subscriptions cannot be paused.');
  }
  return {
    ...sub,
    status: 'paused',
    pausedAt: new Date().toISOString(),
  };
}

export function resumeSubscription(sub: Subscription): Subscription {
  if (sub.status !== 'paused') {
    throw new Error('Only paused subscriptions can be resumed.');
  }
  return {
    ...sub,
    status: 'active',
    pausedAt: undefined,
  };
}

export function cancelSubscription(sub: Subscription): Subscription {
  if (sub.status === 'cancelled') {
    return sub;
  }
  return {
    ...sub,
    status: 'cancelled',
    cancelledAt: new Date().toISOString(),
    nextChargeDate: '—',
  };
}

/**
 * Creates a new customer subscription from hosted checkout
 */
export function subscribeCustomerToPlan(
  plan: SubscriptionPlan,
  customerEmail: string,
  customerWallet: string
): Subscription {
  const now = new Date();
  const nowIso = now.toISOString();

  let trialEndsAt: string | undefined = undefined;
  let nextChargeDate: string;

  if (plan.trialDays > 0) {
    const trialDate = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);
    trialEndsAt = trialDate.toISOString();
    nextChargeDate = trialEndsAt;
  } else {
    nextChargeDate = calculateNextChargeDate(plan.interval, now);
  }

  const subId = `sub_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const initialInvoice: SubscriptionInvoice = {
    id: `inv_${Date.now().toString(36)}`,
    subscriptionId: subId,
    amount: plan.trialDays > 0 ? 0 : plan.amount,
    asset: plan.asset,
    status: 'paid',
    date: nowIso,
    periodStart: nowIso,
    periodEnd: nextChargeDate,
    txHash: `tx_${Math.random().toString(16).slice(2, 10)}${Math.random().toString(16).slice(2, 10)}`,
  };

  return {
    id: subId,
    planId: plan.id,
    planName: plan.name,
    customerEmail,
    customerWallet,
    amount: plan.amount,
    asset: plan.asset,
    interval: plan.interval,
    status: 'active',
    currentPeriodStart: nowIso,
    currentPeriodEnd: nextChargeDate,
    nextChargeDate,
    trialEndsAt,
    createdAt: nowIso,
    invoices: [initialInvoice],
  };
}

/**
 * Metrics Calculators
 */
export function calculateMRR(subscriptions: Subscription[]): number {
  return subscriptions
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => {
      if (s.interval === 'yearly') return sum + s.amount / 12;
      if (s.interval === 'weekly') return sum + s.amount * 4.33;
      return sum + s.amount;
    }, 0);
}

export function calculateSubscribersCount(subscriptions: Subscription[]): {
  active: number;
  pastDue: number;
  paused: number;
  cancelled: number;
  total: number;
} {
  return {
    active: subscriptions.filter((s) => s.status === 'active').length,
    pastDue: subscriptions.filter((s) => s.status === 'past_due').length,
    paused: subscriptions.filter((s) => s.status === 'paused').length,
    cancelled: subscriptions.filter((s) => s.status === 'cancelled').length,
    total: subscriptions.length,
  };
}
