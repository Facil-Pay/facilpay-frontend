import type { Metadata } from "next";
import Link from "next/link";

import { getDashboardData } from "@/app/lib/api/dashboard";
import { KpiCards }              from "@/app/components/dashboard/KpiCards";
import { RevenueTrendChart }     from "@/app/components/dashboard/RevenueTrendChart";
import { StatusBreakdownChart }  from "@/app/components/dashboard/StatusBreakdown";
import { NetworkDistribution }   from "@/app/components/dashboard/NetworkDistribution";
import { RecentActivity }        from "@/app/components/dashboard/RecentActivity";

export const metadata: Metadata = {
  title: "Dashboard — FacilPay",
  description:
    "Merchant overview: payment volume, success rate, recent activity and on-chain network breakdown.",
};

// ─── Icons ────────────────────────────────────────────────────────────────────

function AlertIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
    </svg>
  );
}

function PaymentsIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Alert banner ─────────────────────────────────────────────────────────────

function AlertBanner({
  failedCount,
  pendingCount,
}: {
  failedCount: number;
  pendingCount: number;
}) {
  if (failedCount === 0 && pendingCount === 0) return null;

  const parts: string[] = [];
  if (failedCount > 0)
    parts.push(`${failedCount} failed payment${failedCount !== 1 ? "s" : ""} need attention`);
  if (pendingCount > 0)
    parts.push(`${pendingCount} pending payment${pendingCount !== 1 ? "s" : ""} awaiting action`);

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <span className="text-amber-600 mt-0.5">
        <AlertIcon />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-amber-800">Action required</p>
        <p className="text-xs text-amber-700 mt-0.5">{parts.join(" · ")}</p>
      </div>
      <Link
        href="/payments"
        className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
      >
        Review
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
        </svg>
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const data = getDashboardData();
  const { kpi, monthlyRevenue, statusBreakdown, networkBreakdown, recentPayments } = data;

  const generatedTime = new Date(data.generatedAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Overview</h1>
            <p className="text-sm text-zinc-500 mt-0.5">
              Business health at a glance
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Refreshed time */}
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <RefreshIcon />
              <span>Updated {generatedTime}</span>
            </div>

            {/* CTA */}
            <Link
              href="/payments"
              className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-[#000F24] hover:bg-[#001a3d] text-white text-sm font-semibold transition-colors shadow-sm"
            >
              <PaymentsIcon />
              All Payments
            </Link>
          </div>
        </div>

        {/* ── Action-required alert ── */}
        <AlertBanner
          failedCount={kpi.failedCount}
          pendingCount={kpi.pendingCount}
        />

        {/* ── KPI cards ── */}
        <KpiCards kpi={kpi} monthly={monthlyRevenue} />

        {/* ── Middle row: revenue chart (2/3) + status donut (1/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueTrendChart data={monthlyRevenue} />
          </div>
          <div className="lg:col-span-1">
            <StatusBreakdownChart data={statusBreakdown} />
          </div>
        </div>

        {/* ── Bottom row: activity feed (2/3) + network (1/3) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentActivity payments={recentPayments} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <NetworkDistribution data={networkBreakdown} />

            {/* Quick links card */}
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5">
              <h2 className="text-sm font-semibold text-zinc-900 mb-3">Quick Links</h2>
              <ul className="space-y-2">
                {[
                  { href: "/payments?status=failed",     label: "Failed payments",    count: kpi.failedCount,     color: "text-red-600"     },
                  { href: "/payments?status=pending",    label: "Pending payments",   count: kpi.pendingCount,    color: "text-amber-600"   },
                  { href: "/payments?status=processing", label: "Processing now",     count: kpi.processingCount, color: "text-sky-600"     },
                  { href: "/payments?status=refunded",   label: "Refunded",           count: kpi.refundedCount,   color: "text-zinc-600"    },
                ].map(({ href, label, count, color }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="flex items-center justify-between rounded-xl px-3 py-2 hover:bg-zinc-50 transition-colors group"
                    >
                      <span className="text-sm text-zinc-700 group-hover:text-zinc-900 transition-colors">
                        {label}
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${color}`}>
                        {count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
