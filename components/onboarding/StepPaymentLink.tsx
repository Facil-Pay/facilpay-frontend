'use client';

import React, { useState, useEffect, useId } from 'react';
import { PaymentLinkData, BrandingDetails } from '@/types/onboarding';
import { generateQRSvg } from '@/lib/qr';
import { toDecimalString } from '@/lib/i18n/format';

interface StepPaymentLinkProps {
  branding: BrandingDetails;
  initialData: PaymentLinkData;
  onNext: (data: PaymentLinkData) => void;
  onBack: () => void;
}

export default function StepPaymentLink({
  branding,
  initialData,
  onNext,
  onBack,
}: StepPaymentLinkProps) {
  const [title, setTitle] = useState(initialData.title || 'First Test Order');
  const [amount, setAmount] = useState(initialData.amount || '10.00');
  const [currency, setCurrency] = useState<'USDC' | 'EURC' | 'XLM'>(
    initialData.currency || 'USDC'
  );
  const [description, setDescription] = useState(
    initialData.description || 'Test payment link created during FacilPay merchant onboarding'
  );

  const [paymentData, setPaymentData] = useState<PaymentLinkData | null>(
    initialData.id ? initialData : null
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const fallbackId = useId();

  // Generate / update payment link
  const generateLink = (customId?: string) => {
    const errs: Record<string, string> = {};
    if (!title.trim()) errs.title = 'Payment title is required';
    if (!amount || parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      errs.amount = 'Please enter a valid amount greater than 0';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) return null;

    const linkId = customId || `pl_test_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}`;
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://pay.facilpay.io';
    const payUrl = `${origin}/pay/${linkId}`;

    const newPaymentLink: PaymentLinkData = {
      id: linkId,
      title: title.trim(),
      amount: toDecimalString(amount, 2),
      currency,
      description: description.trim(),
      paymentUrl: payUrl,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    setPaymentData(newPaymentLink);

    // Generate QR code SVG
    const svg = generateQRSvg(payUrl, {
      size: 180,
      margin: 2,
      fgColor: '#000000',
      bgColor: '#ffffff',
    });
    setQrSvg(svg);

    return newPaymentLink;
  };

  useEffect(() => {
    // Generate initial link if not generated
    if (!paymentData) {
      generateLink(`pl_test_init_${fallbackId.replace(/:/g, '')}`);
    } else {
      const svg = generateQRSvg(paymentData.paymentUrl, {
        size: 180,
        margin: 2,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });
      setQrSvg(svg);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCopyLink = () => {
    if (!paymentData) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(paymentData.paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const link = generateLink(paymentData?.id);
    if (link) {
      onNext(link);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
          Create Your First Payment Link
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Generate an instant test payment link and dynamic QR code to experience customer checkout firsthand.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Details */}
        <div className="lg:col-span-7 space-y-4">
          {/* Link Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Payment Link Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Test Coffee & Pastry"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
              }}
              className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none dark:bg-zinc-900 dark:text-white ${
                errors.title
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-rose-600'
                  : 'border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700'
              }`}
            />
            {errors.title && <p className="mt-1 text-xs text-rose-500">{errors.title}</p>}
          </div>

          {/* Amount & Currency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Amount <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="10.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors((prev) => ({ ...prev, amount: '' }));
                  }}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm font-mono transition-all focus:outline-none dark:bg-zinc-900 dark:text-white ${
                    errors.amount
                      ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 dark:border-rose-600'
                      : 'border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700'
                  }`}
                />
              </div>
              {errors.amount && <p className="mt-1 text-xs text-rose-500">{errors.amount}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Currency <span className="text-rose-500">*</span>
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as 'USDC' | 'EURC' | 'XLM')}
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm transition-all focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
              >
                <option value="USDC">USDC (USD Coin)</option>
                <option value="EURC">EURC (Euro Coin)</option>
                <option value="XLM">XLM (Stellar Lumens)</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Thank you for your support!"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-sm transition-all focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Refresh / Update Link Button */}
          <button
            type="button"
            onClick={() => generateLink()}
            className="flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Update Payment Link & QR</span>
          </button>
        </div>

        {/* Right Column: Live Payment Link Card & QR Code */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-zinc-200/90 bg-zinc-50/60 p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
              Generated Checkout Link & QR
            </span>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 shadow-sm">
              {qrSvg ? (
                <div
                  className="rounded-lg overflow-hidden border border-zinc-100 dark:border-zinc-800"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="h-44 w-44 flex items-center justify-center bg-zinc-100 rounded-lg text-xs text-zinc-400">
                  Generating QR...
                </div>
              )}

              <span className="text-[11px] text-zinc-400 mt-2 font-mono">
                Scan with any Stellar / QR wallet
              </span>
            </div>

            {/* Payment URL Pill */}
            {paymentData && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2.5 dark:border-zinc-800 dark:bg-zinc-950">
                  <input
                    type="text"
                    readOnly
                    value={paymentData.paymentUrl}
                    className="w-full bg-transparent font-mono text-xs text-zinc-700 dark:text-zinc-300 focus:outline-none truncate"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 transition-colors cursor-pointer"
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-zinc-500 px-1">
                  <span>Price: <strong className="text-zinc-800 dark:text-zinc-200">${amount} {currency}</strong></span>
                  <span className="inline-flex items-center gap-1 text-emerald-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Ready to Test
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span>Back</span>
        </button>

        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
        >
          <span>Next: Review & Summary</span>
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </form>
  );
}
