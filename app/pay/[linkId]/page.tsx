'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getOnboardingState } from '@/lib/storage';
import { OnboardingState } from '@/types/onboarding';
import { generateQRSvg } from '@/lib/qr';
import { truncateAddress } from '@/lib/stellar';
import { findStrictReceiveQuote, StrictReceiveQuote } from '@/lib/stellar/horizon';
import { formatTaxLabel, toAssetAmountString } from '@/lib/tax';

const AVAILABLE_PAY_ASSETS = ['USDC', 'XLM', 'EURC'] as const;

/** Returns true if the link has passed its expiry date. */
function isExpired(expiresAt?: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= Date.now();
}

/** Returns true if the link has reached its usage cap. */
function isSoldOut(maxUses?: number | null, useCount?: number): boolean {
  if (maxUses == null) return false;
  return (useCount ?? 0) >= maxUses;
}

export default function HostedPayPage() {
  const params = useParams();
  const linkId = params?.linkId as string;

  const [onboarding, setOnboarding] = useState<OnboardingState | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');

  // Path payments state
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC');
  const [quote, setQuote] = useState<StrictReceiveQuote | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [quoteExpired, setQuoteExpired] = useState<boolean>(false);

  // Coupon / discount state (#110)
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number; finalAmount: number } | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Custom checkout fields (#125)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Configured fields — in a full implementation these would come from the API
  const customFields = [
    { id: 'field_email', type: 'email' as const, label: 'Email address', placeholder: 'you@example.com', required: true },
    { id: 'field_phone', type: 'phone' as const, label: 'Phone number', placeholder: '+1 555 000 0000', required: false },
  ];

  const business = onboarding?.business;
  const branding = onboarding?.branding;
  const paymentLink = onboarding?.paymentLink;
  const settlement = onboarding?.settlement;

  const brandColor = branding?.brandColor || '#55C2FF';
  const logoUrl = branding?.logoUrl;
  const title = paymentLink?.title || 'Test Payment';
  const targetAmount = paymentLink?.amount || '10.00';
  const settlementCurrency = paymentLink?.currency || 'USDC';
  // Links created without a tax rate have no `tax` and render as before.
  const tax = paymentLink?.tax;

  const isPathPayment = selectedAsset !== settlementCurrency;

  // Derived link-access guards (#109)
  const linkExpired = isExpired(paymentLink?.expiresAt);
  const linkSoldOut = isSoldOut(paymentLink?.maxUses, paymentLink?.useCount);
  const isBlocked = linkExpired || linkSoldOut;
  const usesRemaining =
    paymentLink?.maxUses != null
      ? paymentLink.maxUses - (paymentLink.useCount ?? 0)
      : null;

  const fetchQuote = useCallback(async () => {
    if (!isPathPayment) {
      setQuote(null);
      setQuoteExpired(false);
      return;
    }

    setIsLoadingQuote(true);
    setQuoteExpired(false);
    try {
      const q = await findStrictReceiveQuote({
        sourceAsset: selectedAsset,
        destinationAsset: settlementCurrency,
        destinationAmount: targetAmount,
        slippagePercent: 1.0,
      });
      setQuote(q);
      setSecondsRemaining(30);
    } catch {
      // ignore
    } finally {
      setIsLoadingQuote(false);
    }
  }, [isPathPayment, selectedAsset, settlementCurrency, targetAmount]);

  useEffect(() => {
    const data = getOnboardingState();
    setOnboarding(data);

    if (typeof window !== 'undefined') {
      const svg = generateQRSvg(window.location.href, {
        size: 160,
        margin: 2,
        fgColor: '#000000',
        bgColor: '#ffffff',
      });
      setQrSvg(svg);
    }
  }, []);

  // Fetch quote whenever selected asset changes
  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  // Countdown timer for quote expiry (30s refresh)
  useEffect(() => {
    if (!isPathPayment || !quote) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          setQuoteExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPathPayment, quote]);

  // Apply coupon code (#110)
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError('');
    // Simulate API call to POST /coupons/validate
    await new Promise((r) => setTimeout(r, 400));
    const code = couponCode.trim().toUpperCase();
    const amount = parseFloat(targetAmount);
    // Hardcoded fixture validation matching MSW handlers
    if (code === 'LAUNCH20') {
      const discount = Math.round(amount * 0.2 * 100) / 100;
      setAppliedCoupon({ code, discountAmount: discount, finalAmount: Math.round((amount - discount) * 100) / 100 });
    } else if (code === 'SAVE5') {
      const discount = Math.min(amount, 5);
      setAppliedCoupon({ code, discountAmount: discount, finalAmount: Math.round((amount - discount) * 100) / 100 });
    } else if (code === 'OLDPROMO') {
      setCouponError('This coupon has expired.');
    } else {
      setCouponError('Coupon code not found.');
    }
    setIsValidatingCoupon(false);
  };

  const handlePay = () => {
    // Validate required custom fields (#125)
    const errs: Record<string, string> = {};
    for (const f of customFields) {
      if (f.required && !fieldValues[f.id]?.trim()) {
        errs[f.id] = `${f.label} is required`;
      } else if (f.type === 'email' && fieldValues[f.id] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValues[f.id])) {
        errs[f.id] = 'Enter a valid email address';
      } else if (f.type === 'phone' && fieldValues[f.id] && !/^\+?[\d\s\-().]{7,}$/.test(fieldValues[f.id])) {
        errs[f.id] = 'Enter a valid phone number';
      }
    }
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    if (isPathPayment && quoteExpired) {
      // Expired quotes cannot be submitted
      fetchQuote();
      return;
    }

    setIsPaying(true);
    setTimeout(() => {
      const hash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join('');
      setTxHash(hash);
      setIsPaying(false);
      setIsPaid(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col items-center justify-center p-4">
      {/* Checkout Card */}
      <div className="w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/95 p-6 sm:p-8 shadow-2xl shadow-zinc-900/10 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950 space-y-6">
        {/* Merchant Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white font-bold text-sm shadow-sm overflow-hidden"
              style={{ backgroundColor: brandColor }}
            >
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain p-1" />
              ) : (
                (business?.name || 'F').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white truncate max-w-[200px]">
                {business?.name || 'FacilPay Merchant'}
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                Order ID: {linkId?.slice(0, 14)}...
              </span>
            </div>
          </div>

          <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Stellar Testnet
          </span>
        </div>

        {/* Expired / Sold-out screen (#109) */}
        {isBlocked ? (
          <div className="text-center py-6 space-y-4">
            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-full text-2xl mx-auto shadow-sm ${
              linkExpired ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
            }`}>
              {linkExpired ? '⏰' : '🚫'}
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                {linkExpired ? 'This link has expired' : 'No more slots available'}
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                {linkExpired
                  ? 'This payment link is no longer accepting payments — it passed its expiry date.'
                  : 'This payment link has reached its maximum number of uses and is no longer accepting payments.'}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
            >
              Go to homepage
            </Link>
          </div>
        ) : !isPaid ? (
          <div className="space-y-5">
            {/* Amount details */}
            <div className="text-center py-2 space-y-1">
              <span className="text-xs text-zinc-500">{title}</span>
              <div className="text-3xl font-extrabold tracking-tight font-mono text-zinc-900 dark:text-white">
                ${targetAmount} <span className="text-base font-semibold text-zinc-500">{settlementCurrency}</span>
              </div>
              {/* Remaining uses badge */}
              {usesRemaining !== null && (
                <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                  usesRemaining <= 3
                    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    : 'border-sky-200 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                }`}>
                  {usesRemaining} use{usesRemaining !== 1 ? 's' : ''} remaining
                </span>
              )}
              {/* Expiry badge */}
              {paymentLink?.expiresAt && (
                <div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    Expires {new Date(paymentLink.expiresAt).toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Tax breakdown */}
            {tax && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-1 font-mono text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{toAssetAmountString(tax.subtotal, settlementCurrency)} {settlementCurrency}</span>
                </div>
                <div className="flex justify-between">
                  <span>{formatTaxLabel(tax)}</span>
                  <span>{toAssetAmountString(tax.taxAmount, settlementCurrency)} {settlementCurrency}</span>
                </div>
                <div className="flex justify-between border-t border-zinc-200 pt-1 font-semibold text-zinc-900 dark:border-zinc-700 dark:text-white">
                  <span>Total</span>
                  <span>{toAssetAmountString(tax.total, settlementCurrency)} {settlementCurrency}</span>
                </div>
              </div>
            )}

            {/* Asset Picker for Customer */}
            <div className="space-y-1.5">
              <label htmlFor="payAssetSelect" className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Pay with Asset
              </label>
              <div className="grid grid-cols-3 gap-2">
                {AVAILABLE_PAY_ASSETS.map((asset) => (
                  <button
                    key={asset}
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      selectedAsset === asset
                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {asset}
                  </button>
                ))}
              </div>
            </div>

            {/* Path Payment Quote Details */}
            {isPathPayment && (
              <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4 dark:border-sky-900/50 dark:bg-sky-950/30 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sky-900 dark:text-sky-200">
                    Stellar Path Payment Quote
                  </span>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    {isLoadingQuote ? (
                      <span className="text-zinc-400">Fetching quote...</span>
                    ) : quoteExpired ? (
                      <span className="text-rose-500 font-semibold">Expired</span>
                    ) : (
                      <span className="text-sky-600 dark:text-sky-400">
                        Expires in {secondsRemaining}s
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => fetchQuote()}
                      className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 ml-1 text-xs underline"
                      title="Refresh Quote"
                    >
                      ↻
                    </button>
                  </div>
                </div>

                {quote && (
                  <div className="space-y-1 font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                    <div className="flex justify-between">
                      <span>You pay:</span>
                      <span className="font-semibold">{quote.sourceAmount} {quote.sourceAsset}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Exchange rate:</span>
                      <span>1 {quote.sourceAsset} ≈ {quote.rate} {quote.destinationAsset}</span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Max slippage:</span>
                      <span>{quote.slippagePercent}%</span>
                    </div>
                    {quote.path.length > 0 && (
                      <div className="flex justify-between text-zinc-400 text-[10px]">
                        <span>Routing path:</span>
                        <span>{quote.sourceAsset} → {quote.path.join(' → ')} → {quote.destinationAsset}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Custom Fields (#125) */}
            {customFields.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Your details</p>
                {customFields.map((f) => (
                  <div key={f.id}>
                    <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      {f.label}{f.required && <span className="ml-0.5 text-rose-500">*</span>}
                    </label>
                    <input
                      type={f.type === 'phone' ? 'tel' : f.type === 'email' ? 'email' : 'text'}
                      placeholder={f.placeholder ?? ''}
                      value={fieldValues[f.id] ?? ''}
                      onChange={(e) => {
                        setFieldValues((prev) => ({ ...prev, [f.id]: e.target.value }));
                        if (fieldErrors[f.id]) setFieldErrors((prev) => ({ ...prev, [f.id]: '' }));
                      }}
                      className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition-all focus:outline-none dark:bg-zinc-900 dark:text-white ${
                        fieldErrors[f.id]
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                          : 'border-zinc-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700'
                      }`}
                    />
                    {fieldErrors[f.id] && (
                      <p className="mt-0.5 text-[11px] text-rose-500">{fieldErrors[f.id]}</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 rounded-2xl border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
              {qrSvg ? (
                <div
                  className="rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                />
              ) : (
                <div className="h-40 w-40 flex items-center justify-center text-xs text-zinc-400">
                  Loading QR...
                </div>
              )}
              <span className="text-[11px] text-zinc-400 font-mono mt-2">
                Scan with any Stellar QR wallet to pay
              </span>
            </div>

            {/* Settlement destination notice */}
            <div className="text-center text-[11px] text-zinc-400">
              Direct non-custodial settlement to{' '}
              <span className="font-mono text-zinc-600 dark:text-zinc-300">
                {truncateAddress(settlement?.address || '', 4)}
              </span>
            </div>

            {/* Coupon / Discount Code (#110) */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Have a code?"
                  value={couponCode}
                  onChange={(e) => {
                    setCouponCode(e.target.value.toUpperCase());
                    if (couponError) setCouponError('');
                    if (appliedCoupon) setAppliedCoupon(null);
                  }}
                  className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-mono focus:border-sky-400 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidatingCoupon || !couponCode.trim()}
                  className="rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300"
                >
                  {isValidatingCoupon ? '…' : 'Apply'}
                </button>
              </div>
              {couponError && (
                <p className="flex items-center gap-1 text-xs text-rose-500">
                  <span>✕</span> {couponError}
                </p>
              )}
              {appliedCoupon && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs dark:border-emerald-900 dark:bg-emerald-950/30">
                  <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                    <span className="font-mono font-bold">{appliedCoupon.code}</span> applied — saves {appliedCoupon.discountAmount} {settlementCurrency}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setAppliedCoupon(null); setCouponCode(''); }}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Pay Button styled with custom brandColor */}
            <button
              type="button"
              onClick={handlePay}
              disabled={isPaying || (isPathPayment && quoteExpired)}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 active:scale-95 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: brandColor }}
            >
              {isPaying ? (
                <>
                  <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Processing Settlement on Stellar...</span>
                </>
              ) : isPathPayment && quoteExpired ? (
                <span>Quote Expired — Click to Refresh</span>
              ) : isPathPayment && quote ? (
                <span>
                  Pay {quote.sourceAmount} {selectedAsset}
                  {appliedCoupon ? ` (${appliedCoupon.finalAmount} ${settlementCurrency} after discount)` : ` ($${targetAmount} ${settlementCurrency})`}
                </span>
              ) : appliedCoupon ? (
                <span>Pay ${appliedCoupon.finalAmount} {settlementCurrency} (was ${targetAmount})</span>
              ) : (
                <span>Pay ${targetAmount} {settlementCurrency}</span>
              )}
            </button>
          </div>
        ) : (
          <div className="text-center py-4 space-y-4 animate-fadeIn">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl mx-auto shadow-sm">
              ✓
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                Payment Received & Settled!
              </h3>
              <p className="text-xs text-zinc-500 mt-1">
                {isPathPayment && quote ? (
                  <span>
                    Settled ${targetAmount} {settlementCurrency} (paid {quote.sourceAmount} {selectedAsset}) into the merchant wallet.
                  </span>
                ) : (
                  <span>${appliedCoupon ? appliedCoupon.finalAmount : targetAmount} {settlementCurrency} has settled into the merchant wallet.</span>
                )}
              </p>
            </div>

            {/* Applied coupon summary on success (#110) */}
            {appliedCoupon && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300 text-left space-y-0.5">
                <p className="font-semibold">Coupon applied: {appliedCoupon.code}</p>
                <p>Discount: −{appliedCoupon.discountAmount} {settlementCurrency} &nbsp;•&nbsp; Final: {appliedCoupon.finalAmount} {settlementCurrency}</p>
              </div>
            )}

            {/* Captured custom field values (#125) */}
            {Object.keys(fieldValues).some((k) => fieldValues[k]?.trim()) && (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left space-y-1 dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-[10px] font-semibold uppercase text-zinc-400">Customer details</p>
                {customFields.map((f) => fieldValues[f.id]?.trim() ? (
                  <div key={f.id} className="flex justify-between text-xs">
                    <span className="text-zinc-500">{f.label}:</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-mono">{fieldValues[f.id]}</span>
                  </div>
                ) : null)}
              </div>
            )}

            <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-left border border-zinc-200 dark:border-zinc-800 space-y-1">
              <span className="text-[10px] font-semibold uppercase text-zinc-400">
                Stellar Transaction Hash
              </span>
              <p className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 break-all">
                {txHash}
              </p>
            </div>

            <Link
              href="/overview"
              className="inline-flex items-center justify-center w-full rounded-xl bg-zinc-900 py-2.5 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900 hover:opacity-90"
            >
              Return to Merchant Overview
            </Link>
          </div>
        )}

        <div className="text-center text-[10px] text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          Powered by <span className="font-bold text-zinc-600 dark:text-zinc-300">FacilPay</span> • Stellar Network
        </div>
      </div>
    </div>
  );
}
