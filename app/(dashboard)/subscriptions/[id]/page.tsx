'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Subscription,
  SubscriptionInvoice,
  SubscriptionStatus,
} from '@/lib/types/subscription';
import {
  INITIAL_SUBSCRIPTIONS,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from '@/lib/subscriptions';

interface SubscriptionDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function SubscriptionDetailPage({ params }: SubscriptionDetailPageProps) {
  const resolvedParams =
    params && typeof (params as any).then === 'function'
      ? use(params)
      : (params as any);
  const subId = resolvedParams?.id || '';

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [copiedWallet, setCopiedWallet] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => {
    const found = INITIAL_SUBSCRIPTIONS.find((s) => s.id === subId);
    if (found) {
      setSubscription(found);
    } else {
      // Fallback fallback subscription for direct testing
      setSubscription({
        id: subId,
        planId: 'plan_pro_monthly',
        planName: 'Pro Professional',
        customerEmail: 'customer@example.com',
        customerWallet: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
        amount: 49.0,
        asset: 'USDC',
        interval: 'monthly',
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        nextChargeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        invoices: [
          {
            id: `inv_${Date.now().toString(36)}`,
            subscriptionId: subId,
            amount: 49.0,
            asset: 'USDC',
            status: 'paid',
            date: new Date().toISOString(),
            periodStart: new Date().toISOString(),
            periodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            txHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        ],
      });
    }
  }, [subId]);

  if (!subscription) {
    return (
      <div className="py-16 text-center text-zinc-500">
        Loading subscription details...
      </div>
    );
  }

  const handleCopyWallet = async () => {
    try {
      await navigator.clipboard.writeText(subscription.customerWallet);
      setCopiedWallet(true);
      setTimeout(() => setCopiedWallet(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleTogglePause = () => {
    if (subscription.status === 'paused') {
      const updated = resumeSubscription(subscription);
      setSubscription(updated);
      setFeedbackMessage('Subscription resumed successfully.');
    } else if (subscription.status === 'active') {
      const updated = pauseSubscription(subscription);
      setSubscription(updated);
      setFeedbackMessage('Subscription paused. Upcoming recurring charges are suspended.');
    }
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleConfirmCancel = () => {
    const updated = cancelSubscription(subscription);
    setSubscription(updated);
    setShowCancelConfirm(false);
    setFeedbackMessage('Subscription cancelled. No further charges will occur.');
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const isCancelled = subscription.status === 'cancelled';
  const isPaused = subscription.status === 'paused';

  const statusBadgeClass =
    subscription.status === 'active'
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      : subscription.status === 'past_due'
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
      : subscription.status === 'paused'
      ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/subscriptions" className="hover:text-zinc-900 dark:hover:text-white transition">
          Subscriptions
        </Link>
        <span>/</span>
        <span className="font-mono text-zinc-900 dark:text-white font-medium">{subscription.id}</span>
      </div>

      {/* Alert / Notification Feedback */}
      {feedbackMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          {feedbackMessage}
        </div>
      )}

      {/* Header with Title and Lifecycle Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {subscription.planName}
            </h1>
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${statusBadgeClass}`}>
              {subscription.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="font-mono text-xs text-zinc-500 mt-1">{subscription.id}</p>
        </div>

        <div className="flex items-center gap-2">
          {!isCancelled && (
            <button
              type="button"
              onClick={handleTogglePause}
              className={`rounded-xl border px-4 py-2 text-xs font-semibold shadow-sm transition ${
                isPaused
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                  : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200'
              }`}
            >
              {isPaused ? 'Resume Subscription' : 'Pause Subscription'}
            </button>
          )}

          {!isCancelled && (
            <button
              type="button"
              onClick={() => setShowCancelConfirm(true)}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-100 transition dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Prompt */}
      {showCancelConfirm && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs dark:border-rose-900 dark:bg-rose-950">
          <p className="font-semibold text-rose-900 dark:text-rose-200">
            Are you sure you want to cancel this customer subscription?
          </p>
          <p className="text-rose-700 dark:text-rose-300 mt-1">
            Cancelling will terminate recurring payment scheduling. This action cannot be undone.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700 transition"
            >
              Yes, Cancel Subscription
            </button>
            <button
              type="button"
              onClick={() => setShowCancelConfirm(false)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              Nevermind
            </button>
          </div>
        </div>
      )}

      {/* Grid: Plan & Billing Details + Customer Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Card 1: Subscription & Billing Status */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Billing Schedule & Terms
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500">Recurring Price</span>
              <span className="font-bold text-zinc-900 dark:text-white text-sm">
                {subscription.amount.toFixed(2)} {subscription.asset}
                <span className="text-zinc-500 text-xs font-normal"> / {subscription.interval}</span>
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500">Next Charge Date</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {subscription.nextChargeDate !== '—'
                  ? new Date(subscription.nextChargeDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '—'}
              </span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500">Current Period</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {new Date(subscription.currentPeriodStart).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}{' '}
                –{' '}
                {new Date(subscription.currentPeriodEnd).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            {subscription.trialEndsAt && (
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Trial Period Ends</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {new Date(subscription.trialEndsAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Created On</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {new Date(subscription.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Customer Information */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/50 space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Subscriber Details
          </h2>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500">Customer Email</span>
              <span className="font-semibold text-zinc-900 dark:text-white">
                {subscription.customerEmail}
              </span>
            </div>

            <div className="pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <span className="text-zinc-500 block mb-1">Stellar Wallet Address</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 truncate">
                  {subscription.customerWallet}
                </span>
                <button
                  type="button"
                  onClick={handleCopyWallet}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-semibold text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 shrink-0"
                >
                  {copiedWallet ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-500">Explorer Lookup</span>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${subscription.customerWallet}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
              >
                View on Stellar.expert &rarr;
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice History Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Invoice History
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Record of recurring charges and settlement receipts for this subscription.
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            {subscription.invoices.length} {subscription.invoices.length === 1 ? 'invoice' : 'invoices'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-500 border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-5 py-3 font-semibold">Invoice ID</th>
                <th className="px-5 py-3 font-semibold">Billing Period</th>
                <th className="px-5 py-3 font-semibold">Amount</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold text-right">Stellar Tx</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {subscription.invoices.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                    No invoices generated yet.
                  </td>
                </tr>
              ) : (
                subscription.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5 font-mono font-semibold text-zinc-900 dark:text-white">
                      {inv.id}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-600 dark:text-zinc-400">
                      {new Date(inv.periodStart).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}{' '}
                      –{' '}
                      {new Date(inv.periodEnd).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-zinc-900 dark:text-white">
                      {inv.amount.toFixed(2)} {inv.asset}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          inv.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : inv.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-500">
                      {new Date(inv.date).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {inv.txHash ? (
                        <a
                          href={
                            inv.stellarExpertUrl ||
                            `https://stellar.expert/explorer/testnet/tx/${inv.txHash}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                        >
                          {inv.txHash.slice(0, 8)}...{inv.txHash.slice(-6)} &rarr;
                        </a>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
