'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePaymentStream } from '@/lib/payment-stream-context';
import { truncateAddress } from '@/lib/stellar';
import { useFormat } from '@/lib/i18n/use-format';
import { toDecimalString } from '@/lib/i18n/format';

interface RecentPaymentsTableProps {
  maxRows?: number;
  showViewAll?: boolean;
}

export default function RecentPaymentsTable({
  maxRows = 5,
  showViewAll = true,
}: RecentPaymentsTableProps) {
  const f = useFormat();
  const { payments, simulateIncomingPayment } = usePaymentStream();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [simCurrency, setSimCurrency] = useState<'USDC' | 'EURC' | 'XLM'>('USDC');

  const displayedPayments = maxRows ? payments.slice(0, maxRows) : payments;

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSimulate = () => {
    const amount = toDecimalString(Math.floor(Math.random() * 85) + 15, 2);
    simulateIncomingPayment({
      asset_code: simCurrency,
      amount,
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">
              Recent On-Chain Payments
            </h3>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Horizon Stream Active
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">
            Streaming directly from Stellar Testnet Horizon. Payments appear automatically in real-time.
          </p>
        </div>

        {/* Quick Simulation Trigger */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <select
            value={simCurrency}
            onChange={(e) => setSimCurrency(e.target.value as 'USDC' | 'EURC' | 'XLM')}
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="USDC">USDC</option>
            <option value="EURC">EURC</option>
            <option value="XLM">XLM</option>
          </select>

          <button
            type="button"
            onClick={handleSimulate}
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 cursor-pointer"
            title="Simulate an incoming on-chain transaction"
          >
            <span>+ Simulate Payment</span>
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-400 dark:border-zinc-800 uppercase tracking-wider text-[10px]">
              <th className="pb-3 font-semibold">Asset & Amount</th>
              <th className="pb-3 font-semibold">From Account</th>
              <th className="pb-3 font-semibold">Transaction</th>
              <th className="pb-3 font-semibold">Time</th>
              <th className="pb-3 font-semibold text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
            {displayedPayments.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-zinc-400">
                  No payments received yet. Waiting for incoming Horizon stream events...
                </td>
              </tr>
            ) : (
              displayedPayments.map((payment) => {
                const isUsdc = payment.asset_code === 'USDC';
                const isEurc = payment.asset_code === 'EURC';
                const isNative = payment.asset_code === 'XLM';

                return (
                  <tr
                    key={payment.id}
                    className={`transition-all duration-700 ${
                      payment.isNew
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 ring-2 ring-emerald-400 dark:ring-emerald-600 animate-pulse'
                        : 'hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    {/* Amount & Currency */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-lg font-bold text-xs ${
                            isUsdc
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : isEurc
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          {isUsdc ? '$' : isEurc ? '€' : '✦'}
                        </div>
                        <div>
                          <div className="font-mono font-bold text-zinc-900 dark:text-white">
                            {f.amount(payment.amount, payment.asset_code, { signDisplay: 'always' })}
                          </div>
                          {payment.isNew && (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                              ★ Just Arrived
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* From Account */}
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5 font-mono text-zinc-600 dark:text-zinc-300">
                        <span>{truncateAddress(payment.from, 4)}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(payment.from, payment.id)}
                          className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                          title="Copy address"
                        >
                          {copiedId === payment.id ? (
                            <span className="text-[9px] text-emerald-600">✓</span>
                          ) : (
                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Transaction Hash */}
                    <td className="py-3 pr-4">
                      <a
                        href={`https://stellar.expert/explorer/testnet/tx/${payment.transaction_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-[11px] text-sky-600 hover:underline dark:text-sky-400"
                        title="View on Stellar Expert"
                      >
                        <span>{payment.transaction_hash.slice(0, 8)}...</span>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>

                    {/* Time */}
                    <td className="py-3 pr-4 text-zinc-500 whitespace-nowrap">
                      {f.time(payment.created_at, true)}
                    </td>

                    {/* Status */}
                    <td className="py-3 text-right">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Settled
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer link to Payments page */}
      {showViewAll && payments.length > maxRows && (
        <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-center">
          <Link
            href="/payments"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
          >
            View all {payments.length} on-chain payments →
          </Link>
        </div>
      )}
    </div>
  );
}
