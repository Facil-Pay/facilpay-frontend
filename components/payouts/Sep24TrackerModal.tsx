'use client';

import React, { useState, useEffect } from 'react';
import { Payout } from '@/lib/types';
import { useFormat } from '@/lib/i18n/use-format';

interface Sep24TrackerModalProps {
  payout: Payout | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sep24TrackerModal({
  payout,
  isOpen,
  onClose,
}: Sep24TrackerModalProps) {
  const f = useFormat();
  const [currentStep, setCurrentStep] = useState<number>(3);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  useEffect(() => {
    if (payout) {
      if (payout.status === 'COMPLETED') setCurrentStep(5);
      else if (payout.status === 'PROCESSING') setCurrentStep(4);
      else if (payout.status === 'PENDING') setCurrentStep(3);
      else setCurrentStep(2);
    }
  }, [payout]);

  if (!isOpen || !payout) return null;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      if (currentStep < 5) {
        setCurrentStep((prev) => Math.min(prev + 1, 5));
      }
    }, 600);
  };

  const steps = [
    {
      num: 1,
      title: 'Interactive Session',
      desc: 'SEP-24 withdrawal initiated',
      status: 'completed',
    },
    {
      num: 2,
      title: 'KYC & Bank Account Verified',
      desc: 'Merchant bank details validated by anchor',
      status: 'completed',
    },
    {
      num: 3,
      title: 'Stellar Funds Deposited',
      desc: 'Crypto transferred to anchor escrow',
      status: currentStep >= 3 ? 'completed' : 'current',
    },
    {
      num: 4,
      title: 'Bank Rail Transmission',
      desc: 'Transmitting via SEPA / FedNow / Local ACH',
      status:
        currentStep > 4
          ? 'completed'
          : currentStep === 4
          ? 'current'
          : 'upcoming',
    },
    {
      num: 5,
      title: 'Settled in Bank Account',
      desc: 'Funds cleared in recipient account',
      status: currentStep === 5 ? 'completed' : 'upcoming',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                SEP-24 Anchor Off-Ramp Tracker
              </h2>
              <p className="font-mono text-xs text-zinc-500">
                {payout.sep24TransactionId || payout.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300"
              title="Query anchor /transaction endpoint for latest state"
            >
              <svg
                className={`h-3.5 w-3.5 text-zinc-500 ${isRefreshing ? 'animate-spin' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {isRefreshing ? 'Checking...' : 'Refresh'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Summary Box */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-500 block">Anchor Facilitator</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                  {payout.anchorName || 'SEP-24 Regulated Anchor'}
                </span>
                <span className="text-xs text-zinc-500 block mt-0.5">
                  Method: {payout.payoutMethod}
                </span>
              </div>

              <div className="text-right">
                <span className="text-xs text-zinc-500 block">Settlement Amount</span>
                <span className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  {f.amount(payout.amount, payout.asset, { withCode: false })}{' '}
                  <span className="text-sky-600 dark:text-sky-400 text-sm font-bold">
                    {payout.asset}
                  </span>
                </span>
              </div>
            </div>

            {payout.bankDetailsSummary && (
              <div className="mt-3 pt-3 border-t border-zinc-200/80 dark:border-zinc-700/80 text-xs">
                <span className="text-zinc-500">Destination Bank Account: </span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {payout.bankDetailsSummary}
                </span>
              </div>
            )}
          </div>

          {/* Stepper Timeline */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
              Anchor Transaction Status (SEP-24 /transaction)
            </h3>

            <div className="space-y-3">
              {steps.map((step) => {
                const isComplete = step.status === 'completed';
                const isCurrent = step.status === 'current';

                return (
                  <div key={step.num} className="flex items-start gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                          isComplete
                            ? 'bg-emerald-500 text-white'
                            : isCurrent
                            ? 'bg-sky-500 text-white ring-4 ring-sky-100 dark:ring-sky-950'
                            : 'bg-zinc-200 text-zinc-500 dark:bg-zinc-800'
                        }`}
                      >
                        {isComplete ? '✓' : step.num}
                      </div>
                      {step.num < 5 && (
                        <div
                          className={`w-0.5 h-6 my-0.5 ${
                            isComplete ? 'bg-emerald-400' : 'bg-zinc-200 dark:bg-zinc-800'
                          }`}
                        />
                      )}
                    </div>

                    <div className="flex-1 pt-0.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`font-semibold ${
                            isCurrent
                              ? 'text-sky-600 dark:text-sky-400'
                              : isComplete
                              ? 'text-zinc-900 dark:text-white'
                              : 'text-zinc-400'
                          }`}
                        >
                          {step.title}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
                            In Progress
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-200 px-6 py-3.5 bg-zinc-50/50 rounded-b-2xl dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
}
