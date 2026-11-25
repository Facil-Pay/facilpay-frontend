'use client';

import { useState } from 'react';
import { CopyButton } from '@/components/ui/copy-button';
import type { PaymentLinkData } from '@/types/onboarding';
import {
  createHtmlPaymentButton,
  createReactPaymentButton,
  getPaymentButtonStyle,
  getSafePaymentUrl,
  type PaymentButtonSize,
  type PaymentButtonTheme,
} from '@/lib/payment-button-snippet';

interface PaymentButtonGeneratorProps {
  paymentLinks: PaymentLinkData[];
}

const EMPTY_SNIPPET = '<!-- Select a valid HTTP or HTTPS payment link to generate this snippet. -->';

export default function PaymentButtonGenerator({
  paymentLinks,
}: PaymentButtonGeneratorProps) {
  const [selectedLinkId, setSelectedLinkId] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [label, setLabel] = useState('Pay with FacilPay');
  const [size, setSize] = useState<PaymentButtonSize>('medium');
  const [theme, setTheme] = useState<PaymentButtonTheme>('brand');

  const activeLinkId = selectedLinkId || paymentLinks[0]?.id || 'custom';
  const selectedLink = paymentLinks.find((link) => link.id === activeLinkId);
  const url = activeLinkId === 'custom' ? customUrl : selectedLink?.paymentUrl || '';
  const safeUrl = getSafePaymentUrl(url.trim());
  const options = { url: safeUrl || '', label, size, theme };
  const htmlSnippet = safeUrl ? createHtmlPaymentButton(options) : EMPTY_SNIPPET;
  const reactSnippet = safeUrl ? createReactPaymentButton(options) : EMPTY_SNIPPET;
  const previewStyle = getPaymentButtonStyle(size, theme);

  const handleLinkChange = (value: string) => {
    setSelectedLinkId(value);
  };

  return (
    <section className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
          Embeddable payment button
        </h2>
        <p className="mt-1 text-xs text-zinc-500">
          Configure a button and copy a standalone HTML or React snippet.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Payment link
          {paymentLinks.length > 0 && (
            <select
              value={activeLinkId}
              onChange={(event) => handleLinkChange(event.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="" disabled>Select a payment link</option>
              {paymentLinks.map((link) => (
                <option key={link.id} value={link.id}>
                  {link.title || link.id}
                </option>
              ))}
              <option value="custom">Custom URL</option>
            </select>
          )}
          {(paymentLinks.length === 0 || selectedLinkId === 'custom') && (
            <input
              type="url"
              value={url}
              onChange={(event) => {
                setSelectedLinkId('custom');
                setCustomUrl(event.target.value);
              }}
              placeholder="https://facilpay.io/pay/..."
              className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
            />
          )}
        </label>

        <label className="space-y-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Button label
          <input
            type="text"
            value={label}
            maxLength={60}
            onChange={(event) => setLabel(event.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>

        <label className="space-y-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Size
          <select
            value={size}
            onChange={(event) => setSize(event.target.value as PaymentButtonSize)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </label>

        <label className="space-y-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          Theme
          <select
            value={theme}
            onChange={(event) => setTheme(event.target.value as PaymentButtonTheme)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-normal dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="brand">FacilPay blue</option>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </label>
      </div>

      {!safeUrl && url.trim() && (
        <p role="alert" className="text-xs text-rose-600">
          Enter a valid HTTP or HTTPS payment link.
        </p>
      )}

      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
        {safeUrl ? (
          <a href={safeUrl} style={previewStyle}>
            {label}
          </a>
        ) : (
          <p className="text-xs text-zinc-500">A valid payment link is needed for the preview.</p>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: 'HTML', snippet: htmlSnippet },
          { title: 'React', snippet: reactSnippet },
        ].map(({ title, snippet }) => (
          <div
            key={title}
            className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800"
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{title}</h3>
              <CopyButton value={snippet} label={`Copy ${title} snippet`} />
            </div>
            <pre className="overflow-x-auto bg-[#000F24] p-4 text-[11px] leading-relaxed text-zinc-100">
              <code>{snippet}</code>
            </pre>
          </div>
        ))}
      </div>
    </section>
  );
}
