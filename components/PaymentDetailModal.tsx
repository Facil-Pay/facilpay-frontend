'use client';

import React, { useState } from 'react';
import { Payment } from '@/lib/types';
import { downloadPaymentReceipt } from '@/lib/pdfReceipt';
import ReceiptPreviewModal from './ReceiptPreviewModal';

interface PaymentDetailModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function PaymentDetailModal({
  payment,
  isOpen,
  onClose,
}: PaymentDetailModalProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  if (!isOpen || !payment) return null;

  const stellarUrl =
    payment.stellarExpertUrl ||
    `https://stellar.expert/explorer/testnet/tx/${payment.txHash}`;

  const handleDownloadReceipt = () => {
    downloadPaymentReceipt(payment);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Payment Detail
                </h2>
                <p className="font-mono text-xs text-zinc-500">{payment.id}</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 space-y-6">
            {/* Top Action Ribbon with "Download Receipt" Button */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-sky-900 dark:text-sky-300">
                  Official Merchant Receipt
                </span>
                <p className="text-xs text-sky-700/80 dark:text-sky-400/80 mt-0.5">
                  Generate branded PDF receipt including merchant info and Stellar hash
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(true)}
                  className="rounded-xl border border-sky-200 bg-white px-3.5 py-2 text-xs font-semibold text-sky-700 shadow-sm hover:bg-sky-50 dark:border-sky-800 dark:bg-zinc-900 dark:text-sky-300"
                >
                  Preview Receipt
                </button>
                <button
                  type="button"
                  id="download-receipt-button"
                  onClick={handleDownloadReceipt}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors dark:bg-[#55C2FF] dark:text-black dark:hover:bg-[#A5D4FF]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Receipt
                </button>
              </div>
            </div>

            {/* Amount Banner */}
            <div className="flex items-center justify-between rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800/50">
              <div>
                <span className="text-xs text-zinc-500 font-medium">Payment Amount</span>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white mt-0.5">
                  {payment.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}{' '}
                  <span className="text-lg text-sky-600 dark:text-sky-400">
                    {payment.asset}
                  </span>
                </div>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
                  payment.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : payment.status === 'PENDING'
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                {payment.status}
              </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-medium">Date (ISO 8601)</span>
                <p className="font-mono text-zinc-900 dark:text-white break-all">
                  {payment.date}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-medium">Customer Email</span>
                <p className="font-semibold text-zinc-900 dark:text-white truncate">
                  {payment.customerEmail}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800 space-y-1 sm:col-span-2">
                <span className="text-zinc-500 font-medium">Customer Stellar Wallet</span>
                <p className="font-mono text-zinc-900 dark:text-white break-all">
                  {payment.customerWallet}
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-medium">Merchant Account</span>
                <p className="font-semibold text-zinc-900 dark:text-white">
                  {payment.merchantName} ({payment.merchantId})
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800 space-y-1">
                <span className="text-zinc-500 font-medium">Network Fee</span>
                <p className="font-medium text-zinc-900 dark:text-white">
                  {payment.fee} XLM
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 p-3.5 dark:border-zinc-800 space-y-1 sm:col-span-2">
                <span className="text-zinc-500 font-medium">Description</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {payment.description}
                </p>
              </div>

              {payment.sourceAsset && (
                <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3.5 dark:border-sky-900/50 dark:bg-sky-950/20 space-y-1 sm:col-span-2">
                  <span className="text-xs font-semibold text-sky-800 dark:text-sky-300">
                    Stellar Path Payment Details
                  </span>
                  <div className="text-xs text-zinc-700 dark:text-zinc-300 flex flex-wrap items-center gap-2">
                    <span>Paid with:</span>
                    <span className="font-mono font-semibold">
                      {payment.sourceAmount ? `${payment.sourceAmount} ` : ''}{payment.sourceAsset}
                    </span>
                    <span>→ Settled in:</span>
                    <span className="font-mono font-semibold">
                      {payment.amount} {payment.asset}
                    </span>
                  </div>
                  {payment.path && payment.path.length > 0 && (
                    <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 pt-1">
                      Path: {payment.sourceAsset} → {payment.path.join(' → ')} → {payment.asset}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Stellar Blockchain Verification */}
            <div className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-2">
              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Stellar Transaction Verification
              </span>
              <div className="space-y-1">
                <span className="text-[11px] text-zinc-500 block">Transaction Hash</span>
                <p className="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all bg-white p-2 rounded border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700">
                  {payment.txHash}
                </p>
              </div>

              <div className="pt-1">
                <a
                  href={stellarUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                >
                  <span>View on Stellar Expert Explorer</span>
                  <svg
                    className="h-3.5 w-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Printable Receipt Preview Modal */}
      <ReceiptPreviewModal
        payment={payment}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
