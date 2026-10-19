import { describe, it, expect } from 'vitest';
import {
  INITIAL_PLANS,
  INITIAL_SUBSCRIPTIONS,
  createPlan,
  updatePlan,
  archivePlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  subscribeCustomerToPlan,
  calculateNextChargeDate,
  calculateMRR,
  calculateSubscribersCount,
} from '../lib/subscriptions';
import { SubscriptionPlan, Subscription } from '../lib/types/subscription';

describe('Subscriptions and Recurring Payment Plans Specification (Issue #71)', () => {
  describe('Plan Creation, Editing and Archival', () => {
    it('creates a new monthly plan with trial days', () => {
      const plan = createPlan({
        name: 'Growth Plan',
        description: 'For scaling fintech startups',
        amount: 99.0,
        asset: 'USDC',
        interval: 'monthly',
        trialDays: 14,
      });

      expect(plan.id).toContain('plan_growth_plan');
      expect(plan.name).toBe('Growth Plan');
      expect(plan.amount).toBe(99.0);
      expect(plan.asset).toBe('USDC');
      expect(plan.interval).toBe('monthly');
      expect(plan.trialDays).toBe(14);
      expect(plan.status).toBe('active');
      expect(plan.subscriberCount).toBe(0);
    });

    it('rejects plan creation with empty name or negative amount', () => {
      expect(() =>
        createPlan({
          name: '',
          amount: 50,
          asset: 'USDC',
          interval: 'monthly',
        })
      ).toThrow('Plan name is required');

      expect(() =>
        createPlan({
          name: 'Invalid Plan',
          amount: 0,
          asset: 'USDC',
          interval: 'monthly',
        })
      ).toThrow('Plan amount must be greater than 0');
    });

    it('edits an existing plan amount and name', () => {
      const original = INITIAL_PLANS[0];
      const updated = updatePlan(original, {
        name: 'Starter Tier v2',
        amount: 25.0,
        trialDays: 7,
      });

      expect(updated.name).toBe('Starter Tier v2');
      expect(updated.amount).toBe(25.0);
      expect(updated.trialDays).toBe(7);
      expect(updated.asset).toBe(original.asset);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
        new Date(original.updatedAt).getTime()
      );
    });

    it('archives a plan and updates its status', () => {
      const plan = INITIAL_PLANS[1];
      const archived = archivePlan(plan);

      expect(archived.status).toBe('archived');
      expect(archived.id).toBe(plan.id);
    });
  });

  describe('Subscription Status Lifecycle (Active, Paused, Cancelled, Past Due)', () => {
    it('pauses an active subscription', () => {
      const sub = INITIAL_SUBSCRIPTIONS[0];
      expect(sub.status).toBe('active');

      const paused = pauseSubscription(sub);
      expect(paused.status).toBe('paused');
      expect(paused.pausedAt).toBeDefined();
    });

    it('resumes a paused subscription back to active', () => {
      const sub = INITIAL_SUBSCRIPTIONS[3]; // already paused
      expect(sub.status).toBe('paused');

      const resumed = resumeSubscription(sub);
      expect(resumed.status).toBe('active');
      expect(resumed.pausedAt).toBeUndefined();
    });

    it('cancels a subscription and terminates future billing', () => {
      const sub = INITIAL_SUBSCRIPTIONS[0];
      const cancelled = cancelSubscription(sub);

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.cancelledAt).toBeDefined();
      expect(cancelled.nextChargeDate).toBe('—');
    });

    it('prevents pausing a cancelled subscription', () => {
      const sub = INITIAL_SUBSCRIPTIONS[4]; // cancelled
      expect(sub.status).toBe('cancelled');

      expect(() => pauseSubscription(sub)).toThrow('Cancelled subscriptions cannot be paused');
    });
  });

  describe('Invoice History & Hosted Checkout Integration', () => {
    it('creates a new subscription from checkout with an initial paid invoice', () => {
      const plan: SubscriptionPlan = {
        id: 'plan_vip',
        name: 'VIP Club',
        amount: 100,
        asset: 'USDC',
        interval: 'monthly',
        trialDays: 0,
        status: 'active',
        subscriberCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sub = subscribeCustomerToPlan(
        plan,
        'vip.customer@domain.com',
        'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A'
      );

      expect(sub.customerEmail).toBe('vip.customer@domain.com');
      expect(sub.planName).toBe('VIP Club');
      expect(sub.status).toBe('active');
      expect(sub.invoices.length).toBe(1);
      expect(sub.invoices[0].status).toBe('paid');
      expect(sub.invoices[0].amount).toBe(100);
      expect(sub.invoices[0].txHash).toBeTruthy();
    });

    it('correctly schedules trial end date when subscribing to a plan with trial days', () => {
      const trialPlan: SubscriptionPlan = {
        id: 'plan_trial',
        name: 'Trial Tier',
        amount: 50,
        asset: 'USDC',
        interval: 'monthly',
        trialDays: 14,
        status: 'active',
        subscriberCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sub = subscribeCustomerToPlan(
        trialPlan,
        'trial.user@test.org',
        'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5'
      );

      expect(sub.trialEndsAt).toBeDefined();
      expect(sub.invoices[0].amount).toBe(0); // $0 during trial

      const trialDate = new Date(sub.trialEndsAt!);
      const now = new Date();
      const diffDays = Math.round((trialDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
      expect(diffDays).toBe(14);
    });

    it('calculates correct next charge dates for weekly, monthly, and yearly intervals', () => {
      const base = new Date('2026-03-01T00:00:00.000Z');

      const nextWeek = calculateNextChargeDate('weekly', base);
      expect(nextWeek.slice(0, 10)).toBe('2026-03-08');

      const nextMonth = calculateNextChargeDate('monthly', base);
      expect(nextMonth.slice(0, 10)).toBe('2026-04-01');

      const nextYear = calculateNextChargeDate('yearly', base);
      expect(nextYear.slice(0, 10)).toBe('2027-03-01');
    });
  });

  describe('Revenue & Subscriber Metrics', () => {
    it('calculates active MRR correctly', () => {
      const mrr = calculateMRR(INITIAL_SUBSCRIPTIONS);
      expect(mrr).toBeGreaterThan(0);
    });

    it('counts subscriber statuses accurately', () => {
      const counts = calculateSubscribersCount(INITIAL_SUBSCRIPTIONS);
      expect(counts.total).toBe(INITIAL_SUBSCRIPTIONS.length);
      expect(counts.active).toBeGreaterThanOrEqual(1);
      expect(counts.pastDue).toBeGreaterThanOrEqual(1);
      expect(counts.paused).toBeGreaterThanOrEqual(1);
      expect(counts.cancelled).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Fixtures and Checkout Integration Verification', () => {
    it('provides fixtures matching all requirements in Issue #71', () => {
      for (const plan of INITIAL_PLANS) {
        expect(plan.id).toBeTruthy();
        expect(plan.name).toBeTruthy();
        expect(plan.amount).toBeGreaterThan(0);
        expect(['weekly', 'monthly', 'yearly']).toContain(plan.interval);
        expect(['USDC', 'EURC', 'XLM']).toContain(plan.asset);
        expect(plan.trialDays).toBeGreaterThanOrEqual(0);
      }

      for (const sub of INITIAL_SUBSCRIPTIONS) {
        expect(sub.id).toBeTruthy();
        expect(['active', 'past_due', 'paused', 'cancelled']).toContain(sub.status);
        expect(sub.customerEmail).toContain('@');
        expect(sub.customerWallet.startsWith('G')).toBe(true);
        expect(sub.customerWallet.length).toBeGreaterThanOrEqual(40);
        expect(Array.isArray(sub.invoices)).toBe(true);
        expect(sub.invoices.length).toBeGreaterThanOrEqual(1);
        for (const inv of sub.invoices) {
          expect(inv.id).toBeTruthy();
          expect(['paid', 'pending', 'failed']).toContain(inv.status);
          expect(inv.amount).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('matches planId lookup for hosted checkout URL query parameters', () => {
      const targetPlanId = 'plan_pro_monthly';
      const plan = INITIAL_PLANS.find((p) => p.id === targetPlanId);
      expect(plan).toBeDefined();
      expect(plan?.name).toBe('Pro Professional');
      expect(plan?.interval).toBe('monthly');
      expect(plan?.amount).toBe(49.0);
    });
  });
});

