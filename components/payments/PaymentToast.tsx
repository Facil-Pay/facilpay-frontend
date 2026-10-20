'use client';

import React, { useState, useEffect } from 'react';
import { usePaymentStream } from '@/lib/payment-stream-context';
import { PaymentItem } from '@/lib/types';
import { truncateAddress } from '@/lib/stellar';

export default function PaymentToast() {
  const { latestPayment } = usePaymentStream();
  const [activeToast, setActiveToast] = useState<PaymentItem | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!latestPayment) return;

    setActiveToast(latestPayment);
    setIsVisible(true);

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, [latestPayment]);

  if (!activeToast || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm animate-bounce sm:animate-none sm:transition-all">
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-300 bg-white/95 p-4 shadow-xl shadow-emerald-500/10 backdrop-blur-md dark:border-emerald-800 dark:bg-zinc-950/95">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-lg dark:bg-emerald-950/80">
          💰
        </div>

        <div className="flex-1 pr-2">
          <div className="text-xs font-bold text-zinc-900 dark:text-white">
            Received {activeToast.amount} {activeToast.asset_code}
          </div>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono mt-0.5">
            from {truncateAddress(activeToast.from, 4)}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Settled on Stellar Testnet</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsVisible(false)}
          className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 transition-colors"
          title="Dismiss notification"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
