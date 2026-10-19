'use client';

import React, { useState } from 'react';
import {
  HorizonSigner,
  HorizonThresholds,
} from '@/lib/stellar/horizon';
import {
  DEMO_MULTISIG_SIGNERS,
  DEMO_MULTISIG_THRESHOLDS,
  getMultisigAccountConfig,
} from '@/lib/stellar/multisig';

interface AccountSignersCardProps {
  accountId: string;
  signers?: HorizonSigner[];
  thresholds?: HorizonThresholds;
}

export default function AccountSignersCard({
  accountId,
  signers = DEMO_MULTISIG_SIGNERS,
  thresholds = DEMO_MULTISIG_THRESHOLDS,
}: AccountSignersCardProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const config = getMultisigAccountConfig(accountId, signers, thresholds);

  const handleCopy = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Account Signers & Thresholds
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                config.isMultisig
                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
              }`}
            >
              {config.description}
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Multi-signature access rules governing payout execution and on-chain settlements.
          </p>
        </div>

        {/* Protection Pill */}
        <div className="flex items-center gap-2 rounded-xl bg-purple-50 px-3.5 py-2 text-xs font-medium text-purple-900 dark:bg-purple-950/40 dark:text-purple-200">
          <svg className="h-4 w-4 shrink-0 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            {config.isMultisig
              ? `${config.requiredPayoutThreshold} of ${config.signers.length} signatures required for payouts`
              : '1 signature required for payouts'}
          </span>
        </div>
      </div>

      {/* Thresholds Grid */}
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/40">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Low Threshold
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-zinc-900 dark:text-white">
              {config.thresholds.low_threshold}
            </span>
            <span className="text-xs text-zinc-500">allow trust, sequence bump</span>
          </div>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3.5 dark:border-purple-900/50 dark:bg-purple-950/20">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300">
              Medium Threshold (Payouts)
            </span>
            <span className="rounded bg-purple-200 px-1.5 py-0.5 text-[10px] font-bold text-purple-900 dark:bg-purple-900 dark:text-purple-100">
              Active
            </span>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-purple-950 dark:text-white">
              {config.thresholds.med_threshold}
            </span>
            <span className="text-xs text-purple-700 dark:text-purple-300">payments & withdrawals</span>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-3.5 dark:border-zinc-800/80 dark:bg-zinc-800/40">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            High Threshold
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-xl font-extrabold text-zinc-900 dark:text-white">
              {config.thresholds.high_threshold}
            </span>
            <span className="text-xs text-zinc-500">account signers & options</span>
          </div>
        </div>
      </div>

      {/* Signers Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-left text-xs">
          <thead className="bg-zinc-50 font-semibold text-zinc-600 dark:bg-zinc-800/60 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3">Signer Public Key</th>
              <th className="px-4 py-3">Weight</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Explorer</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {config.signers.map((signer, idx) => {
              const isMaster = signer.key === accountId;
              const explorerUrl = `https://stellar.expert/explorer/testnet/account/${signer.key}`;

              return (
                <tr key={signer.key} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-zinc-800 dark:text-zinc-200">
                        {signer.key.slice(0, 10)}...{signer.key.slice(-10)}
                      </span>
                      {isMaster && (
                        <span className="rounded bg-sky-100 px-1.5 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                          Primary Master
                        </span>
                      )}
                      {!isMaster && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                          Signer #{idx + 1}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleCopy(signer.key)}
                        className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        title="Copy full public key"
                      >
                        {copiedKey === signer.key ? (
                          <span className="text-[10px] font-bold text-emerald-600">Copied</span>
                        ) : (
                          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center justify-center rounded-md bg-zinc-100 px-2 py-0.5 font-mono font-bold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                      {signer.weight}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                    {signer.type.replace(/_/g, ' ')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sky-600 hover:underline dark:text-sky-400"
                    >
                      <span>stellar.expert</span>
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
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
