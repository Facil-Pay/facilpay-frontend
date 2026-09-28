import type { PaymentMethod, PaymentMethodShare } from "@/lib/types/analytics";
import { INSIGHT_COLORS, InsightCard, InsightEmpty, percent, usd } from "./InsightCard";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  wallet_connect: "Wallet connect",
  qr_scan: "QR scan",
  manual_transfer: "Manual transfer",
};

export function PaymentMethodSplit({ methods }: { methods: PaymentMethodShare[] }) {
  const total = methods.reduce((sum, item) => sum + item.count, 0);

  return (
    <InsightCard title="Payment method split" subtitle="How customers completed their payments">
      {total === 0 ? (
        <InsightEmpty />
      ) : (
        <>
          <div
            className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-100"
            role="img"
            aria-label={methods.map((m) => `${METHOD_LABEL[m.method]} ${percent(m.count / total)}`).join(", ")}
          >
            {methods.map((method, index) => (
              <div
                key={method.method}
                className="h-full"
                style={{ width: `${(method.count / total) * 100}%`, background: INSIGHT_COLORS[index % INSIGHT_COLORS.length] }}
              />
            ))}
          </div>
          <ul className="mt-4 space-y-3">
            {methods.map((method, index) => (
              <li key={method.method} className="flex items-center justify-between gap-3 text-sm">
                <span className="inline-flex items-center gap-2 text-zinc-900">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: INSIGHT_COLORS[index % INSIGHT_COLORS.length] }} />
                  {METHOD_LABEL[method.method]}
                </span>
                <span className="text-right text-zinc-600">
                  <strong className="text-zinc-900">{percent(method.count / total)}</strong>
                  <span className="block text-xs text-zinc-400">
                    {method.count.toLocaleString()} payments · {usd.format(method.volume)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </InsightCard>
  );
}
