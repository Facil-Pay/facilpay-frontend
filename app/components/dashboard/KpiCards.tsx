import { Sparkline } from "@/app/components/dashboard/Sparkline";
import type { KpiMetrics, MonthlyRevenue } from "@/app/lib/api/dashboard";

// ─── Icons ────────────────────────────────────────────────────────────────────

function TrendUpIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-3.5 w-3.5 ${className}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.918z" clipRule="evenodd" />
    </svg>
  );
}

function TrendDownIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={`h-3.5 w-3.5 ${className}`} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M1.22 5.222a.75.75 0 011.06 0L7 9.942l3.768-3.769a.75.75 0 011.113.058 20.908 20.908 0 013.813 7.254l1.574-2.727a.75.75 0 011.3.75l-2.475 4.286a.75.75 0 01-1.025.275l-4.287-2.475a.75.75 0 01.75-1.3l2.71 1.565a19.422 19.422 0 00-3.013-6.024L7.53 11.533a.75.75 0 01-1.06 0l-5.25-5.25a.75.75 0 010-1.06z" clipRule="evenodd" />
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M10.75 10.818v2.614A3.13 3.13 0 0011.888 13c.482-.315.612-.648.612-.875 0-.227-.13-.56-.612-.875a3.13 3.13 0 00-1.138-.432zM8.33 8.62c.053.055.115.11.184.164.208.16.46.284.736.363V6.603a2.45 2.45 0 00-.35.13c-.14.065-.27.143-.386.233-.377.292-.514.627-.514.909 0 .184.058.39.33.585z" />
      <path fillRule="evenodd" d="M9.99 2a1 1 0 00-1 1v.942a5.25 5.25 0 000 10.116V15h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1v-.942a5.25 5.25 0 000-10.116V3a1 1 0 00-1-1zm1 10.75v2.434a3.748 3.748 0 000-2.435zm-2-4.69V5.625a3.75 3.75 0 000 2.435z" clipRule="evenodd" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
    </svg>
  );
}

function ShieldCheckIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M9.661 2.237a.531.531 0 01.678 0 11.947 11.947 0 007.078 2.749.5.5 0 01.479.497v1.517c0 5.206-3.603 9.548-8.5 10.986C4.388 16.548.785 12.206.785 7V5.483a.5.5 0 01.48-.497 11.947 11.947 0 007.078-2.749h.318zM13.22 8.72a.75.75 0 00-1.06-1.06l-2.91 2.91-1.12-1.12a.75.75 0 00-1.06 1.06l1.65 1.65a.75.75 0 001.06 0l3.44-3.44z" clipRule="evenodd" />
    </svg>
  );
}

function ReceiptIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M2.5 4A1.5 1.5 0 001 5.5V6h18v-.5A1.5 1.5 0 0017.5 4h-15zM19 8.5H1v6A1.5 1.5 0 002.5 16h15a1.5 1.5 0 001.5-1.5v-6zM6 13.25a.75.75 0 01.75-.75h.5a.75.75 0 010 1.5h-.5a.75.75 0 01-.75-.75zm3.25-.75a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Delta badge ──────────────────────────────────────────────────────────────

function DeltaBadge({ change }: { change: number }) {
  const positive = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
        positive ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {positive ? <TrendUpIcon /> : <TrendDownIcon />}
      {positive ? "+" : ""}
      {change.toFixed(1)}%
    </span>
  );
}

// ─── Single KPI card ──────────────────────────────────────────────────────────

interface KpiCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change: number;
  changeSub?: string;
  sparkPoints: number[];
  sparkColor?: string;
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  change,
  changeSub = "vs last period",
  sparkPoints,
  sparkColor = "#55C2FF",
}: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
        {/* Sparkline */}
        <Sparkline points={sparkPoints} width={72} height={32} color={sparkColor} />
      </div>

      <div>
        <p className="text-2xl font-bold text-zinc-900 tabular-nums leading-tight">{value}</p>
        <p className="text-sm text-zinc-500 mt-0.5">{label}</p>
      </div>

      <div className="flex items-center gap-1.5 pt-1 border-t border-zinc-50">
        <DeltaBadge change={change} />
        <span className="text-xs text-zinc-400">{changeSub}</span>
      </div>
    </div>
  );
}

// ─── KPI row ──────────────────────────────────────────────────────────────────

interface KpiCardsProps {
  kpi: KpiMetrics;
  monthly: MonthlyRevenue[];
}

export function KpiCards({ kpi, monthly }: KpiCardsProps) {
  const volumePoints = monthly.map((m) => m.volumeUsd);
  const countPoints  = monthly.map((m) => m.count);

  // Synthetic sparkline for rates (shift points slightly to look distinct)
  const ratePoints   = volumePoints.map((v, i) => v * (0.6 + i * 0.05));
  const avgPoints    = countPoints.map((c, i) => c * (80 + i * 10));

  const fmt2 = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${n.toFixed(2)}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <KpiCard
        icon={<DollarIcon />}
        iconBg="bg-[#55C2FF]/10 text-[#0077B6]"
        label="Total Volume"
        value={fmt2(kpi.totalVolumeUsd)}
        change={kpi.totalVolumeChange}
        sparkPoints={volumePoints}
        sparkColor="#55C2FF"
      />
      <KpiCard
        icon={<CheckCircleIcon />}
        iconBg="bg-emerald-100 text-emerald-600"
        label="Completed Payments"
        value={String(kpi.completedCount)}
        change={kpi.completedChange}
        sparkPoints={countPoints}
        sparkColor="#10b981"
      />
      <KpiCard
        icon={<ShieldCheckIcon />}
        iconBg="bg-violet-100 text-violet-600"
        label="Success Rate"
        value={`${kpi.successRate.toFixed(1)}%`}
        change={kpi.successRateChange}
        changeSub="pp vs last period"
        sparkPoints={ratePoints}
        sparkColor="#7c3aed"
      />
      <KpiCard
        icon={<ReceiptIcon />}
        iconBg="bg-amber-100 text-amber-600"
        label="Avg. Transaction"
        value={fmt2(kpi.avgTransactionUsd)}
        change={kpi.avgTransactionChange}
        sparkPoints={avgPoints}
        sparkColor="#f59e0b"
      />
    </div>
  );
}
