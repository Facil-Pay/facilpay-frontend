// Pure-SVG sparkline — no external dependencies, safe for server render.
// Pass `points` as an array of numbers (e.g. monthly volumes).

interface SparklineProps {
  points: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  className?: string;
}

export function Sparkline({
  points,
  width = 80,
  height = 32,
  color = "#55C2FF",
  fill = true,
  className = "",
}: SparklineProps) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const pad = 2;
  const w = width - pad * 2;
  const h = height - pad * 2;

  // Map to SVG coords (y-axis flipped)
  const coords = points.map((v, i) => {
    const x = pad + (i / (points.length - 1)) * w;
    const y = pad + h - ((v - min) / range) * h;
    return `${x},${y}`;
  });

  const polyline = coords.join(" ");

  // Closed area path for fill
  const first = coords[0];
  const last  = coords[coords.length - 1];
  const lastX = parseFloat(last.split(",")[0]);
  const firstX = parseFloat(first.split(",")[0]);
  const baseY = pad + h;
  const areaPath = `M ${firstX},${baseY} L ${coords.join(" L ")} L ${lastX},${baseY} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
      className={className}
    >
      {fill && (
        <path
          d={areaPath}
          fill={color}
          fillOpacity={0.12}
        />
      )}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End-point dot */}
      {(() => {
        const [ex, ey] = coords[coords.length - 1].split(",").map(Number);
        return (
          <circle cx={ex} cy={ey} r={2.5} fill={color} />
        );
      })()}
    </svg>
  );
}
