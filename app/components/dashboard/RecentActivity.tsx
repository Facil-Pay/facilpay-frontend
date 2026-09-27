import Link from "next/link";
import { Card, CardHeader, CardDivider } from "@/app/components/ui/Card";
import { PaymentStatusBadge } from "@/app/components/payments/PaymentStatusBadge";
import type { RecentPayment } from "@/app/lib/api/dashboard";
import type { PaymentNetwork } from "@/app/lib/types/payment";

// ─── Icons ────────────────────────────────────────────────────────────────────

function ClockIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
    </svg>
  );
}

// ─── Network colour dot ───────────────────────────────────────────────────────

const NETWORK_COLORS: Record<PaymentNetwork, string> = {
  stellar:  "bg-[#55C2FF]",
  ethereum: "bg-violet-500",
  solana:   "bg-emerald-500",
  bitcoin:  "bg-amber-500",
};

// ─── Relative time helper ─────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);

  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

// ─── Single row ───────────────────────────────────────────────────────────────

function ActivityRow({ payment }: { payment: RecentPayment }) {
  const fmtAmt = payment.amountUsd.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const networkDot =
    payment.network && NETWORK_COLORS[payment.network]
      ? NETWORK_COLORS[payment.network]
      : "bg-zinc-400";

  return (
    <Link
      href={`/payments/${payment.id}`}
      className="group flex items-center gap-3 px-5 py-3.5 hover:bg-[#F5F7FA] transition-colors border-b border-zinc-50 last:border-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#55C2FF]"
    >
      {/* Avatar */}
      <div className="h-8 w-8 rounded-full bg-[#000F24] flex items-center justify-center text-white text-[10px] font-bold select-none shrink-0">
        {initials(payment.senderName)}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-zinc-900 group-hover:text-[#0077B6] transition-colors">
            {payment.reference}
          </span>
          <PaymentStatusBadge status={payment.status} size="sm" dot={false} />
        </div>
        <p className="text-xs text-zinc-500 truncate mt-0.5">
          {payment.senderName}
          <span className="text-zinc-300 mx-1">→</span>
          {payment.recipientName}
        </p>
      </div>

      {/* Network + time */}
      <div className="hidden sm:flex flex-col items-end gap-0.5 shrink-0 w-20">
        <div className="flex items-center gap-1">
          <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${networkDot}`} />
          <span className="text-[10px] text-zinc-400 capitalize">{payment.network ?? "—"}</span>
        </div>
        <span className="text-[10px] text-zinc-400 tabular-nums">
          {relativeTime(payment.createdAt)}
        </span>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0 w-24">
        <span className="text-sm font-bold text-zinc-900 tabular-nums">${fmtAmt}</span>
      </div>

      {/* Arrow */}
      <div className="text-zinc-300 group-hover:text-[#55C2FF] transition-colors shrink-0">
        <ArrowRightIcon />
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface RecentActivityProps {
  payments: RecentPayment[];
}

export function RecentActivity({ payments }: RecentActivityProps) {
  return (
    <Card noPadding>
      <div className="px-5 pt-5 pb-4">
        <CardHeader
          icon={<ClockIcon />}
          title="Recent Activity"
          subtitle="Last 10 transactions"
          action={
            <Link
              href="/payments"
              className="inline-flex items-center gap-1 text-sm font-medium text-[#0077B6] hover:text-[#55C2FF] transition-colors"
            >
              View all
              <ArrowRightIcon />
            </Link>
          }
        />
      </div>

      <CardDivider />

      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center px-6">
          <p className="text-sm text-zinc-500">No recent payments to display.</p>
        </div>
      ) : (
        <ul role="list" aria-label="Recent payment activity">
          {payments.map((p) => (
            <li key={p.id}>
              <ActivityRow payment={p} />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
