'use client';

import React, { useState } from 'react';
import { AssetType, SavedDestination } from '@/lib/types';
import {
  PayoutSchedule,
  ScheduleFrequency,
  WEEKDAY_LABELS,
  addSchedule,
  deleteSchedule,
  pauseSchedule,
  resumeSchedule,
  usePayoutSchedules,
} from '@/lib/payout-schedules';
import { useStepUp } from '@/components/security/use-step-up';
import { useFormat } from '@/lib/i18n/use-format';

interface ScheduledPayoutsCardProps {
  savedDestinations: SavedDestination[];
}

export default function ScheduledPayoutsCard({ savedDestinations }: ScheduledPayoutsCardProps) {
  const f = useFormat();
  const schedules = usePayoutSchedules();
  const { requestStepUp, stepUpDialog } = useStepUp();
  const [isFormOpen, setIsFormOpen] = useState(false);

  const [destinationId, setDestinationId] = useState('');
  const [asset, setAsset] = useState<AssetType>('USDC');
  const [frequency, setFrequency] = useState<ScheduleFrequency>('monthly');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [minBalanceToKeep, setMinBalanceToKeep] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setDestinationId('');
    setAsset('USDC');
    setFrequency('monthly');
    setDayOfWeek(1);
    setDayOfMonth(1);
    setMinBalanceToKeep('0');
    setError(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const destination = savedDestinations.find((d) => d.id === destinationId);
    if (!destination) {
      setError('Pick a saved destination for this schedule.');
      return;
    }

    setIsSubmitting(true);
    try {
      const grant = await requestStepUp('create_payout_schedule');
      if (!grant) {
        setIsSubmitting(false);
        return;
      }
    } catch (err) {
      setIsSubmitting(false);
      setError(err instanceof Error ? err.message : 'Could not verify two-factor authentication.');
      return;
    }

    addSchedule({
      destinationId: destination.id,
      destinationLabel: destination.label,
      asset,
      frequency,
      dayOfWeek: frequency === 'weekly' ? dayOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      minBalanceToKeep: Math.max(0, parseFloat(minBalanceToKeep) || 0),
    });

    setIsSubmitting(false);
    setIsFormOpen(false);
    resetForm();
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Scheduled Automatic Payouts</h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Automatically send recurring payouts to a saved destination instead of triggering them manually.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          {isFormOpen ? 'Cancel' : 'New Schedule'}
        </button>
      </div>

      {isFormOpen && (
        <form onSubmit={handleCreate} className="mt-4 space-y-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Destination *</label>
              <select
                required
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="">Select a saved destination</option>
                {savedDestinations.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Asset *</label>
              <select
                value={asset}
                onChange={(e) => setAsset(e.target.value as AssetType)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
                <option value="EURC">EURC</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Frequency *</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ScheduleFrequency)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            {frequency === 'weekly' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Day of week</label>
                <select
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                >
                  {WEEKDAY_LABELS.map((label, idx) => (
                    <option key={idx} value={idx}>{label}</option>
                  ))}
                </select>
              </div>
            )}

            {frequency === 'monthly' && (
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Day of month</label>
                <input
                  type="number"
                  min={1}
                  max={28}
                  value={dayOfMonth}
                  onChange={(e) => setDayOfMonth(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Minimum balance to keep</label>
              <input
                type="number"
                min={0}
                step="any"
                value={minBalanceToKeep}
                onChange={(e) => setMinBalanceToKeep(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <p className="mt-1 text-[11px] text-zinc-500">The schedule skips a run rather than drop the balance below this amount.</p>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#000F24] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 disabled:opacity-60 dark:bg-[#55C2FF] dark:text-black"
            >
              {isSubmitting ? 'Confirming...' : 'Create Schedule'}
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-2.5">
        {schedules.length === 0 ? (
          <p className="text-xs text-zinc-500">No scheduled payouts yet.</p>
        ) : (
          schedules.map((s: PayoutSchedule) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-900/60"
            >
              <div className="text-xs">
                <div className="font-semibold text-zinc-900 dark:text-white">
                  {s.destinationLabel} · {s.asset}
                </div>
                <div className="text-zinc-500">
                  {s.frequency === 'weekly' && `Every ${WEEKDAY_LABELS[s.dayOfWeek ?? 1]}`}
                  {s.frequency === 'monthly' && `Monthly on day ${s.dayOfMonth}`}
                  {s.frequency === 'daily' && 'Every day'}
                  {' · '}Min balance to keep: {f.amount(s.minBalanceToKeep, s.asset, { withCode: false })}
                </div>
                <div className="text-zinc-400">
                  {s.status === 'active'
                    ? `Next payout: ${new Date(s.nextRunAt).toLocaleString()}`
                    : 'Paused'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    s.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {s.status}
                </span>
                {s.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => pauseSchedule(s.id)}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => resumeSchedule(s.id)}
                    className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
                  >
                    Resume
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => deleteSchedule(s.id)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                  title="Delete schedule"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      {stepUpDialog}
    </div>
  );
}
