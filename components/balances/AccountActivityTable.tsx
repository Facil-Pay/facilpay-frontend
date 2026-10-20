'use client';

import React from 'react';
import { HorizonOperation } from '@/lib/stellar/horizon';
import { useFormat } from '@/lib/i18n/use-format';

interface AccountActivityTableProps {
  operations: HorizonOperation[];
  isLoading: boolean;
}

export default function AccountActivityTable({
  operations,
  isLoading,
}: AccountActivityTableProps) {
  const f = useFormat();
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="border-b border-zinc-200 px-6 py-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Recent Account Operations (Horizon)
          </h2>
          <p className="text-xs text-zinc-500">
            Immutable operation ledger history streamed from Stellar Horizon
          </p>
        </div>
        <span className="text-xs font-semibold text-zinc-500">
          {operations.length} Recent Operation{operations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-zinc-200 bg-zinc-50/80 uppercase tracking-wider text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-6 py-3.5">Operation Type</th>
              <th className="px-6 py-3.5">Asset & Amount</th>
              <th className="px-6 py-3.5">Counterparty / Details</th>
              <th className="px-6 py-3.5">Timestamp (UTC)</th>
              <th className="px-6 py-3.5 text-right">Ledger Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-sky-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Fetching live operations from Horizon...</span>
                  </div>
                </td>
              </tr>
            ) : operations.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-zinc-500">
                  No recent operations recorded for this account.
                </td>
              </tr>
            ) : (
              operations.map((op) => {
                const isPayment = op.type === 'payment';
                const isTrustline = op.type === 'change_trust';
                const isFunding = op.type === 'create_account';

                return (
                  <tr
                    key={op.id}
                    className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    {/* Operation Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isPayment
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : isTrustline
                            ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                            : isFunding
                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300'
                            : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                        }`}
                      >
                        {op.typeLabel}
                      </span>
                    </td>

                    {/* Asset & Amount */}
                    <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                      {op.details.amount ? (
                        <>
                          {f.amount(op.details.amount, op.details.assetCode || 'XLM', { withCode: false })}{' '}
                          <span className="text-zinc-500 font-normal">
                            {op.details.assetCode || 'XLM'}
                          </span>
                        </>
                      ) : op.details.startingBalance ? (
                        <>
                          {f.amount(op.details.startingBalance, 'XLM', { withCode: false })}{' '}
                          <span className="text-zinc-500 font-normal">XLM</span>
                        </>
                      ) : (
                        <span className="font-mono text-zinc-500 text-xs">
                          {op.details.assetCode ? `${op.details.assetCode} Trustline` : '—'}
                        </span>
                      )}
                    </td>

                    {/* Counterparty / Details */}
                    <td className="px-6 py-4 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {op.details.from && (
                        <div>
                          <span className="text-zinc-400">From: </span>
                          {op.details.from.slice(0, 6)}...{op.details.from.slice(-4)}
                        </div>
                      )}
                      {op.details.to && (
                        <div>
                          <span className="text-zinc-400">To: </span>
                          {op.details.to.slice(0, 6)}...{op.details.to.slice(-4)}
                        </div>
                      )}
                      {op.details.funder && (
                        <div>
                          <span className="text-zinc-400">Funder: </span>
                          {op.details.funder.slice(0, 6)}...{op.details.funder.slice(-4)}
                        </div>
                      )}
                      {op.details.assetIssuer && (
                        <div>
                          <span className="text-zinc-400">Issuer: </span>
                          {op.details.assetIssuer.slice(0, 6)}...{op.details.assetIssuer.slice(-4)}
                        </div>
                      )}
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 text-zinc-500">
                      {op.createdAt ? op.createdAt.slice(0, 10) + ' ' + op.createdAt.slice(11, 19) + ' UTC' : '—'}
                    </td>

                    {/* Stellar Expert Link */}
                    <td className="px-6 py-4 text-right">
                      <a
                        href={op.stellarExpertUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-sky-600 hover:underline dark:text-sky-400"
                        title="View operation on Stellar Expert"
                      >
                        <span>{op.transactionHash.slice(0, 8)}...</span>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
