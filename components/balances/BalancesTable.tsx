'use client';

import React, { useState } from 'react';
import { FormattedBalance } from '@/lib/stellar/horizon';
import { getFiatEstimate } from '@/lib/stellar/prices';
import { StrKey } from '@/lib/stellar/strkey';
import { useFormat } from '@/lib/i18n/use-format';

interface BalancesTableProps {
  balances: FormattedBalance[];
}

export default function BalancesTable({ balances }: BalancesTableProps) {
  const f = useFormat();
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="border-b border-zinc-200 px-6 py-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Asset Holdings & Available Balances
          </h2>
          <p className="text-xs text-zinc-500">
            Live Stellar balances read directly from Horizon ledger with base reserve accounting
          </p>
        </div>
        <span className="text-xs font-semibold text-zinc-500">
          {balances.length} Asset{balances.length !== 1 ? 's' : ''} Held
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50/80 uppercase tracking-wider text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-6 py-3.5">Asset Code</th>
              <th className="px-6 py-3.5">Issuer / Contract</th>
              <th className="px-6 py-3.5">Total Balance</th>
              <th className="px-6 py-3.5">Spendable (Available)</th>
              <th className="px-6 py-3.5 text-right">Fiat Estimate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {balances.map((b) => {
              const fiat = getFiatEstimate(b.assetCode, b.totalBalance);

              return (
                <tr
                  key={b.assetCode + (b.assetIssuer || '')}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  {/* Asset Code */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 font-bold text-zinc-800 text-xs dark:bg-zinc-800 dark:text-white">
                        {b.assetCode.slice(0, 3)}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-zinc-900 dark:text-white">
                          {b.assetCode}
                        </span>
                        {b.isNative && (
                          <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            Native
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Issuer (truncated, with Stellar Expert link) */}
                  <td className="px-6 py-4">
                    {b.isNative ? (
                      <span className="text-zinc-400 font-medium">Native Stellar Protocol</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-zinc-600 dark:text-zinc-400">
                          {StrKey.truncateAddress(b.assetIssuer || '', 6, 6)}
                        </span>
                        <a
                          href={b.stellarExpertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-600 hover:text-sky-700 dark:text-sky-400 p-0.5 rounded hover:bg-sky-50 dark:hover:bg-zinc-800"
                          title="Verify Asset Issuer on Stellar Expert"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </td>

                  {/* Total Balance */}
                  <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                    {f.amount(b.totalBalance, b.assetCode, { withCode: false })}{' '}
                    <span className="font-normal text-zinc-500">{b.assetCode}</span>
                  </td>

                  {/* Spendable / Available (Special accounting for XLM Minimum Reserve) */}
                  <td className="px-6 py-4">
                    {b.isNative && b.reserveDetails ? (
                      <div className="relative inline-block">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {f.amount(b.availableBalance, b.assetCode, { withCode: false })}{' '}
                            XLM
                          </span>

                          {/* Reserve Tooltip Trigger */}
                          <div
                            className="relative flex items-center"
                            onMouseEnter={() => setActiveTooltip('xlm-reserve')}
                            onMouseLeave={() => setActiveTooltip(null)}
                          >
                            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-200 text-[10px] font-bold text-zinc-700 cursor-help dark:bg-zinc-700 dark:text-zinc-200">
                              ?
                            </span>

                            {/* Interactive Tooltip Popover */}
                            {activeTooltip === 'xlm-reserve' && (
                              <div className="absolute left-1/2 -top-2 -translate-x-1/2 -translate-y-full z-50 w-72 rounded-xl bg-zinc-900 p-3.5 text-[11px] text-white shadow-xl dark:bg-zinc-800 border border-zinc-700">
                                <div className="font-bold text-xs text-sky-400 mb-1">
                                  Stellar Minimum Base Reserve
                                </div>
                                <p className="text-zinc-300 mb-2">
                                  Stellar protocol locks a small minimum balance of native XLM to prevent ledger spam and fund account entries.
                                </p>
                                <div className="space-y-1 rounded-lg bg-black/40 p-2 font-mono text-[10px] text-zinc-200">
                                  <div className="flex justify-between">
                                    <span>Total Balance:</span>
                                    <span>{f.amount(b.totalBalance, 'XLM')}</span>
                                  </div>
                                  <div className="flex justify-between text-amber-300">
                                    <span>Locked Reserve:</span>
                                    <span>{f.amount(-b.reserveDetails.minReserve, 'XLM')}</span>
                                  </div>
                                  <div className="flex justify-between font-bold text-emerald-400 border-t border-zinc-700 pt-1">
                                    <span>Available to Spend:</span>
                                    <span>{f.amount(b.availableBalance, 'XLM')}</span>
                                  </div>
                                </div>
                                <div className="mt-2 text-[10px] text-zinc-400">
                                  {b.reserveDetails.formulaExplanation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-400 block mt-0.5">
                          Reserve: {b.reserveDetails.minReserve} XLM locked
                        </span>
                      </div>
                    ) : (
                      <span className="font-medium text-zinc-800 dark:text-zinc-200">
                        {f.amount(b.totalBalance, b.assetCode, { withCode: false })}{' '}
                        {b.assetCode}
                      </span>
                    )}
                  </td>

                  {/* Fiat Estimate with Graceful Fallback */}
                  <td className="px-6 py-4 text-right">
                    {fiat.isUnavailable ? (
                      <span className="inline-flex items-center rounded-md bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        Price unavailable
                      </span>
                    ) : (
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {f.fiat(fiat.totalFiat ?? 0, fiat.currency)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
