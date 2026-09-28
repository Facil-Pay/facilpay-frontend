"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AnalyticsInsights } from "@/components/analytics/AnalyticsInsights";

const palette = {
  primary: "#20a7ee",
  secondary: "#7c9cff",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
  muted: "#94a3b8",
  purple: "#8b5cf6",
};

type Granularity = "day" | "week" | "month";
type Asset = "All" | "USDC" | "XLM" | "EURC";
type RangePreset = "7d" | "30d" | "90d" | "1y";

type ChartPoint = {
  label: string;
  revenue: number;
  compareRevenue: number;
  txCount: number;
  successful: number;
  failed: number;
  refundVolume: number;
  aov: number;
  compareAov: number;
};

const baseSeries: ChartPoint[] = [
  { label: "Jan", revenue: 8200, compareRevenue: 7600, txCount: 210, successful: 180, failed: 30, refundVolume: 340, aov: 38.5, compareAov: 35.2 },
  { label: "Feb", revenue: 9800, compareRevenue: 8600, txCount: 251, successful: 223, failed: 28, refundVolume: 420, aov: 39.1, compareAov: 36.5 },
  { label: "Mar", revenue: 10450, compareRevenue: 9100, txCount: 287, successful: 250, failed: 37, refundVolume: 470, aov: 41.8, compareAov: 37.2 },
  { label: "Apr", revenue: 11800, compareRevenue: 10300, txCount: 310, successful: 280, failed: 30, refundVolume: 520, aov: 43.3, compareAov: 39.4 },
  { label: "May", revenue: 13500, compareRevenue: 12100, txCount: 346, successful: 318, failed: 28, refundVolume: 610, aov: 46.1, compareAov: 42.9 },
  { label: "Jun", revenue: 14900, compareRevenue: 13200, txCount: 375, successful: 345, failed: 30, refundVolume: 700, aov: 48.4, compareAov: 44.1 },
  { label: "Jul", revenue: 16200, compareRevenue: 14600, txCount: 402, successful: 371, failed: 31, refundVolume: 760, aov: 50.2, compareAov: 46.0 },
];

const seriesByGranularity: Record<Granularity, ChartPoint[]> = {
  day: [
    { label: "Mon", revenue: 3400, compareRevenue: 3000, txCount: 84, successful: 73, failed: 11, refundVolume: 140, aov: 35.6, compareAov: 33.1 },
    { label: "Tue", revenue: 3900, compareRevenue: 3350, txCount: 92, successful: 80, failed: 12, refundVolume: 180, aov: 37.5, compareAov: 34.9 },
    { label: "Wed", revenue: 4250, compareRevenue: 3700, txCount: 98, successful: 88, failed: 10, refundVolume: 190, aov: 39.2, compareAov: 35.6 },
    { label: "Thu", revenue: 4700, compareRevenue: 4100, txCount: 105, successful: 94, failed: 11, refundVolume: 210, aov: 41.8, compareAov: 37.2 },
    { label: "Fri", revenue: 5200, compareRevenue: 4500, txCount: 117, successful: 104, failed: 13, refundVolume: 240, aov: 43.1, compareAov: 38.0 },
    { label: "Sat", revenue: 4980, compareRevenue: 4400, txCount: 98, successful: 90, failed: 8, refundVolume: 210, aov: 42.3, compareAov: 37.4 },
    { label: "Sun", revenue: 4350, compareRevenue: 3900, txCount: 86, successful: 79, failed: 7, refundVolume: 170, aov: 39.8, compareAov: 36.2 },
  ],
  week: [
    { label: "W1", revenue: 17800, compareRevenue: 16200, txCount: 440, successful: 398, failed: 42, refundVolume: 760, aov: 40.5, compareAov: 37.4 },
    { label: "W2", revenue: 19400, compareRevenue: 17600, txCount: 476, successful: 430, failed: 46, refundVolume: 820, aov: 41.9, compareAov: 38.3 },
    { label: "W3", revenue: 20750, compareRevenue: 18800, txCount: 514, successful: 468, failed: 46, refundVolume: 900, aov: 43.7, compareAov: 39.0 },
    { label: "W4", revenue: 22100, compareRevenue: 20120, txCount: 548, successful: 500, failed: 48, refundVolume: 970, aov: 45.2, compareAov: 40.7 },
    { label: "W5", revenue: 23850, compareRevenue: 21600, txCount: 588, successful: 540, failed: 48, refundVolume: 1030, aov: 46.9, compareAov: 42.1 },
    { label: "W6", revenue: 24900, compareRevenue: 22500, txCount: 612, successful: 560, failed: 52, refundVolume: 1110, aov: 48.4, compareAov: 44.2 },
    { label: "W7", revenue: 26150, compareRevenue: 23800, txCount: 648, successful: 590, failed: 58, refundVolume: 1200, aov: 49.7, compareAov: 46.1 },
  ],
  month: baseSeries,
};

const formatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

function formatMoney(value: number) {
  return formatter.format(value);
}

function formatCompactMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(value);
}

export default function AnalyticsPage() {
  const [granularity, setGranularity] = useState<Granularity>("month");
  const [dateRange, setDateRange] = useState<RangePreset>("90d");
  const [asset, setAsset] = useState<Asset>("All");
  const [compareMode, setCompareMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hiddenSeries, setHiddenSeries] = useState<Record<string, boolean>>({});

  const data = useMemo(() => {
    if (granularity === "month") return baseSeries;
    return seriesByGranularity[granularity];
  }, [granularity]);

  const visibleSeries = {
    revenue: !hiddenSeries.revenue,
    compareRevenue: !hiddenSeries.compareRevenue,
    txCount: !hiddenSeries.txCount,
    successful: !hiddenSeries.successful,
    failed: !hiddenSeries.failed,
    refundVolume: !hiddenSeries.refundVolume,
    aov: !hiddenSeries.aov,
    compareAov: !hiddenSeries.compareAov,
  };

  const toggleSeries = (key: string) => {
    setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const stats = useMemo(() => {
    const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
    const totalTx = data.reduce((sum, item) => sum + item.txCount, 0);
    const totalRefunds = data.reduce((sum, item) => sum + item.refundVolume, 0);
    const avgAov = data.reduce((sum, item) => sum + item.aov, 0) / data.length;
    return {
      totalRevenue,
      totalTx,
      totalRefunds,
      avgAov,
    };
  }, [data]);

  return (
    <div className="analytics-shell">
      <div className="analytics-page">
        <header className="analytics-header">
          <div>
            <p className="eyebrow">Insights</p>
            <h1>Analytics</h1>
          </div>
          <div className="analytics-actions">
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value as RangePreset)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            <select value={asset} onChange={(e) => setAsset(e.target.value as Asset)}>
              <option>All</option>
              <option>USDC</option>
              <option>XLM</option>
              <option>EURC</option>
            </select>
            <button className="toggle-btn" onClick={() => setCompareMode((v) => !v)}>
              {compareMode ? "Hide previous" : "Compare previous"}
            </button>
          </div>
        </header>

        <div className="analytics-controls">
          <div className="segmented">
            {(["day", "week", "month"] as Granularity[]).map((option) => (
              <button
                key={option}
                className={granularity === option ? "active" : ""}
                onClick={() => setGranularity(option)}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <div className="preset-row">
            {(["7d", "30d", "90d", "1y"] as RangePreset[]).map((preset) => (
              <button
                key={preset}
                className={dateRange === preset ? "preset active" : "preset"}
                onClick={() => setDateRange(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-grid">
            <div className="skeleton large" />
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton wide" />
            <div className="skeleton wide" />
          </div>
        ) : (
          <>
            <section className="stats-grid">
              <StatCard label="Revenue" value={formatCompactMoney(stats.totalRevenue)} delta="+18.2%" tone="primary" />
              <StatCard label="Transactions" value={String(stats.totalTx)} delta="+12.4%" tone="secondary" />
              <StatCard label="Refund volume" value={formatCompactMoney(stats.totalRefunds)} delta="-4.1%" tone="warning" />
              <StatCard label="Avg. order value" value={`$${stats.avgAov.toFixed(2)}`} delta="+9.7%" tone="success" />
            </section>

            <div className="chart-grid">
              <ChartCard title="Revenue over time" subtitle="Daily sales revenue">
                <div className="legend-row">
                  <LegendToggle label="Revenue" active={visibleSeries.revenue} onToggle={() => toggleSeries("revenue")} color={palette.primary} />
                  {compareMode && <LegendToggle label="Previous period" active={visibleSeries.compareRevenue} onToggle={() => toggleSeries("compareRevenue")} color={palette.muted} dashed />}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor={palette.primary} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={palette.primary} stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <YAxis tickFormatter={(value) => `$${Math.round(value / 1000)}k`} tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: 12 }} />
                    {visibleSeries.revenue && <Area type="monotone" dataKey="revenue" stroke={palette.primary} fill="url(#revenueFill)" strokeWidth={3} />}
                    {compareMode && visibleSeries.compareRevenue && <Line type="monotone" dataKey="compareRevenue" stroke={palette.muted} strokeDasharray="5 5" strokeWidth={2} dot={false} />}
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Transaction count" subtitle="Orders processed">
                <div className="legend-row">
                  <LegendToggle label="Transactions" active={visibleSeries.txCount} onToggle={() => toggleSeries("txCount")} color={palette.secondary} />
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <YAxis tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <Tooltip formatter={(value: number) => [`${value}`, "Transactions"]} contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: 12 }} />
                    {visibleSeries.txCount && <Bar dataKey="txCount" radius={[8, 8, 0, 0]} fill={palette.secondary} />}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Successful vs failed payments" subtitle="Settlement outcomes">
                <div className="legend-row">
                  <LegendToggle label="Successful" active={visibleSeries.successful} onToggle={() => toggleSeries("successful")} color={palette.success} />
                  <LegendToggle label="Failed" active={visibleSeries.failed} onToggle={() => toggleSeries("failed")} color={palette.danger} />
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <YAxis tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <Tooltip contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: 12 }} />
                    {visibleSeries.successful && <Bar dataKey="successful" stackId="payments" fill={palette.success} radius={[6, 6, 0, 0]} />}
                    {visibleSeries.failed && <Bar dataKey="failed" stackId="payments" fill={palette.danger} radius={[6, 6, 0, 0]} />}
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Refund volume" subtitle="Chargebacks and refunds">
                <div className="legend-row">
                  <LegendToggle label="Refunds" active={visibleSeries.refundVolume} onToggle={() => toggleSeries("refundVolume")} color={palette.warning} />
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="refundFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor={palette.warning} stopOpacity={0.35} />
                        <stop offset="95%" stopColor={palette.warning} stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <YAxis tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: 12 }} />
                    {visibleSeries.refundVolume && <Area type="monotone" dataKey="refundVolume" stroke={palette.warning} fill="url(#refundFill)" strokeWidth={3} />}
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Average order value" subtitle="Mean basket size">
                <div className="legend-row">
                  <LegendToggle label="AOV" active={visibleSeries.aov} onToggle={() => toggleSeries("aov")} color={palette.purple} />
                  {compareMode && <LegendToggle label="Previous AOV" active={visibleSeries.compareAov} onToggle={() => toggleSeries("compareAov")} color={palette.muted} dashed />}
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} axisLine={false} stroke="var(--muted)" />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, "AOV"]} contentStyle={{ backgroundColor: "var(--surface)", borderColor: "var(--border)", borderRadius: 12 }} />
                    {visibleSeries.aov && <Line type="monotone" dataKey="aov" stroke={palette.purple} strokeWidth={3} dot={{ r: 4 }} />}
                    {compareMode && visibleSeries.compareAov && <Line type="monotone" dataKey="compareAov" stroke={palette.muted} strokeDasharray="5 5" strokeWidth={2} dot={false} />}
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>

            <AnalyticsInsights range={dateRange} asset={asset === "All" ? undefined : asset} />
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, delta, tone }: { label: string; value: string; delta: string; tone: "primary" | "secondary" | "warning" | "success" }) {
  return (
    <div className="stat-card">
      <div className={`stat-accent ${tone}`} />
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{delta}</small>
      </div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="chart-card">
      <div className="chart-header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function LegendToggle({ label, active, onToggle, color, dashed = false }: { label: string; active: boolean; onToggle: () => void; color: string; dashed?: boolean }) {
  return (
    <button className={active ? "legend-item active" : "legend-item"} onClick={onToggle}>
      <span className={dashed ? "legend-swatch dashed" : "legend-swatch"} style={{ background: color }} />
      {label}
    </button>
  );
}
