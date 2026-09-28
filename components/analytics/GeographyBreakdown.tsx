import type { CountryVolume } from "@/lib/types/analytics";
import { InsightCard, percent, usd } from "./InsightCard";

const regionNames =
  typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;

function countryName(code: string): string {
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
}

export function GeographyBreakdown({ countries }: { countries: CountryVolume[] }) {
  const rows = [...countries].sort((a, b) => b.volume - a.volume);
  const total = rows.reduce((sum, row) => sum + row.volume, 0);
  if (total === 0) return null;

  return (
    <InsightCard title="Geography" subtitle="Volume by customer country">
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.country}>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-900">{countryName(row.country)}</span>
              <span className="text-zinc-600">
                {usd.format(row.volume)} <span className="text-xs text-zinc-400">({percent(row.volume / total)})</span>
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-zinc-100">
              <div className="h-full rounded-full bg-[#7c9cff]" style={{ width: `${(row.volume / rows[0].volume) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </InsightCard>
  );
}
