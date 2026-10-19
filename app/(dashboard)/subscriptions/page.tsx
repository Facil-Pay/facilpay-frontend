'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  SubscriptionPlan,
  Subscription,
  SubscriptionStatus,
  CreatePlanInput,
} from '@/lib/types/subscription';
import {
  INITIAL_PLANS,
  INITIAL_SUBSCRIPTIONS,
  createPlan,
  updatePlan,
  archivePlan,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  calculateMRR,
  calculateSubscribersCount,
} from '@/lib/subscriptions';
import CreatePlanModal from '@/components/subscriptions/CreatePlanModal';

export default function SubscriptionsDashboardPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>(INITIAL_PLANS);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(INITIAL_SUBSCRIPTIONS);

  const [activeTab, setActiveTab] = useState<'subscriptions' | 'plans'>('subscriptions');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Plan Modal state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

  // Metrics
  const mrr = useMemo(() => calculateMRR(subscriptions), [subscriptions]);
  const counts = useMemo(() => calculateSubscribersCount(subscriptions), [subscriptions]);

  // Filtered Subscriptions
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      if (statusFilter !== 'ALL' && sub.status !== statusFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          sub.id.toLowerCase().includes(query) ||
          sub.customerEmail.toLowerCase().includes(query) ||
          sub.customerWallet.toLowerCase().includes(query) ||
          sub.planName.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [subscriptions, statusFilter, searchTerm]);

  // Plan Handlers
  const handleSavePlan = (input: CreatePlanInput, editId?: string) => {
    if (editId) {
      setPlans((prev) =>
        prev.map((p) => (p.id === editId ? updatePlan(p, input) : p))
      );
    } else {
      const newPlan = createPlan(input);
      setPlans((prev) => [newPlan, ...prev]);
    }
  };

  const handleArchivePlan = (planId: string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? archivePlan(p) : p))
    );
  };

  const handleCopyCheckoutLink = async (planId: string) => {
    const url = `${window.location.origin}/checkout?planId=${encodeURIComponent(planId)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyNotification(planId);
      setTimeout(() => setCopyNotification(null), 2500);
    } catch {
      // Fallback
    }
  };

  // Subscription Lifecycle Handlers
  const handleTogglePause = (sub: Subscription) => {
    if (sub.status === 'paused') {
      const updated = resumeSubscription(sub);
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    } else if (sub.status === 'active') {
      const updated = pauseSubscription(sub);
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
  };

  const handleCancelSub = (sub: Subscription) => {
    if (window.confirm(`Are you sure you want to cancel subscription ${sub.id}?`)) {
      const updated = cancelSubscription(sub);
      setSubscriptions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Subscriptions & Recurring Plans
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Automate recurring billing, schedule customer renewals, and manage subscription tiers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingPlan(null);
              setIsPlanModalOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
          >
            <span>+ Create Recurring Plan</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Monthly Recurring Revenue (MRR)
          </span>
          <div className="mt-2 text-2xl font-extrabold text-zinc-900 dark:text-white">
            ${mrr.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <small className="text-xs text-zinc-500 font-normal">USDC</small>
          </div>
          <span className="mt-1 block text-xs text-emerald-600 font-medium">
            Active annualized: ${(mrr * 12).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Active Subscribers
          </span>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {counts.active}
          </div>
          <span className="mt-1 block text-xs text-zinc-500">
            Across {plans.filter((p) => p.status === 'active').length} active billing plans
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Past Due Renewals
          </span>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400">
            {counts.pastDue}
          </div>
          <span className="mt-1 block text-xs text-zinc-500">
            Requires wallet balance top-up
          </span>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Paused / Cancelled
          </span>
          <div className="mt-2 text-2xl font-extrabold text-zinc-700 dark:text-zinc-300">
            {counts.paused + counts.cancelled}
          </div>
          <span className="mt-1 block text-xs text-zinc-500">
            {counts.paused} paused · {counts.cancelled} cancelled
          </span>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-zinc-200 dark:border-zinc-800">
        <nav className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'subscriptions'
                ? 'border-[#20a7ee] text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
            }`}
          >
            Subscribers ({subscriptions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('plans')}
            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'plans'
                ? 'border-[#20a7ee] text-zinc-900 dark:text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:text-zinc-400'
            }`}
          >
            Recurring Plans ({plans.length})
          </button>
        </nav>
      </div>

      {/* ================= TAB 1: SUBSCRIPTIONS ================= */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by customer, wallet, or plan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-semibold text-zinc-500">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="active">Active</option>
                <option value="past_due">Past Due</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-zinc-200 bg-zinc-50/80 uppercase tracking-wider text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                  <tr>
                    <th className="px-5 py-3.5">Subscription ID</th>
                    <th className="px-5 py-3.5">Customer</th>
                    <th className="px-5 py-3.5">Plan & Rate</th>
                    <th className="px-5 py-3.5">Next Charge</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredSubscriptions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                        No subscriptions found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscriptions.map((sub) => {
                      const isPaused = sub.status === 'paused';
                      const isCancelled = sub.status === 'cancelled';

                      return (
                        <tr key={sub.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-800/40">
                          <td className="px-5 py-4 font-mono font-semibold text-zinc-900 dark:text-white">
                            <Link href={`/subscriptions/${sub.id}`} className="hover:text-sky-600 hover:underline">
                              {sub.id}
                            </Link>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-zinc-900 dark:text-white">
                              {sub.customerEmail}
                            </div>
                            <div className="font-mono text-[11px] text-zinc-400 truncate max-w-[160px]" title={sub.customerWallet}>
                              {sub.customerWallet.slice(0, 8)}...{sub.customerWallet.slice(-6)}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-zinc-800 dark:text-zinc-200 block">
                              {sub.planName}
                            </span>
                            <span className="text-[11px] text-zinc-500">
                              {sub.amount.toFixed(2)} {sub.asset} / {sub.interval}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-mono text-zinc-700 dark:text-zinc-300">
                            {sub.nextChargeDate !== '—'
                              ? new Date(sub.nextChargeDate).toLocaleDateString()
                              : '—'}
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                                sub.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : sub.status === 'past_due'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : sub.status === 'paused'
                                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                  : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                              }`}
                            >
                              {sub.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right space-x-2">
                            <Link
                              href={`/subscriptions/${sub.id}`}
                              className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                            >
                              Details
                            </Link>
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleTogglePause(sub)}
                                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                                  isPaused
                                    ? 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300'
                                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300'
                                }`}
                              >
                                {isPaused ? 'Resume' : 'Pause'}
                              </button>
                            )}
                            {!isCancelled && (
                              <button
                                type="button"
                                onClick={() => handleCancelSub(sub)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
                              >
                                Cancel
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: RECURRING PLANS ================= */}
      {activeTab === 'plans' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const isArchived = plan.status === 'archived';

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 transition-all ${
                  isArchived
                    ? 'border-zinc-200 bg-zinc-50/80 opacity-60 dark:border-zinc-800 dark:bg-zinc-900/30'
                    : 'border-zinc-200 bg-white shadow-sm hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/60'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="mt-1 text-xs text-zinc-500 line-clamp-2 min-h-[32px]">
                      {plan.description || 'No description provided.'}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      isArchived
                        ? 'bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {plan.status}
                  </span>
                </div>

                <div className="mt-4 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-extrabold text-[#000F24] dark:text-white">
                      {plan.amount.toFixed(2)}
                    </span>
                    <span className="font-semibold text-xs text-zinc-600 dark:text-zinc-300">
                      {plan.asset} / {plan.interval}
                    </span>
                  </div>

                  <div className="mt-2 flex items-center gap-2 text-xs text-zinc-500">
                    <span>{plan.subscriberCount} active subscribers</span>
                    {plan.trialDays > 0 && (
                      <>
                        <span>•</span>
                        <span className="font-semibold text-sky-600 dark:text-sky-400">
                          {plan.trialDays}-day free trial
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Plan Card Actions */}
                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
                  {!isArchived && (
                    <button
                      type="button"
                      onClick={() => handleCopyCheckoutLink(plan.id)}
                      className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
                    >
                      {copyNotification === plan.id ? 'Copied Link!' : 'Copy Checkout Link'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPlan(plan);
                      setIsPlanModalOpen(true);
                    }}
                    className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Edit
                  </button>
                  {!isArchived && (
                    <button
                      type="button"
                      onClick={() => handleArchivePlan(plan.id)}
                      className="rounded-xl border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                    >
                      Archive
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Plan Modal */}
      <CreatePlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSavePlan={handleSavePlan}
        editingPlan={editingPlan}
      />
    </div>
  );
}
