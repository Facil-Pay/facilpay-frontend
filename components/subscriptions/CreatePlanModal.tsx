'use client';

import React, { useState, useEffect } from 'react';
import {
  SubscriptionPlan,
  CreatePlanInput,
  PlanInterval,
} from '@/lib/types/subscription';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePlan: (input: CreatePlanInput, editId?: string) => void;
  editingPlan?: SubscriptionPlan | null;
}

export default function CreatePlanModal({
  isOpen,
  onClose,
  onSavePlan,
  editingPlan,
}: CreatePlanModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('29.00');
  const [asset, setAsset] = useState<'USDC' | 'EURC' | 'XLM'>('USDC');
  const [interval, setInterval] = useState<PlanInterval>('monthly');
  const [trialDays, setTrialDays] = useState('0');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingPlan) {
      setName(editingPlan.name);
      setDescription(editingPlan.description || '');
      setAmount(editingPlan.amount.toString());
      setAsset(editingPlan.asset);
      setInterval(editingPlan.interval);
      setTrialDays(editingPlan.trialDays.toString());
    } else {
      setName('');
      setDescription('');
      setAmount('29.00');
      setAsset('USDC');
      setInterval('monthly');
      setTrialDays('0');
    }
    setError(null);
  }, [editingPlan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (!name.trim()) {
      setError('Please enter a plan name.');
      return;
    }
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }

    const numTrial = parseInt(trialDays, 10) || 0;

    onSavePlan(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        amount: numAmount,
        asset,
        interval,
        trialDays: numTrial,
      },
      editingPlan?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              {editingPlan ? 'Edit Recurring Plan' : 'Create Recurring Plan'}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Configure pricing, billing intervals, and trial periods for recurring subscriptions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Plan Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pro Professional Tier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="What features or services are included in this plan?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Recurring Amount *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Settlement Asset *
              </label>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as any)}
                disabled={!!editingPlan}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white disabled:opacity-60"
              >
                <option value="USDC">USDC (USD Coin)</option>
                <option value="EURC">EURC (Euro Coin)</option>
                <option value="XLM">XLM (Stellar Lumens)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Billing Interval *
              </label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value as PlanInterval)}
                disabled={!!editingPlan}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white disabled:opacity-60"
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly (Annual)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Free Trial Period (Days)
              </label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={trialDays}
                onChange={(e) => setTrialDays(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-2 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
            >
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
