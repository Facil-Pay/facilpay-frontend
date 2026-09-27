// Pure-SVG bar chart for monthly revenue trend.
// Server-renderable — no client hooks required.

import { Card, CardHeader, CardDivider } from "@/app/components/ui/Card";
import type { MonthlyRevenue } from "@/app/lib/api/dashboard";

function ChartBarIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M12 9a1 1 0 01-1-1V3c0-.552.45-1 1-1 .553 0 1 .448 1 1v5a1 1 0 01-1 1zM6 13a1 1 0 01-1-1V3a1 1 0 012 0v9a1 1 0 01-1 1zM17 15a1 1 0 01-1-1V7a1 1 0 012 0v7a1 1 0 01-1 1zM1 17a1 1 0 01-1-1v-2a1 1 0 012 0v2a1 1 0 01-1 1zM6 17a1 1 0 01-1-1v-1a1 1 0 012 0v1a1 1 0 01-1 1zM12 17a1 1 0 01-1-1v-4a1 1 0 012 0v4a1 1 0 01-1 1zM17 17a1 1 0 01-1-1v-1a1 1 0 012 0v1a1 1 0 01-1 1z" />
    </svg>
  );
}

interface RevenueTrendChartProps {
  data: MonthlyRevenue[];
}

export function RevenueTrendChart({ data }: RevenueTrendChartProps) {
  if (data.length === 0) return null;

  // Chart dimensions
  const W = 540;
  const H = 180;
  const PAD = { top: 16, right: 8, bottom: 36, left: 52 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVol = Math.max(...data.map((d) => d.volumeUsd));
  const yMax   = Math.ceil(maxVol / 1000) * 1000 || 1000;

  const barWidth  = (chartW / data.length) * 0.55;
  const barGap    = chartW / data.length;

  // Y grid lines & labels
  const yTicks = 4;
  const yLines = Array.from({ length: yTicks + 1 }, (_, i) => {
    const val = (yMax / yTicks) * i;
    const y   = PAD.top + chartH - (val / yMax) * chartH;
    const label = val >= 1000 ? `$${(val / 1000).toFixed(0)}K` : `$${val}`;
    return { val, y, label };
  });

  // Format tooltip-style value on hover (SVG title)
  function fmtVol(v: number) {
    return v >= 1000 ? `$${(v / 1000).toFixed(1)}K` : `$${v.toFixed(0)}`;
  }

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={<ChartBarIcon />}
        title="Revenue Trend"
        subtitle="Monthly payment volume (USD)"
      />
      <CardDivider className="mt-4 mb-5" />

      {/* SVG chart — responsive via viewBox */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          aria-label="Monthly revenue bar chart"
          role="img"
          className="w-full"
          style={{ minWidth: 260 }}
        >
          {/* Y-axis gridlines & labels */}
          {yLines.map(({ y, label }) => (
            <g key={label}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + chartW}
                y2={y}
                stroke="#f4f4f5"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#a1a1aa"
              >
                {label}
              </text>
            </g>
          ))}

          {/* X-axis baseline */}
          <line
            x1={PAD.left}
            y1={PAD.top + chartH}
            x2={PAD.left + chartW}
            y2={PAD.top + chartH}
            stroke="#e4e4e7"
            strokeWidth={1}
          />

          {/* Bars */}
          {data.map((d, i) => {
            const barH  = Math.max(2, (d.volumeUsd / yMax) * chartH);
            const x     = PAD.left + i * barGap + (barGap - barWidth) / 2;
            const y     = PAD.top + chartH - barH;
            const isLast = i === data.length - 1;

            return (
              <g key={`${d.month}-${d.year}`}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  ry={4}
                  fill={isLast ? "#55C2FF" : "#A5D4FF"}
                  opacity={isLast ? 1 : 0.75}
                >
                  <title>{d.month}: {fmtVol(d.volumeUsd)} ({d.count} payment{d.count !== 1 ? "s" : ""})</title>
                </rect>

                {/* Volume label above bar */}
                {barH > 18 && (
                  <text
                    x={x + barWidth / 2}
                    y={y - 5}
                    textAnchor="middle"
                    fontSize={9}
                    fill={isLast ? "#0077B6" : "#71717a"}
                    fontWeight={isLast ? "600" : "400"}
                  >
                    {fmtVol(d.volumeUsd)}
                  </text>
                )}

                {/* X-axis month label */}
                <text
                  x={x + barWidth / 2}
                  y={PAD.top + chartH + 16}
                  textAnchor="middle"
                  fontSize={11}
                  fill={isLast ? "#000F24" : "#71717a"}
                  fontWeight={isLast ? "600" : "400"}
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend row */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-50">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#55C2FF] shrink-0" />
          <span className="text-xs text-zinc-500">Current month</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#A5D4FF]/75 shrink-0" />
          <span className="text-xs text-zinc-500">Previous months</span>
        </div>
        <div className="ml-auto text-xs text-zinc-400 tabular-nums">
          Total: ${data.reduce((s, d) => s + d.volumeUsd, 0).toLocaleString("en-US", { maximumFractionDigits: 0 })}
        </div>
      </div>
    </Card>
  );
}
