// Horizontal stacked bar + breakdown for network distribution.
// Pure SVG / Tailwind — no library.

import { Card, CardHeader, CardDivider } from "@/app/components/ui/Card";
import type { NetworkBreakdown } from "@/app/lib/api/dashboard";
import type { PaymentNetwork } from "@/app/lib/types/payment";

function GlobeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
    </svg>
  );
}

const NETWORK_COLORS: Record<PaymentNetwork, string> = {
  stellar:  "#55C2FF",
  ethereum: "#7c3aed",
  solana:   "#10b981",
  bitcoin:  "#f59e0b",
};

const NETWORK_LABELS: Record<PaymentNetwork, string> = {
  stellar:  "Stellar",
  ethereum: "Ethereum",
  solana:   "Solana",
  bitcoin:  "Bitcoin",
};

// Simple chain icon text fallback
const NETWORK_SYMBOLS: Record<PaymentNetwork, string> = {
  stellar:  "XLM",
  ethereum: "ETH",
  solana:   "SOL",
  bitcoin:  "BTC",
};

interface NetworkDistributionProps {
  data: NetworkBreakdown[];
}

export function NetworkDistribution({ data }: NetworkDistributionProps) {
  const totalTxns = data.reduce((s, d) => s + d.count, 0);
  const totalVol  = data.reduce((s, d) => s + d.volumeUsd, 0);

  const fmt = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(1)}M`
      : `$${(v / 1_000).toFixed(1)}K`;

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={<GlobeIcon />}
        title="Network Distribution"
        subtitle="Payments by blockchain network"
      />
      <CardDivider className="mt-4 mb-5" />

      {/* Stacked bar */}
      <div className="w-full h-4 rounded-full overflow-hidden flex">
        {data.map((d) => (
          <div
            key={d.network}
            style={{
              width: `${d.pct}%`,
              backgroundColor: NETWORK_COLORS[d.network],
            }}
            title={`${NETWORK_LABELS[d.network]}: ${d.pct.toFixed(1)}%`}
            className="transition-all"
          />
        ))}
      </div>

      {/* Network rows */}
      <ul className="mt-4 space-y-3">
        {data.map((d) => (
          <li key={d.network} className="flex items-center gap-3">
            {/* Symbol badge */}
            <div
              className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white select-none"
              style={{ backgroundColor: NETWORK_COLORS[d.network] }}
            >
              {NETWORK_SYMBOLS[d.network]}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-zinc-800">
                  {NETWORK_LABELS[d.network]}
                </span>
                <span className="text-xs font-semibold text-zinc-900 tabular-nums">
                  {d.pct.toFixed(1)}%
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${d.pct}%`,
                    backgroundColor: NETWORK_COLORS[d.network],
                  }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="text-right shrink-0 w-20">
              <p className="text-xs font-semibold text-zinc-900 tabular-nums">
                {fmt(d.volumeUsd)}
              </p>
              <p className="text-[10px] text-zinc-400 tabular-nums">
                {d.count} tx
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Footer totals */}
      <div className="mt-4 pt-3 border-t border-zinc-50 flex items-center justify-between text-xs text-zinc-400">
        <span className="tabular-nums">{totalTxns} total transactions</span>
        <span className="tabular-nums">{fmt(totalVol)} total volume</span>
      </div>
    </Card>
  );
}
