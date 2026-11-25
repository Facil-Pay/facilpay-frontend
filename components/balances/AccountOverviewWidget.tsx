'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StrKey } from '@/lib/stellar/strkey';

interface AccountOverviewWidgetProps {
  accountId: string;
  totalUsdFormatted: string;
  subentryCount: number;
  isUnfunded: boolean;
  onOpenAddTrustline: () => void;
  onFundWithFriendbot: () => void;
  isFunding: boolean;
  /** Friendbot only exists on testnet; hide the action entirely on mainnet. */
  canFundWithFriendbot?: boolean;
}

export default function AccountOverviewWidget({
  accountId,
  totalUsdFormatted,
  subentryCount,
  isUnfunded,
  onOpenAddTrustline,
  onFundWithFriendbot,
  isFunding,
  canFundWithFriendbot = true,
}: AccountOverviewWidgetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const stellarExpertUrl = `https://stellar.expert/explorer/testnet/account/${accountId}`;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Account Info & Total Portfolio */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Merchant Stellar Account
            </span>
            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
              Testnet
            </span>
            {isUnfunded ? (
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300 animate-pulse">
                Unfunded Account
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active on Horizon
              </span>
            )}
          </div>

          {/* Account ID Bar */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs sm:text-sm font-semibold text-zinc-900 dark:text-white break-all">
              {accountId}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Copy account address"
            >
              {copied ? (
                <span className="text-xs text-emerald-600 font-sans font-semibold">Copied!</span>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
            <a
              href={stellarExpertUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-sky-600 dark:hover:bg-zinc-800 dark:hover:text-sky-400 transition-colors"
              title="View on Stellar Expert"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>

          {/* Portfolio Total */}
          <div className="pt-1">
            <span className="text-xs text-zinc-500 font-medium">Estimated Total Portfolio Value</span>
            <div className="text-3xl font-extrabold text-[#000F24] dark:text-white mt-0.5">
              {isUnfunded ? '$0.00 USD' : totalUsdFormatted}
            </div>
          </div>
        </div>

        {/* Right Info & Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isUnfunded ? (
            canFundWithFriendbot ? (
              <button
                type="button"
                onClick={onFundWithFriendbot}
                disabled={isFunding}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                <svg className={`h-4 w-4 ${isFunding ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {isFunding ? 'Requesting Testnet XLM...' : 'Fund with Friendbot (10,000 XLM)'}
              </button>
            ) : null
          ) : (
            <>
              <button
                type="button"
                onClick={onOpenAddTrustline}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <svg className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Trustline
              </button>

              <Link
                href="/payouts"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#000F24] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors dark:bg-[#55C2FF] dark:text-black dark:hover:bg-[#A5D4FF]"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                Withdraw / Payout
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
