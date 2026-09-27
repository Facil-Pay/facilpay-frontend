// Pure-SVG donut chart + legend for payment status distribution.

import { Card, CardHeader, CardDivider } from "@/app/components/ui/Card";
import type { StatusBreakdown } from "@/app/lib/api/dashboard";
import type { PaymentStatus } from "@/app/lib/types/payment";

function PieChartIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path d="M12 2C9.243 2 6.82 3.371 5.372 5.5H12a.5.5 0 01.5.5v6.628A8.001 8.001 0 0012 2z" />
      <path d="M11.5 7H5.5a.5.5 0 00-.5.5v6a.5.5 0 00.5.5H12v-6.5a.5.5 0 00-.5-.5z" />
    </svg>
  );
}

// Status colour map (matches CSS variables + Badge variants)
const STATUS_COLORS: Record<PaymentStatus, string> = {
  completed:  "#10b981",
  pending:    "#f59e0b",
  processing: "#0ea5e9",
  failed:     "#ef4444",
  refunded:   "#8b5cf6",
  cancelled:  "#71717a",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  completed:  "Completed",
  pending:    "Pending",
  processing: "Processing",
  failed:     "Failed",
  refunded:   "Refunded",
  cancelled:  "Cancelled",
};

// Convert a list of status segments to SVG donut arc paths
function buildDonutPaths(
  segments: { pct: number; color: string }[],
  cx: number,
  cy: number,
  r: number,
  thickness: number
): { d: string; color: string }[] {
  const innerR = r - thickness;
  const paths: { d: string; color: string }[] = [];
  let startAngle = -90; // start at 12 o'clock

  for (const seg of segments) {
    if (seg.pct === 0) continue;
    const sweep = (seg.pct / 100) * 360;
    const endAngle = startAngle + sweep;

    // Avoid full-circle edge case
    const largeArc = sweep > 180 ? 1 : 0;
    const rad = (a: number) => (a * Math.PI) / 180;

    const x1 = cx + r * Math.cos(rad(startAngle));
    const y1 = cy + r * Math.sin(rad(startAngle));
    const x2 = cx + r * Math.cos(rad(endAngle));
    const y2 = cy + r * Math.sin(rad(endAngle));
    const x3 = cx + innerR * Math.cos(rad(endAngle));
    const y3 = cy + innerR * Math.sin(rad(endAngle));
    const x4 = cx + innerR * Math.cos(rad(startAngle));
    const y4 = cy + innerR * Math.sin(rad(startAngle));

    paths.push({
      color: seg.color,
      d: [
        `M ${x1} ${y1}`,
        `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
        `L ${x3} ${y3}`,
        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}`,
        "Z",
      ].join(" "),
    });

    startAngle = endAngle;
  }

  return paths;
}

interface StatusBreakdownChartProps {
  data: StatusBreakdown[];
}

export function StatusBreakdownChart({ data }: StatusBreakdownChartProps) {
  const total = data.reduce((s, d) => s + d.count, 0);

  const segments = data.map((d) => ({
    pct: d.pct,
    color: STATUS_COLORS[d.status] ?? "#71717a",
  }));

  const cx = 70;
  const cy = 70;
  const r  = 55;
  const thickness = 20;

  const paths = buildDonutPaths(segments, cx, cy, r, thickness);

  return (
    <Card className="flex flex-col">
      <CardHeader
        icon={<PieChartIcon />}
        title="Status Breakdown"
        subtitle={`${total} payment${total !== 1 ? "s" : ""} total`}
      />
      <CardDivider className="mt-4 mb-5" />

      <div className="flex flex-col sm:flex-row items-center gap-5">
        {/* Donut */}
        <div className="shrink-0">
          <svg
            width={140}
            height={140}
            viewBox="0 0 140 140"
            aria-label="Payment status donut chart"
            role="img"
          >
            {paths.map((p, i) => (
              <path key={i} d={p.d} fill={p.color} stroke="white" strokeWidth={1.5} />
            ))}
            {/* Centre label */}
            <text x={cx} y={cy - 6} textAnchor="middle" fontSize={22} fontWeight="700" fill="#18181b">
              {total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fontSize={10} fill="#71717a">
              total
            </text>
          </svg>
        </div>

        {/* Legend */}
        <ul className="flex-1 w-full space-y-2.5">
          {data.map((d) => (
            <li key={d.status} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[d.status] ?? "#71717a" }}
                />
                <span className="text-sm text-zinc-700 truncate">
                  {STATUS_LABELS[d.status]}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-semibold text-zinc-900 tabular-nums w-5 text-right">
                  {d.count}
                </span>
                <span className="text-xs text-zinc-400 tabular-nums w-10 text-right">
                  {d.pct.toFixed(0)}%
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
