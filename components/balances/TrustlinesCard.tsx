'use client';

import React, { useState } from 'react';
import { FormattedBalance, SUPPORTED_TRUSTLINE_ASSETS } from '@/lib/stellar/horizon';
import { StrKey } from '@/lib/stellar/strkey';
import { useFormat } from '@/lib/i18n/use-format';

interface TrustlinesCardProps {
  balances: FormattedBalance[];
  onOpenAddModal: () => void;
  onRemoveTrustline: (assetCode: string, assetIssuer: string) => Promise<void>;
}

export default function TrustlinesCard({
  balances,
  onOpenAddModal,
  onRemoveTrustline,
}: TrustlinesCardProps) {
  const f = useFormat();
  const [removingAsset, setRemovingAsset] = useState<string | null>(null);

  // Trustlines are non-native credit assets
  const trustlines = balances.filter((b) => !b.isNative);

  const handleRemove = async (assetCode: string, assetIssuer: string) => {
    if (!confirm(`Are you sure you want to remove the trustline for ${assetCode}? This will set the trust limit to 0.`)) {
      return;
    }
    setRemovingAsset(assetCode);
    try {
      await onRemoveTrustline(assetCode, assetIssuer);
    } finally {
      setRemovingAsset(null);
    }
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Account Trustlines
          </h2>
          <p className="text-xs text-zinc-500">
            Assets your Stellar merchant account is authorized to hold and facilitate
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#000F24] px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Trustline
        </button>
      </div>

      {trustlines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-700">
          <p className="font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
            No Active Trustlines Configured
          </p>
          <p className="max-w-md mx-auto mb-3">
            Add a trustline for USDC or EURC to accept merchant payments and settle transactions in stablecoins.
          </p>
          <button
            type="button"
            onClick={onOpenAddModal}
            className="text-xs font-bold text-sky-600 hover:underline dark:text-sky-400"
          >
            Add USDC Trustline →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {trustlines.map((tl) => {
            const hasZeroBalance = tl.totalBalance === 0;

            return (
              <div
                key={tl.assetCode + tl.assetIssuer}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-zinc-900 dark:text-white">
                      {tl.assetCode}
                    </span>
                    <span className="rounded bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                      Trustline Active
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                    <span>Issuer:</span>
                    <a
                      href={tl.stellarExpertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline dark:text-sky-400"
                    >
                      {StrKey.truncateAddress(tl.assetIssuer || '', 8, 8)}
                    </a>
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    Trust Limit: {tl.limit ? f.amount(tl.limit, tl.assetCode, { withCode: false }) : 'Maximum (Default)'}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-zinc-400 block">Current Balance</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {f.amount(tl.totalBalance, tl.assetCode)}
                    </span>
                  </div>

                  {/* Remove Trustline (Only allowed at ZERO balance) */}
                  <div className="relative group">
                    <button
                      type="button"
                      disabled={!hasZeroBalance || removingAsset === tl.assetCode}
                      onClick={() => handleRemove(tl.assetCode, tl.assetIssuer || '')}
                      className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                    >
                      {removingAsset === tl.assetCode ? 'Removing...' : 'Remove'}
                    </button>

                    {/* Tooltip when balance > 0 explaining why remove is disabled */}
                    {!hasZeroBalance && (
                      <div className="invisible group-hover:visible absolute right-0 -top-1 -translate-y-full z-30 w-56 rounded-lg bg-zinc-900 p-2 text-[10px] text-white shadow-lg pointer-events-none">
                        Cannot remove trustline while balance is greater than 0. Transfer or off-ramp your {tl.assetCode} funds first.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
