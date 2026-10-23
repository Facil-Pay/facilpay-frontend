import type { ReactNode } from "react";
import { cn } from "@/components/ui/utils";
import { useFormat } from "@/lib/i18n/use-format";

export const INSIGHT_COLORS = ["#20a7ee", "#7c9cff", "#16a34a", "#f59e0b", "#8b5cf6", "#ef4444", "#94a3b8"];

/** Locale-aware formatters shared by the insight cards. */
export function useInsightFormat() {
  const f = useFormat();
  return {
    locale: f.locale,
    usd: (value: number) => f.fiat(value, "USD", { maximumFractionDigits: 0 }),
    percent: (ratio: number, digits = 1) => f.percent(ratio, { digits }),
    count: (value: number) => f.number(value),
    date: f.date,
  };
}

export function InsightCard({
  title,
  subtitle,
  className,
  children,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm", className)}>
      <header className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
      </header>
      {children}
    </section>
  );
}

export function InsightEmpty({ message = "No data for this period." }: { message?: string }) {
  return <p className="py-8 text-center text-sm text-zinc-500">{message}</p>;
}
