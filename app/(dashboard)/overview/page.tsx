'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import GettingStartedCard from '@/components/overview/GettingStartedCard';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import {
  getOnboardingState,
  getGettingStartedTasks,
  saveGettingStartedTasks,
} from '@/lib/storage';
import { OnboardingState } from '@/types/onboarding';
import { truncateAddress } from '@/lib/stellar';
import { generateQRSvg } from '@/lib/qr';
import { PaymentStreamProvider, usePaymentStream } from '@/lib/payment-stream-context';
import RecentPaymentsTable from '@/components/payments/RecentPaymentsTable';
import PaymentToast from '@/components/payments/PaymentToast';

function OverviewContent() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { payments } = usePaymentStream();
  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [isChecklistDismissed, setIsChecklistDismissed] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [qrCodeSvg, setQrCodeSvg] = useState<string>('');

  const liveUsdcVolume = payments
    .filter((p) => p.asset_code === 'USDC')
    .reduce((sum, p) => sum + parseFloat(p.amount || '0'), 0);
  const totalSettledUsdc = (1250 + liveUsdcVolume).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  useEffect(() => {
    const savedOnboarding = getOnboardingState();
    setOnboarding(savedOnboarding);

    const tasks = getGettingStartedTasks();
    setIsChecklistDismissed(tasks.dismissed);

    // Generate QR for payment link if available
    if (savedOnboarding.paymentLink?.paymentUrl) {
      const svg = generateQRSvg(savedOnboarding.paymentLink.paymentUrl, {
        size: 96,
        margin: 1,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });
      setQrCodeSvg(svg);
    }

    // Trigger requirement check:
    // "After first login, merchants without a completed profile are sent to /onboarding"
    // "New merchants are sent to onboarding automatically"
    if (!savedOnboarding.isCompleted && !user?.isProfileCompleted && !isLoading) {
      const timer = setTimeout(() => {
        router.push('/onboarding');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isLoading, router]);

  const handleRestoreChecklist = () => {
    const tasks = getGettingStartedTasks();
    const updated = { ...tasks, dismissed: false };
    saveGettingStartedTasks(updated);
    setIsChecklistDismissed(false);
  };

  const handleCopyLink = () => {
    if (onboarding?.paymentLink?.paymentUrl && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(onboarding.paymentLink.paymentUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading || !onboarding) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <svg className="h-5 w-5 animate-spin text-[#0088FF]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>Loading merchant overview...</span>
        </div>
      </div>
    );
  }

  // If merchant has not completed profile, show auto-redirect notice
  const isProfileComplete = onboarding.isCompleted || user?.isProfileCompleted;

  if (!isProfileComplete) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-3xl animate-bounce">
          ⏳
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Merchant Profile Incomplete
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Merchants without a completed profile are automatically sent to the onboarding wizard. Redirecting you now...
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/onboarding"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-sky-500/20 hover:opacity-95"
          >
            <span>Go to Onboarding Wizard</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  const business = onboarding.business;
  const settlement = onboarding.settlement;
  const paymentLink = onboarding.paymentLink;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Merchant Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {business.name || 'Merchant Dashboard'}
            </h1>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Verified Merchant
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {business.category || 'E-Commerce'} • {business.country || 'Global'} • Settling to{' '}
            <span className="font-mono text-zinc-700 dark:text-zinc-300">
              {truncateAddress(settlement.address, 6)}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isChecklistDismissed && (
            <button
              type="button"
              onClick={handleRestoreChecklist}
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 cursor-pointer"
            >
              Show Getting Started Checklist
            </button>
          )}

          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950/60 dark:text-sky-300 transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Revisit Onboarding</span>
          </Link>
        </div>
      </div>

      {/* Requirement 4: Getting Started Checklist Card */}
      <GettingStartedCard paymentLink={paymentLink} />

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Settled Volume',
            value: `$${totalSettledUsdc} USDC`,
            change: `+${payments.length} on-chain payments`,
            icon: '💰',
          },
          {
            label: 'Active Payment Links',
            value: paymentLink.id ? '1 Active Link' : '0 Links',
            change: paymentLink.title || 'Ready to share',
            icon: '🔗',
          },
          {
            label: 'Trustline Assets',
            value: 'USDC & EURC',
            change: 'Stellar Testnet',
            icon: '⚡',
          },
          {
            label: 'Avg Settlement Time',
            value: '3.2 seconds',
            change: 'Non-custodial',
            icon: '⏱️',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
              <span>{stat.label}</span>
              <span className="text-base">{stat.icon}</span>
            </div>
            <div className="text-xl font-bold text-zinc-900 dark:text-white">
              {stat.value}
            </div>
            <div className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
              {stat.change}
            </div>
          </div>
        ))}
      </div>

      {/* Active First Payment Link Card & QR Section */}
      {paymentLink.id && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Active Payment Link: {paymentLink.title}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                Share this link or QR code with customers to collect payments on Stellar.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-zinc-900 dark:text-white">
                ${paymentLink.amount} {paymentLink.currency}
              </span>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-6">
            {/* QR Code */}
            {qrCodeSvg && (
              <div className="flex flex-col items-center p-2 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 shrink-0">
                <div dangerouslySetInnerHTML={{ __html: qrCodeSvg }} />
                <span className="text-[10px] text-zinc-400 font-mono mt-1">Scan to Pay</span>
              </div>
            )}

            {/* Link details */}
            <div className="w-full space-y-3">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                <input
                  type="text"
                  readOnly
                  value={paymentLink.paymentUrl}
                  className="w-full bg-transparent font-mono text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none truncate"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="shrink-0 rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200 transition-colors cursor-pointer"
                >
                  {copiedLink ? 'Copied!' : 'Copy Link'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                <span>Created: {new Date(paymentLink.createdAt || Date.now()).toLocaleDateString()}</span>
                <span>•</span>
                <span>Settles to: {truncateAddress(settlement.address, 4)}</span>
                <span>•</span>
                <span className="text-emerald-600 font-medium">Status: Live</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Horizon On-Chain Payments Stream */}
      <RecentPaymentsTable maxRows={5} showViewAll={true} />

      {/* Developer Settings Links Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/settings/webhooks"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-sky-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-sky-700 transition-colors group flex items-start gap-4"
        >
          <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            🔔
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              Webhook Endpoints
            </h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Configure endpoints to receive automated notifications when transactions are confirmed on the Stellar ledger.
            </p>
          </div>
        </Link>

        <Link
          href="/settings/api-keys"
          className="p-5 rounded-2xl border border-zinc-200 bg-white hover:border-sky-300 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:border-sky-700 transition-colors group flex items-start gap-4"
        >
          <div className="h-10 w-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
            🔑
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
              API Keys & SDK
            </h4>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Create and manage authentication keys to integrate FacilPay into your e-commerce platform or custom frontend.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <AuthProvider>
      <PaymentStreamProvider>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
          <main className="flex-1">
            <OverviewContent />
          </main>
          <PaymentToast />
        </div>
      </PaymentStreamProvider>
    </AuthProvider>
  );
}
