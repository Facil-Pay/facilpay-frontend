'use client';

import React, { useState } from 'react';
import { PaymentLinkData } from '@/types/onboarding';

interface ReceivePaymentModalProps {
  isOpen: boolean;
  paymentLink?: PaymentLinkData;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReceivePaymentModal({
  isOpen,
  paymentLink,
  onClose,
  onSuccess,
}: ReceivePaymentModalProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [isReceived, setIsReceived] = useState(false);
  const [txHash, setTxHash] = useState<string>('');

  if (!isOpen) return null;

  const handleSimulatePayment = () => {
    setIsSimulating(true);

    setTimeout(() => {
      const hash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setTxHash(hash);
      setIsSimulating(false);
      setIsReceived(true);
      onSuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Receive Your First Payment
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {!isReceived ? (
          <div className="mt-4 space-y-4">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Test customer checkout on Stellar Testnet. You can simulate an incoming payment of{' '}
              <strong className="text-zinc-900 dark:text-white">
                ${paymentLink?.amount || '10.00'} {paymentLink?.currency || 'USDC'}
              </strong>{' '}
              directly to verify webhook triggers and non-custodial wallet settlement.
            </p>

            <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Payment Order:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                  {paymentLink?.title || 'First Test Order'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Amount & Currency:</span>
                <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                  ${paymentLink?.amount || '10.00'} {paymentLink?.currency || 'USDC'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Status:</span>
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Awaiting Test Settlement
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isSimulating}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 cursor-pointer"
              >
                {isSimulating ? (
                  <>
                    <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Simulating Settlement...</span>
                  </>
                ) : (
                  <>
                    <span>Simulate Incoming Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl mx-auto">
              ✓
            </div>
            <div>
              <h4 className="text-base font-bold text-zinc-900 dark:text-white">
                Payment Confirmed on Stellar!
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                ${paymentLink?.amount || '10.00'} {paymentLink?.currency || 'USDC'} has settled directly into your non-custodial wallet.
              </p>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-left border border-zinc-200 dark:border-zinc-800">
              <span className="text-[10px] uppercase font-semibold text-zinc-400 block mb-1">
                Transaction Hash
              </span>
              <p className="font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all">
                {txHash}
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 cursor-pointer"
              >
                Close & View on Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
