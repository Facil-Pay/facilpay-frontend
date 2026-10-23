import type { BillingInterval, RecurringPlan, Subscription } from "@/lib/types";

export const INITIAL_RECURRING_PLANS: RecurringPlan[] = [
  {
    id: "plan_starter_monthly",
    name: "Starter",
    description: "Monthly access to core payment tools",
    amount: 49,
    asset: "USDC",
    interval: "monthly",
    status: "ACTIVE",
    createdAt: "2026-07-05T10:00:00.000Z",
  },
  {
    id: "plan_growth_quarterly",
    name: "Growth",
    description: "Quarterly billing for growing teams",
    amount: 399,
    asset: "USDC",
    interval: "quarterly",
    status: "ACTIVE",
    createdAt: "2026-06-18T14:20:00.000Z",
  },
  {
    id: "plan_euro_monthly",
    name: "Europe Operations",
    description: "Regional settlement and support package",
    amount: 89,
    asset: "EURC",
    interval: "monthly",
    status: "ACTIVE",
    createdAt: "2026-08-02T09:15:00.000Z",
  },
];

export const INITIAL_SUBSCRIPTIONS: Subscription[] = [
  {
    id: "sub_01J8F4X9",
    customerName: "Maya Chen",
    customerEmail: "maya@northstar.studio",
    planId: "plan_starter_monthly",
    amount: 49,
    asset: "USDC",
    interval: "monthly",
    status: "ACTIVE",
    startedAt: "2026-08-21T12:00:00.000Z",
    nextBillingAt: "2026-10-21T12:00:00.000Z",
    lastPaymentStatus: "PAID",
  },
  {
    id: "sub_01J9A2M7",
    customerName: "Omar Ibrahim",
    customerEmail: "omar@orbitworks.io",
    planId: "plan_growth_quarterly",
    amount: 399,
    asset: "USDC",
    interval: "quarterly",
    status: "ACTIVE",
    startedAt: "2026-07-12T09:30:00.000Z",
    nextBillingAt: "2026-10-12T09:30:00.000Z",
    lastPaymentStatus: "PAID",
  },
  {
    id: "sub_01J9P8B3",
    customerName: "Sofia Laurent",
    customerEmail: "sofia@atelier-lumiere.fr",
    planId: "plan_euro_monthly",
    amount: 89,
    asset: "EURC",
    interval: "monthly",
    status: "PAST_DUE",
    startedAt: "2026-08-08T08:00:00.000Z",
    nextBillingAt: "2026-10-08T08:00:00.000Z",
    lastPaymentStatus: "FAILED",
  },
  {
    id: "sub_01J9W5T1",
    customerName: "Eli Brooks",
    customerEmail: "eli@fieldnote.design",
    planId: "plan_starter_monthly",
    amount: 49,
    asset: "USDC",
    interval: "monthly",
    status: "PAUSED",
    startedAt: "2026-06-03T16:00:00.000Z",
    nextBillingAt: null,
    lastPaymentStatus: "PAID",
  },
];

export function nextBillingDate(anchorDate: string | Date, interval: BillingInterval): string {
  const anchor = new Date(anchorDate);
  if (Number.isNaN(anchor.getTime())) throw new Error("A valid billing start date is required.");

  if (interval === "weekly") {
    anchor.setUTCDate(anchor.getUTCDate() + 7);
    return anchor.toISOString();
  }

  const monthOffset = interval === "monthly" ? 1 : interval === "quarterly" ? 3 : 12;
  const targetMonth = anchor.getUTCMonth() + monthOffset;
  const targetYear = anchor.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = targetMonth % 12;
  const finalDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  anchor.setUTCDate(1);
  anchor.setUTCFullYear(targetYear, normalizedMonth, Math.min(new Date(anchorDate).getUTCDate(), finalDay));
  return anchor.toISOString();
}

export function billingIntervalLabel(interval: BillingInterval): string {
  const labels: Record<BillingInterval, string> = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Every 3 months",
    yearly: "Yearly",
  };
  return labels[interval];
}