'use client';

import React from 'react';
import { EndpointHealthSummary } from '@/lib/webhook-data';
import { ChartDataTable } from '@/components/ui/chart-data-table';

interface EndpointHealthChartProps {
  health: EndpointHealthSummary;
  endpointUrl: string;
}

export default function EndpointHealthChart({
  health,
  endpointUrl,
}: EndpointHealthChartProps) {
  const { sevenDayStats, successRate, failureRate, totalDeliveries, avgLatencyMs } = health;

  // Find max count for scaling bars
  const maxVolume = Math.max(
    ...sevenDayStats.map((d) => d.succeeded + d.failed),
    10
  );

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-5 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Endpoint Health & Delivery Volume (Last 7 Days)
            </h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border ${
                failureRate <= 20
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
              }`}
            >
              {failureRate <= 20 ? '● Healthy' : '● Degraded'}
            </span>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-0.5 truncate max-w-xl">
            {endpointUrl}
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" aria-hidden="true" />
            <span>Succeeded</span>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" aria-hidden="true" />
            <span>Failed</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
          <span className="text-[11px] text-zinc-500">7-Day Success Rate</span>
          <div className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
            {successRate}%
          </div>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
          <span className="text-[11px] text-zinc-500">7-Day Failure Rate</span>
          <div
            className={`text-xl font-extrabold font-mono mt-0.5 ${
              failureRate > 20
                ? 'text-rose-600 dark:text-rose-400'
                : 'text-zinc-700 dark:text-zinc-300'
            }`}
          >
            {failureRate}%
          </div>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
          <span className="text-[11px] text-zinc-500">Total Deliveries</span>
          <div className="text-xl font-extrabold font-mono text-zinc-900 dark:text-white mt-0.5">
            {totalDeliveries}
          </div>
        </div>

        <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/40">
          <span className="text-[11px] text-zinc-500">Average Latency</span>
          <div className="text-xl font-extrabold font-mono text-zinc-900 dark:text-white mt-0.5">
            {avgLatencyMs} ms
          </div>
        </div>
      </div>

      {/* 7-Day Bar Chart */}
      <div className="pt-2">
        <div
          role="img"
          aria-label={`Deliveries over the last 7 days: ${sevenDayStats
            .map((d) => `${d.dayLabel} ${d.succeeded} succeeded, ${d.failed} failed`)
            .join('; ')}`}
          className="h-44 w-full flex items-end justify-between gap-2 sm:gap-6 px-2"
        >
          {sevenDayStats.map((stat, idx) => {
            const successHeightPercent = Math.round((stat.succeeded / maxVolume) * 100);
            const failHeightPercent = Math.round((stat.failed / maxVolume) * 100);

            return (
              <div
                key={stat.date || idx}
                className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
              >
                {/* Tooltip on hover */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 text-white text-[10px] rounded px-2 py-1 pointer-events-none mb-1 shadow-md font-mono whitespace-nowrap z-10">
                  {stat.dayLabel}: {stat.succeeded} ok, {stat.failed} fail
                </div>

                {/* Stacked or side-by-side bars */}
                <div className="w-full max-w-[40px] flex items-end justify-center gap-1 h-32 bg-zinc-100 dark:bg-zinc-800/40 rounded-lg p-1">
                  {/* Succeeded Bar */}
                  <div
                    className="w-1/2 bg-emerald-500 rounded-t-sm transition-all duration-500 group-hover:bg-emerald-400"
                    style={{ height: `${Math.max(successHeightPercent, 8)}%` }}
                    title={`${stat.succeeded} succeeded`}
                  />
                  {/* Failed Bar */}
                  <div
                    className={`w-1/2 rounded-t-sm transition-all duration-500 ${
                      stat.failed > 0
                        ? 'bg-rose-500 group-hover:bg-rose-400'
                        : 'bg-transparent'
                    }`}
                    style={{ height: `${Math.max(failHeightPercent, stat.failed > 0 ? 8 : 0)}%` }}
                    title={`${stat.failed} failed`}
                  />
                </div>

                {/* Day Label */}
                <span className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                  {stat.dayLabel}
                </span>
              </div>
            );
          })}
        </div>
        <ChartDataTable
          caption="Webhook deliveries per day"
          rows={sevenDayStats}
          rowKey={(d) => d.date}
          columns={[
            { key: 'date', header: 'Day', cell: (d) => `${d.dayLabel} ${d.date}` },
            { key: 'succeeded', header: 'Succeeded', align: 'right' },
            { key: 'failed', header: 'Failed', align: 'right' },
          ]}
        />
      </div>
    </div>
  );
}
