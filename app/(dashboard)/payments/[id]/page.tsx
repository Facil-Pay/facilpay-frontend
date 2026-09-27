'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import ReceiptPreviewModal from '@/components/ReceiptPreviewModal';
import { Payment } from '@/lib/types';
import { INITIAL_PAYMENTS } from '@/lib/mockData';
import { downloadPaymentReceipt } from '@/lib/pdfReceipt';

interface PaymentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  const resolvedParams =
    params && typeof (params as any).then === 'function'
      ? use(params)
      : (params as any);
  const paymentId = resolvedParams?.id || '';

  const [payment, setPayment] = useState<Payment | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    const found = INITIAL_PAYMENTS.find((p) => p.id === paymentId);
    if (found) {
      setPayment(found);
    } else {
      // Fallback dynamic payment if testing with arbitrary ID
      setPayment({
        id: paymentId,
        date: new Date().toISOString(),
        amount: 1250.0,
        asset: 'USDC',
        status: 'COMPLETED',
        customerEmail: 'customer@example.com',
        customerWallet: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
        merchantId: 'merch_facilpay_01',
        merchantName: 'FacilPay Global Merchant Ltd',
        merchantEmail: 'billing@facilpay.io',
        txHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        stellarExpertUrl: `https://stellar.expert/explorer/testnet/tx/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`,
        fee: 0.00001,
        description: 'Payment facilitation transaction',
        memo: `MEMO-${paymentId}`,
      });
    }
  }, [paymentId]);

  if (!payment) {
    return (
      <>
        <div className="py-12 text-center text-zinc-500">Loading payment details...</div>
      </>
    );
  }

  const stellarUrl =
    payment.stellarExpertUrl ||
    `https://stellar.expert/explorer/testnet/tx/${payment.txHash}`;

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/payments" className="hover:text-zinc-900 dark:hover:text-white">
            Payments
          </Link>
          <span>/</span>
          <span className="font-mono text-zinc-900 dark:text-white">{payment.id}</span>
        </div>

        {/* Header with Title and "Download Receipt" Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Payment Detail
            </h1>
            <p className="font-mono text-xs text-zinc-500 mt-1">{payment.id}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Preview Receipt
            </button>
            <button
              type="button"
              id="download-receipt-button"
              onClick={() => downloadPaymentReceipt(payment)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 transition-colors dark:bg-[#55C2FF] dark:text-black dark:hover:bg-[#A5D4FF]"
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
              Download Receipt (PDF)
            </button>
          </div>
        </div>

        {/* Amount & Status Hero Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                Payment Amount
              </span>
              <div className="text-3xl font-extrabold text-[#000F24] dark:text-white mt-1">
                {payment.amount.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}{' '}
                <span className="text-xl font-bold text-sky-600 dark:text-sky-400">
                  {payment.asset}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${
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

        {/* Payment & Merchant Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transaction Metadata */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Payment Information
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Payment ID</span>
                <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                  {payment.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Date (ISO 8601)</span>
                <span className="font-mono text-zinc-900 dark:text-white">
                  {payment.date}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Asset & Network</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {payment.asset} on Stellar Network
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Network Fee</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {payment.fee} XLM
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500">Memo</span>
                <span className="font-medium text-zinc-900 dark:text-white">
                  {payment.memo || 'None'}
                </span>
              </div>
              <div className="pt-1">
                <span className="text-zinc-500 block mb-1">Description</span>
                <p className="font-medium text-zinc-800 dark:text-zinc-200">
                  {payment.description}
                </p>
              </div>
            </div>
          </div>

          {/* Customer & Merchant Information */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
              Parties
            </h2>
            <div className="space-y-3 text-xs">
              <div className="py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 block">Merchant Name</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {payment.merchantName}
                </span>
              </div>
              <div className="py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 block">Merchant Email & ID</span>
                <span className="text-zinc-900 dark:text-white">
                  {payment.merchantEmail} ({payment.merchantId})
                </span>
              </div>
              <div className="py-1 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-zinc-500 block">Customer Email</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {payment.customerEmail}
                </span>
              </div>
              <div className="py-1">
                <span className="text-zinc-500 block">Customer Stellar Address</span>
                <p className="font-mono text-xs text-zinc-800 dark:text-zinc-300 break-all select-all mt-0.5">
                  {payment.customerWallet}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Blockchain Verification Box with Stellar Expert Link */}
        <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-6 dark:border-sky-900/50 dark:bg-sky-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-sky-950 dark:text-sky-200 flex items-center gap-2">
              <svg
                className="h-4 w-4 text-sky-600 dark:text-sky-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Stellar Blockchain Ledger Record
            </h3>
            <span className="rounded-full bg-sky-200/60 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800 dark:bg-sky-900 dark:text-sky-300">
              Verified
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-zinc-500 font-medium">Transaction Hash</span>
            <p className="font-mono text-xs text-zinc-900 dark:text-white break-all select-all bg-white p-2.5 rounded-xl border border-sky-100 dark:bg-zinc-900 dark:border-sky-900">
              {payment.txHash}
            </p>
          </div>

          <div className="pt-2 flex items-center gap-4">
            <a
              href={stellarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 transition-colors"
            >
              <span>Explore on Stellar Expert</span>
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

      {/* Printable Receipt Preview Modal */}
      <ReceiptPreviewModal
        payment={payment}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
