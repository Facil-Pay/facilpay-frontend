'use client';

import React, { useState } from 'react';
import { Payment } from '@/lib/types';
import { downloadPaymentReceipt, printPaymentReceipt } from '@/lib/pdfReceipt';
import { useFormat } from '@/lib/i18n/use-format';

interface ReceiptPreviewModalProps {
  payment: Payment | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReceiptPreviewModal({
  payment,
  isOpen,
  onClose,
}: ReceiptPreviewModalProps) {
  const f = useFormat();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !payment) return null;

  const stellarUrl =
    payment.stellarExpertUrl ||
    `https://stellar.expert/explorer/testnet/tx/${payment.txHash}`;

  const handleCopyHash = async () => {
    try {
      await navigator.clipboard.writeText(payment.txHash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:fixed">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800 print:border-none print:shadow-none print:max-w-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800 print:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Receipt Preview & PDF Generator
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => printPaymentReceipt()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Print
            </button>
            <button
              onClick={() => downloadPaymentReceipt(payment)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#000F24] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* The Printable Receipt Document Container */}
        <div id="facilpay-receipt-content" className="p-8 space-y-6 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
          {/* Brand Header */}
          <div className="rounded-xl bg-[#000F24] p-6 text-white shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 p-1.5">
                  <svg viewBox="0 0 128 128" fill="none" className="h-full w-full">
                    <path
                      d="M90.6 46L94.7 38.9C95.1 38.2 94.6 37.4 93.8 37.4H53.7C53.4 37.4 53 37.5 52.9 37.9L31.5 74.9C31.3 75.2 31.3 75.6 31.5 75.9L35.7 83.1C36 83.8 37 83.8 37.4 83.1L58.2 47C58.4 46.7 58.7 46.5 59.1 46.5H89.7C90.1 46.5 90.4 46.3 90.6 46Z"
                      fill="#55C2FF"
                    />
                    <path
                      d="M62.4 54.1L58.3 61.2C57.9 61.8 58.4 62.7 59.1 62.7H76.9C77.6 62.8 78.1 63.6 77.7 64.3L73.5 71.4C73.4 71.7 73 71.9 72.7 71.9H52.7C52.3 71.9 52 72.1 51.8 72.4L41 91.1C40.8 91.4 40.8 91.7 41 92.1L45.2 99.3C45.5 100 46.5 100 46.9 99.3L57.1 81.6C57.3 81.3 57.6 81.1 58 81.1H78C78.4 81.1 78.7 80.9 78.9 80.6L93.6 55.1C94 54.4 93.5 53.6 92.8 53.6H63.3C62.9 53.6 62.6 53.7 62.4 54.1Z"
                      fill="#A5D4FF"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold tracking-tight">
                    Facil<span className="text-[#55C2FF]">Pay</span>
                  </h1>
                  <p className="text-[10px] font-semibold tracking-wider text-[#A5D4FF] uppercase">
                    Official Payment Receipt
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="block text-xs font-semibold text-zinc-100">
                  {payment.merchantName}
                </span>
                <span className="block text-[11px] text-zinc-400">
                  {payment.merchantEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Amount Summary Card */}
          <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Amount Paid
                </span>
                <div className="text-3xl font-extrabold text-[#000F24] dark:text-white mt-0.5">
                  {f.amount(payment.amount, payment.asset, { withCode: false })}{' '}
                  <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                    {payment.asset}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${
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
            </div>
          </div>

          {/* Transaction Metadata Grid */}
          <div className="space-y-4">
            <div className="border-b border-zinc-200 pb-2 dark:border-zinc-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Payment Information
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-zinc-500 block">Payment ID</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                  {payment.id}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Date & Time (UTC)</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {new Date(payment.date).toUTCString()}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Settlement Asset</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {payment.asset} (Stellar Network)
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Network Fee</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {payment.fee} XLM
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Customer Email</span>
                <span className="font-medium text-zinc-900 dark:text-white truncate block">
                  {payment.customerEmail}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block">Memo</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {payment.memo || 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs text-zinc-500 block">Description</span>
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                {payment.description}
              </p>
            </div>
          </div>

          {/* Blockchain Verification & Stellar Expert Link */}
          <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900/60 dark:bg-sky-950/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-sky-950 dark:text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
                <svg className="h-4 w-4 text-sky-600 dark:text-sky-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Blockchain Verification on Stellar
              </h4>
              <button
                type="button"
                onClick={handleCopyHash}
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-400 print:hidden"
              >
                {copied ? 'Copied!' : 'Copy Hash'}
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] text-zinc-500 block">Transaction Hash</span>
              <p className="font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all select-all bg-white/70 p-1.5 rounded border border-sky-100 dark:bg-zinc-900 dark:border-sky-900">
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
                <span>View Transaction on Stellar Expert</span>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Footer Security Notice */}
          <div className="border-t border-zinc-200 pt-4 text-[11px] text-zinc-400 dark:border-zinc-800 text-center">
            <p>
              Generated by FacilPay Payment Facilitation Network.
            </p>
            <p className="mt-0.5">
              Immutable receipt verifiable on the Stellar distributed ledger.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
