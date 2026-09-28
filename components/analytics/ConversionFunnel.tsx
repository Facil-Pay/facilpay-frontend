import { ArrowDown } from "lucide-react";
import type { FunnelStep, FunnelStepKey } from "@/lib/types/analytics";
import { InsightCard, InsightEmpty, percent } from "./InsightCard";

const STEP_LABEL: Record<FunnelStepKey, string> = {
  link_opened: "Link opened",
  wallet_connected: "Wallet connected",
  transaction_signed: "Transaction signed",
  payment_confirmed: "Payment confirmed",
};

const STEP_ORDER: FunnelStepKey[] = ["link_opened", "wallet_connected", "transaction_signed", "payment_confirmed"];

export function ConversionFunnel({ steps }: { steps: FunnelStep[] }) {
  const ordered = STEP_ORDER.map((key) => steps.find((step) => step.key === key) ?? { key, count: 0 });
  const top = ordered[0].count;

  return (
    <InsightCard title="Checkout conversion" subtitle="From opening a payment link to a confirmed payment">
      {top === 0 ? (
        <InsightEmpty />
      ) : (
        <ol className="space-y-1">
          {ordered.map((step, index) => {
            const previous = index > 0 ? ordered[index - 1].count : null;
            const dropOff = previous ? 1 - step.count / previous : 0;
            return (
              <li key={step.key}>
                {previous !== null && (
                  <p className="flex items-center gap-1 py-1 pl-1 text-[11px] font-medium text-red-600">
                    <ArrowDown className="h-3 w-3" aria-hidden="true" />
                    {percent(dropOff)} drop-off
                  </p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-zinc-900">{STEP_LABEL[step.key]}</span>
                  <span className="text-zinc-600">
                    {step.count.toLocaleString()} <span className="text-xs text-zinc-400">({percent(step.count / top)})</span>
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-zinc-100">
                  <div className="h-full rounded-full bg-[#20a7ee]" style={{ width: `${(step.count / top) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {top > 0 && (
        <p className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-500">
          Overall conversion: <strong className="text-zinc-900">{percent(ordered[3].count / top)}</strong>
        </p>
      )}
    </InsightCard>
  );
}
