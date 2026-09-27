import { getMockPayments } from "@/app/lib/api/payments";
import type { Payment, PaymentStatus, PaymentNetwork } from "@/app/lib/types/payment";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KpiMetrics {
  totalVolumeUsd: number;
  totalVolumeChange: number;      // % vs prior period (mock delta)
  completedCount: number;
  completedChange: number;        // % delta
  successRate: number;            // % of terminal payments that completed
  successRateChange: number;      // pp delta
  avgTransactionUsd: number;
  avgTransactionChange: number;   // % delta
  pendingCount: number;
  failedCount: number;
  refundedCount: number;
  cancelledCount: number;
  processingCount: number;
}

export interface MonthlyRevenue {
  month: string;    // "Apr", "May", …
  year: number;
  volumeUsd: number;
  count: number;
}

export interface StatusBreakdown {
  status: PaymentStatus;
  count: number;
  volumeUsd: number;
  pct: number;     // % of total count
}

export interface NetworkBreakdown {
  network: PaymentNetwork;
  count: number;
  volumeUsd: number;
  pct: number;
}

export interface RecentPayment {
  id: string;
  reference: string;
  status: PaymentStatus;
  senderName: string;
  recipientName: string;
  amountUsd: number;
  currency: string;
  network?: PaymentNetwork;
  createdAt: string;
}

export interface DashboardData {
  kpi: KpiMetrics;
  monthlyRevenue: MonthlyRevenue[];
  statusBreakdown: StatusBreakdown[];
  networkBreakdown: NetworkBreakdown[];
  recentPayments: RecentPayment[];
  generatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(iso: string): string {
  return MONTH_LABELS[new Date(iso).getMonth()];
}

// ─── Main aggregator ──────────────────────────────────────────────────────────

export function getDashboardData(): DashboardData {
  const payments: Payment[] = getMockPayments();

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalVolumeUsd = payments.reduce((s, p) => s + (p.amountUsd ?? p.amount), 0);
  const completedPayments = payments.filter((p) => p.status === "completed");
  const completedCount = completedPayments.length;

  // Terminal: completed + failed + refunded + cancelled
  const terminal = payments.filter((p) =>
    ["completed", "failed", "refunded", "cancelled"].includes(p.status)
  );
  const successRate = terminal.length > 0
    ? (completedCount / terminal.length) * 100
    : 0;

  const avgTransactionUsd = payments.length > 0 ? totalVolumeUsd / payments.length : 0;

  // Mock deltas — represent WoW or MoM change vs previous period
  const kpi: KpiMetrics = {
    totalVolumeUsd,
    totalVolumeChange: +12.4,
    completedCount,
    completedChange: +8.1,
    successRate,
    successRateChange: +2.3,
    avgTransactionUsd,
    avgTransactionChange: +4.7,
    pendingCount:    payments.filter((p) => p.status === "pending").length,
    processingCount: payments.filter((p) => p.status === "processing").length,
    failedCount:     payments.filter((p) => p.status === "failed").length,
    refundedCount:   payments.filter((p) => p.status === "refunded").length,
    cancelledCount:  payments.filter((p) => p.status === "cancelled").length,
  };

  // ── Monthly revenue (last 6 months present in data) ───────────────────────
  const monthMap = new Map<string, { volumeUsd: number; count: number; iso: string }>();
  for (const p of payments) {
    const key = monthKey(p.createdAt);
    const existing = monthMap.get(key);
    if (existing) {
      existing.volumeUsd += p.amountUsd ?? p.amount;
      existing.count += 1;
    } else {
      monthMap.set(key, { volumeUsd: p.amountUsd ?? p.amount, count: 1, iso: p.createdAt });
    }
  }

  // Sort chronologically and take last 6
  const sortedMonths = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6);

  const monthlyRevenue: MonthlyRevenue[] = sortedMonths.map(([, v]) => ({
    month: monthLabel(v.iso),
    year: new Date(v.iso).getFullYear(),
    volumeUsd: v.volumeUsd,
    count: v.count,
  }));

  // ── Status breakdown ──────────────────────────────────────────────────────
  const statusMap = new Map<PaymentStatus, { count: number; volumeUsd: number }>();
  for (const p of payments) {
    const entry = statusMap.get(p.status);
    const vol = p.amountUsd ?? p.amount;
    if (entry) {
      entry.count += 1;
      entry.volumeUsd += vol;
    } else {
      statusMap.set(p.status, { count: 1, volumeUsd: vol });
    }
  }

  const totalCount = payments.length;
  const statusBreakdown: StatusBreakdown[] = Array.from(statusMap.entries())
    .map(([status, { count, volumeUsd }]) => ({
      status,
      count,
      volumeUsd,
      pct: (count / totalCount) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Network breakdown ─────────────────────────────────────────────────────
  const networkMap = new Map<PaymentNetwork, { count: number; volumeUsd: number }>();
  for (const p of payments) {
    if (!p.network) continue;
    const entry = networkMap.get(p.network);
    const vol = p.amountUsd ?? p.amount;
    if (entry) {
      entry.count += 1;
      entry.volumeUsd += vol;
    } else {
      networkMap.set(p.network, { count: 1, volumeUsd: vol });
    }
  }

  const totalNetworkCount = Array.from(networkMap.values()).reduce((s, v) => s + v.count, 0);
  const networkBreakdown: NetworkBreakdown[] = Array.from(networkMap.entries())
    .map(([network, { count, volumeUsd }]) => ({
      network,
      count,
      volumeUsd,
      pct: (count / totalNetworkCount) * 100,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Recent payments (10 most recent) ─────────────────────────────────────
  const recentPayments: RecentPayment[] = [...payments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10)
    .map((p) => ({
      id: p.id,
      reference: p.reference,
      status: p.status,
      senderName: p.sender.name,
      recipientName: p.recipient.name,
      amountUsd: p.amountUsd ?? p.amount,
      currency: p.currency,
      network: p.network,
      createdAt: p.createdAt,
    }));

  return {
    kpi,
    monthlyRevenue,
    statusBreakdown,
    networkBreakdown,
    recentPayments,
    generatedAt: new Date().toISOString(),
  };
}
