'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AccountOverviewWidget from '@/components/balances/AccountOverviewWidget';
import BalancesTable from '@/components/balances/BalancesTable';
import TrustlinesCard from '@/components/balances/TrustlinesCard';
import AccountActivityTable from '@/components/balances/AccountActivityTable';
import AddTrustlineModal from '@/components/balances/AddTrustlineModal';
import AccountSignersCard from '@/components/balances/AccountSignersCard';
import {
  FormattedBalance,
  HorizonOperation,
  calculateXlmReserve,
  fundWithFriendbot,
} from '@/lib/stellar/horizon';
import { calculateTotalPortfolioUsd } from '@/lib/stellar/prices';
import {
  DEMO_MULTISIG_ACCOUNT,
  DEMO_MULTISIG_SIGNERS,
  DEMO_MULTISIG_THRESHOLDS,
} from '@/lib/stellar/multisig';

const DEMO_MERCHANT_ACCOUNT = 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A';
const DEMO_UNFUNDED_ACCOUNT = 'GCRQYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A';

export default function BalancesPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>(DEMO_MERCHANT_ACCOUNT);
  const [isUnfunded, setIsUnfunded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFunding, setIsFunding] = useState<boolean>(false);
  const [fundingMessage, setFundingMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);
  const [isAddTrustlineOpen, setIsAddTrustlineOpen] = useState<boolean>(false);

  // Initial balances for the demo merchant
  const [balances, setBalances] = useState<FormattedBalance[]>(() => {
    const xlmTotal = 18400.0;
    const subentryCount = 3; // 2 trustlines (USDC, EURC) + 1 signer
    const reserve = calculateXlmReserve(xlmTotal, subentryCount);

    return [
      {
        assetCode: 'XLM',
        isNative: true,
        totalBalance: xlmTotal,
        availableBalance: reserve.available,
        subentryCount,
        reserveDetails: reserve,
        stellarExpertUrl: 'https://stellar.expert/explorer/testnet/asset/XLM',
      },
      {
        assetCode: 'USDC',
        assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        isNative: false,
        totalBalance: 42850.0,
        availableBalance: 42850.0,
        limit: '922337203685.4775807',
        stellarExpertUrl: 'https://stellar.expert/explorer/testnet/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      },
      {
        assetCode: 'EURC',
        assetIssuer: 'GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
        isNative: false,
        totalBalance: 12200.0,
        availableBalance: 12200.0,
        limit: '922337203685.4775807',
        stellarExpertUrl: 'https://stellar.expert/explorer/testnet/asset/EURC-GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
      },
    ];
  });

  // Recent Horizon Operations
  const [operations, setOperations] = useState<HorizonOperation[]>([
    {
      id: 'op_10293847',
      type: 'payment',
      typeLabel: 'Payment Received',
      createdAt: '2026-02-28T16:20:10.000Z',
      transactionHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      details: {
        amount: '1250.0000000',
        assetCode: 'USDC',
        from: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
        to: DEMO_MERCHANT_ACCOUNT,
      },
    },
    {
      id: 'op_10293846',
      type: 'change_trust',
      typeLabel: 'Trustline Established',
      createdAt: '2026-02-15T09:12:00.000Z',
      transactionHash: '5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
      stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
      details: {
        assetCode: 'EURC',
        assetIssuer: 'GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
        limit: '922337203685.4775807',
      },
    },
    {
      id: 'op_10293845',
      type: 'payment',
      typeLabel: 'Payment Received',
      createdAt: '2026-02-10T14:45:22.000Z',
      transactionHash: '7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef',
      stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef',
      details: {
        amount: '1850.0000000',
        assetCode: 'EURC',
        from: 'GCTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
        to: DEMO_MERCHANT_ACCOUNT,
      },
    },
    {
      id: 'op_10293840',
      type: 'create_account',
      typeLabel: 'Account Funded',
      createdAt: '2026-01-01T08:00:00.000Z',
      transactionHash: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
      stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
      details: {
        startingBalance: '10000.0000000',
        funder: 'GAIH3ULLFQ4DGSECF2AR5SX6VGE3EGRHSQMAVYPPYFCIFHUACJYRLORW',
      },
    },
  ]);

  // Load / Toggle account
  const handleToggleAccount = (accountId: string) => {
    setSelectedAccount(accountId);
    setFundingMessage(null);

    if (accountId === DEMO_UNFUNDED_ACCOUNT) {
      setIsUnfunded(true);
      setBalances([]);
      setOperations([]);
    } else {
      setIsUnfunded(false);
      // Restore merchant balances
      const xlmTotal = 18400.0;
      const subentryCount = 3;
      const reserve = calculateXlmReserve(xlmTotal, subentryCount);

      setBalances([
        {
          assetCode: 'XLM',
          isNative: true,
          totalBalance: xlmTotal,
          availableBalance: reserve.available,
          subentryCount,
          reserveDetails: reserve,
          stellarExpertUrl: 'https://stellar.expert/explorer/testnet/asset/XLM',
        },
        {
          assetCode: 'USDC',
          assetIssuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
          isNative: false,
          totalBalance: 42850.0,
          availableBalance: 42850.0,
          limit: '922337203685.4775807',
          stellarExpertUrl: 'https://stellar.expert/explorer/testnet/asset/USDC-GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        },
        {
          assetCode: 'EURC',
          assetIssuer: 'GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
          isNative: false,
          totalBalance: 12200.0,
          availableBalance: 12200.0,
          limit: '922337203685.4775807',
          stellarExpertUrl: 'https://stellar.expert/explorer/testnet/asset/EURC-GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
        },
      ]);
    }
  };

  // Friendbot Funding Action
  const handleFundWithFriendbot = async () => {
    setIsFunding(true);
    setFundingMessage(null);

    const res = await fundWithFriendbot(selectedAccount);
    setIsFunding(false);

    if (res.success) {
      setFundingMessage({ text: res.message, isSuccess: true });
      setIsUnfunded(false);

      // Initialize with funded XLM balance
      const totalXlm = 10000.0;
      const reserve = calculateXlmReserve(totalXlm, 0);

      setBalances([
        {
          assetCode: 'XLM',
          isNative: true,
          totalBalance: totalXlm,
          availableBalance: reserve.available,
          subentryCount: 0,
          reserveDetails: reserve,
          stellarExpertUrl: 'https://stellar.expert/explorer/testnet/asset/XLM',
        },
      ]);

      setOperations([
        {
          id: `op_${Date.now()}`,
          type: 'create_account',
          typeLabel: 'Account Funded (Friendbot)',
          createdAt: new Date().toISOString(),
          transactionHash: `${Date.now().toString(16)}00112233445566778899aabbccddeeff`.slice(0, 64),
          stellarExpertUrl: `https://stellar.expert/explorer/testnet/account/${selectedAccount}`,
          details: {
            startingBalance: '10000.0000000',
            funder: 'GAIH3ULLFQ4DGSECF2AR5SX6VGE3EGRHSQMAVYPPYFCIFHUACJYRLORW',
          },
        },
      ]);
    } else {
      setFundingMessage({ text: res.message, isSuccess: false });
    }
  };

  // Add Trustline Handler
  const handleConfirmAddTrustline = async (asset: { code: string; issuer: string; name?: string }) => {
    // Add new trustline balance with 0 balance
    const newTl: FormattedBalance = {
      assetCode: asset.code,
      assetIssuer: asset.issuer,
      isNative: false,
      totalBalance: 0,
      availableBalance: 0,
      limit: '922337203685.4775807',
      stellarExpertUrl: `https://stellar.expert/explorer/testnet/asset/${asset.code}-${asset.issuer}`,
    };

    setBalances((prev) => {
      // Recalculate XLM reserve with +1 subentry
      const updated = prev.map((b) => {
        if (b.isNative) {
          const newSubentries = (b.subentryCount || 0) + 1;
          const newReserve = calculateXlmReserve(b.totalBalance, newSubentries);
          return {
            ...b,
            subentryCount: newSubentries,
            availableBalance: newReserve.available,
            reserveDetails: newReserve,
          };
        }
        return b;
      });
      return [...updated, newTl];
    });

    // Prepend to operations
    setOperations((prev) => [
      {
        id: `op_${Date.now()}`,
        type: 'change_trust',
        typeLabel: 'Trustline Established',
        createdAt: new Date().toISOString(),
        transactionHash: `${Date.now().toString(16)}abcdef0123456789abcdef0123456789`.slice(0, 64),
        stellarExpertUrl: `https://stellar.expert/explorer/testnet/account/${selectedAccount}`,
        details: {
          assetCode: asset.code,
          assetIssuer: asset.issuer,
          limit: '922337203685.4775807',
        },
      },
      ...prev,
    ]);

    setIsAddTrustlineOpen(false);
  };

  // Remove Trustline Handler
  const handleRemoveTrustline = async (assetCode: string, assetIssuer: string) => {
    setBalances((prev) => {
      // Recalculate XLM reserve with -1 subentry
      return prev
        .filter((b) => !(b.assetCode === assetCode && b.assetIssuer === assetIssuer))
        .map((b) => {
          if (b.isNative) {
            const newSubentries = Math.max(0, (b.subentryCount || 1) - 1);
            const newReserve = calculateXlmReserve(b.totalBalance, newSubentries);
            return {
              ...b,
              subentryCount: newSubentries,
              availableBalance: newReserve.available,
              reserveDetails: newReserve,
            };
          }
          return b;
        });
    });

    setOperations((prev) => [
      {
        id: `op_${Date.now()}`,
        type: 'change_trust',
        typeLabel: 'Trustline Removed',
        createdAt: new Date().toISOString(),
        transactionHash: `${Date.now().toString(16)}112233445566778899aabbccddeeff`.slice(0, 64),
        stellarExpertUrl: `https://stellar.expert/explorer/testnet/account/${selectedAccount}`,
        details: {
          assetCode,
          assetIssuer,
          limit: '0',
        },
      },
      ...prev,
    ]);
  };

  const totalUsd = useMemo(() => {
    return calculateTotalPortfolioUsd(balances);
  }, [balances]);

  const xlmBalance = balances.find((b) => b.isNative);
  const subentryCount = xlmBalance?.subentryCount || 0;
  const existingCodes = balances.map((b) => b.assetCode);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header with Account Tester Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Multi-Asset Balances & Account Overview
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Live Stellar account balances, native XLM minimum reserve accounting, and trustline management.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 hidden sm:inline">Simulate State:</span>
            <div className="inline-flex rounded-xl border border-zinc-200 bg-white p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => handleToggleAccount(DEMO_MERCHANT_ACCOUNT)}
                className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                  !isUnfunded && selectedAccount === DEMO_MERCHANT_ACCOUNT
                    ? 'bg-[#000F24] text-white dark:bg-[#55C2FF] dark:text-black'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                Active Account
              </button>
              <button
                type="button"
                onClick={() => handleToggleAccount(DEMO_MULTISIG_ACCOUNT)}
                className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                  selectedAccount === DEMO_MULTISIG_ACCOUNT
                    ? 'bg-purple-600 text-white'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                2-of-3 Multi-Sig (Treasury)
              </button>
              <button
                type="button"
                onClick={() => handleToggleAccount(DEMO_UNFUNDED_ACCOUNT)}
                className={`rounded-lg px-3 py-1 font-semibold transition-colors ${
                  isUnfunded
                    ? 'bg-rose-600 text-white'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                Unfunded Account (Test)
              </button>
            </div>
          </div>
        </div>

        {/* Unfunded Account Alert Banner with Friendbot Link */}
        {isUnfunded && (
          <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 dark:border-amber-900/60 dark:bg-amber-950/30 space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 text-base font-bold">
                ⚠️
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Account Not Yet Funded on Stellar Testnet
                </h3>
                <p className="text-xs text-amber-800 dark:text-amber-300">
                  This Stellar address has not received its initial starting balance. On the Stellar network, all accounts must be initialized with a base reserve (minimum 1 XLM) to exist on the distributed ledger.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 pl-12">
              <button
                type="button"
                onClick={handleFundWithFriendbot}
                disabled={isFunding}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
              >
                <svg className={`h-4 w-4 ${isFunding ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {isFunding ? 'Funding from Friendbot...' : 'Fund Account with Friendbot (10,000 XLM)'}
              </button>

              <a
                href={`https://friendbot.stellar.org/?addr=${encodeURIComponent(selectedAccount)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 hover:underline dark:text-amber-300"
              >
                <span>Direct Friendbot API Link</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            {fundingMessage && (
              <div
                className={`mt-2 rounded-xl p-3 text-xs ${
                  fundingMessage.isSuccess
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {fundingMessage.text}
              </div>
            )}
          </div>
        )}

        {/* 1. Account Overview Widget */}
        <AccountOverviewWidget
          accountId={selectedAccount}
          totalUsdFormatted={totalUsd.formatted}
          subentryCount={subentryCount}
          isUnfunded={isUnfunded}
          onOpenAddTrustline={() => setIsAddTrustlineOpen(true)}
          onFundWithFriendbot={handleFundWithFriendbot}
          isFunding={isFunding}
        />

        {/* 2. Account Signers & Multi-Signature Thresholds */}
        {!isUnfunded && (
          <AccountSignersCard
            accountId={selectedAccount}
            signers={selectedAccount === DEMO_MULTISIG_ACCOUNT ? DEMO_MULTISIG_SIGNERS : undefined}
            thresholds={selectedAccount === DEMO_MULTISIG_ACCOUNT ? DEMO_MULTISIG_THRESHOLDS : undefined}
          />
        )}

        {/* 3. Balances Table & Native XLM Reserve Breakdown */}
        {!isUnfunded && <BalancesTable balances={balances} />}

        {/* 3. Trustlines Card (List, Add, Zero-balance Remove) */}
        {!isUnfunded && (
          <TrustlinesCard
            balances={balances}
            onOpenAddModal={() => setIsAddTrustlineOpen(true)}
            onRemoveTrustline={handleRemoveTrustline}
          />
        )}

        {/* 4. Recent Account Operations (Horizon) */}
        {!isUnfunded && (
          <AccountActivityTable operations={operations} isLoading={isLoading} />
        )}
      </div>

      {/* Add Trustline Modal with Wallet Signing */}
      <AddTrustlineModal
        isOpen={isAddTrustlineOpen}
        onClose={() => setIsAddTrustlineOpen(false)}
        existingAssetCodes={existingCodes}
        onConfirmAddTrustline={handleConfirmAddTrustline}
      />
    </DashboardLayout>
  );
}
