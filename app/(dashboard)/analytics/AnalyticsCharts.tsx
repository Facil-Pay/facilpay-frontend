'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFormat } from '@/lib/i18n/use-format';

const palette = {
  primary: '#20a7ee',
  secondary: '#7c9cff',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#ef4444',
  muted: '#94a3b8',
  purple: '#8b5cf6',
};

export type ChartPoint = {
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

export type VisibleSeries = {
  revenue: boolean;
  compareRevenue: boolean;
  txCount: boolean;
  successful: boolean;
  failed: boolean;
  refundVolume: boolean;
  aov: boolean;
  compareAov: boolean;
};

interface Props {
  data: ChartPoint[];
  compareMode: boolean;
  visibleSeries: VisibleSeries;
  toggleSeries: (key: string) => void;
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

function LegendToggle({
  label,
  active,
  onToggle,
  color,
  dashed = false,
}: {
  label: string;
  active: boolean;
  onToggle: () => void;
  color: string;
  dashed?: boolean;
}) {
  return (
    <button className={active ? 'legend-item active' : 'legend-item'} onClick={onToggle}>
      <span className={dashed ? 'legend-swatch dashed' : 'legend-swatch'} style={{ background: color }} />
      {label}
    </button>
  );
}

export default function AnalyticsCharts({ data, compareMode, visibleSeries, toggleSeries }: Props) {
  const f = useFormat();
  const formatMoney = (value: number) => f.fiat(value, 'USD', { maximumFractionDigits: 0 });

  return (
    <div className="chart-grid">
      <ChartCard title="Revenue over time" subtitle="Daily sales revenue">
        <div className="legend-row">
          <LegendToggle label="Revenue" active={visibleSeries.revenue} onToggle={() => toggleSeries('revenue')} color={palette.primary} />
          {compareMode && (
            <LegendToggle label="Previous period" active={visibleSeries.compareRevenue} onToggle={() => toggleSeries('compareRevenue')} color={palette.muted} dashed />
          )}
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
            <YAxis tickFormatter={(value: number) => f.fiat(value, 'USD', { compact: true })} tickLine={false} axisLine={false} stroke="var(--muted)" />
            <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 12 }} />
            {visibleSeries.revenue && <Area type="monotone" dataKey="revenue" stroke={palette.primary} fill="url(#revenueFill)" strokeWidth={3} />}
            {compareMode && visibleSeries.compareRevenue && (
              <Line type="monotone" dataKey="compareRevenue" stroke={palette.muted} strokeDasharray="5 5" strokeWidth={2} dot={false} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Transaction count" subtitle="Orders processed">
        <div className="legend-row">
          <LegendToggle label="Transactions" active={visibleSeries.txCount} onToggle={() => toggleSeries('txCount')} color={palette.secondary} />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" />
            <YAxis tickLine={false} axisLine={false} stroke="var(--muted)" />
            <Tooltip formatter={(value: number) => [f.number(value), 'Transactions']} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 12 }} />
            {visibleSeries.txCount && <Bar dataKey="txCount" radius={[8, 8, 0, 0]} fill={palette.secondary} />}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Successful vs failed payments" subtitle="Settlement outcomes">
        <div className="legend-row">
          <LegendToggle label="Successful" active={visibleSeries.successful} onToggle={() => toggleSeries('successful')} color={palette.success} />
          <LegendToggle label="Failed" active={visibleSeries.failed} onToggle={() => toggleSeries('failed')} color={palette.danger} />
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" />
            <YAxis tickLine={false} axisLine={false} stroke="var(--muted)" />
            <Tooltip contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 12 }} />
            {visibleSeries.successful && <Bar dataKey="successful" stackId="payments" fill={palette.success} radius={[6, 6, 0, 0]} />}
            {visibleSeries.failed && <Bar dataKey="failed" stackId="payments" fill={palette.danger} radius={[6, 6, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Refund volume" subtitle="Chargebacks and refunds">
        <div className="legend-row">
          <LegendToggle label="Refunds" active={visibleSeries.refundVolume} onToggle={() => toggleSeries('refundVolume')} color={palette.warning} />
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
            <Tooltip formatter={(value: number) => formatMoney(value)} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 12 }} />
            {visibleSeries.refundVolume && <Area type="monotone" dataKey="refundVolume" stroke={palette.warning} fill="url(#refundFill)" strokeWidth={3} />}
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Average order value" subtitle="Mean basket size">
        <div className="legend-row">
          <LegendToggle label="AOV" active={visibleSeries.aov} onToggle={() => toggleSeries('aov')} color={palette.purple} />
          {compareMode && (
            <LegendToggle label="Previous AOV" active={visibleSeries.compareAov} onToggle={() => toggleSeries('compareAov')} color={palette.muted} dashed />
          )}
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--muted)" />
            <YAxis tickFormatter={(value: number) => formatMoney(value)} tickLine={false} axisLine={false} stroke="var(--muted)" />
            <Tooltip formatter={(value: number) => [f.fiat(value, 'USD'), 'AOV']} contentStyle={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', borderRadius: 12 }} />
            {visibleSeries.aov && <Line type="monotone" dataKey="aov" stroke={palette.purple} strokeWidth={3} dot={{ r: 4 }} />}
            {compareMode && visibleSeries.compareAov && (
              <Line type="monotone" dataKey="compareAov" stroke={palette.muted} strokeDasharray="5 5" strokeWidth={2} dot={false} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
