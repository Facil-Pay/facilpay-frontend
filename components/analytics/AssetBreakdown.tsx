"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { AssetVolume } from "@/lib/types/analytics";
import { INSIGHT_COLORS, InsightCard, InsightEmpty, percent, usd } from "./InsightCard";

export function AssetBreakdown({ assets }: { assets: AssetVolume[] }) {
  const total = assets.reduce((sum, item) => sum + item.volume, 0);
  const rows = [...assets].sort((a, b) => b.volume - a.volume);

  return (
    <InsightCard title="Asset breakdown" subtitle="Volume by asset customers paid with" className="lg:col-span-2">
      {rows.length === 0 || total === 0 ? (
        <InsightEmpty />
      ) : (
        <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-[220px_1fr]">
          <div className="relative mx-auto h-[220px] w-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={rows} dataKey="volume" nameKey="asset" innerRadius={62} outerRadius={100} paddingAngle={2} stroke="none">
                  {rows.map((row, index) => (
                    <Cell key={row.asset} fill={INSIGHT_COLORS[index % INSIGHT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number, name: string) => [usd.format(value), name]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[11px] text-zinc-500">Total</span>
              <span className="text-lg font-semibold text-zinc-900">{usd.format(total)}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[360px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th scope="col" className="py-2 pr-3 font-medium">Asset</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">Volume</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">% of total</th>
                  <th scope="col" className="py-2 text-right font-medium">Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row, index) => (
                  <tr key={row.asset}>
                    <td className="py-2 pr-3">
                      <span className="inline-flex items-center gap-2 font-medium text-zinc-900">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: INSIGHT_COLORS[index % INSIGHT_COLORS.length] }} />
                        {row.asset}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-right text-zinc-700">{usd.format(row.volume)}</td>
                    <td className="py-2 pr-3 text-right text-zinc-700">{percent(row.volume / total)}</td>
                    <td className="py-2 text-right text-zinc-700">{row.txCount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </InsightCard>
  );
}
