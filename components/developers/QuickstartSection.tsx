'use client';

import React, { useState } from 'react';
import { NetworkMode } from '@/lib/apiKeys';
import PaymentButtonGenerator from '@/components/developers/PaymentButtonGenerator';
import type { PaymentLinkData } from '@/types/onboarding';

interface QuickstartSectionProps {
  publishableKey: string;
  network: NetworkMode;
  paymentLinks: PaymentLinkData[];
}

export default function QuickstartSection({
  publishableKey,
  network,
  paymentLinks,
}: QuickstartSectionProps) {
  const [lang, setLang] = useState<'curl' | 'node'>('curl');
  const [copied, setCopied] = useState(false);

  const curlSnippet = `curl -X POST https://api.facilpay.io/v1/payments \\
  -H "Authorization: Bearer ${publishableKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "amount": "125.00",
    "asset": "USDC",
    "description": "Invoice #1042",
    "customerEmail": "customer@example.com",
    "metadata": {
      "orderId": "ord_84920",
      "network": "${network}"
    }
  }'`;

  const nodeSnippet = `import { FacilPay } from '@facilpay/sdk';

const facilpay = new FacilPay({
  publishableKey: '${publishableKey}',
  network: '${network}', // 'testnet' | 'mainnet'
});

async function createCheckout() {
  const payment = await facilpay.payments.create({
    amount: 125.00,
    asset: 'USDC',
    description: 'Invoice #1042',
    customerEmail: 'customer@example.com',
    metadata: {
      orderId: 'ord_84920'
    }
  });

  console.log('Payment created:', payment.id);
  console.log('Stellar Tx Hash:', payment.txHash);
}

createCheckout();`;

  const activeSnippet = lang === 'curl' ? curlSnippet : nodeSnippet;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="space-y-6">
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-6 py-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            Developer Quickstart
          </h2>
          <p className="text-xs text-zinc-500">
            Create your first test payment using your {network.toUpperCase()} publishable key
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Switcher */}
          <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5 text-xs dark:border-zinc-700 dark:bg-zinc-800">
            <button
              type="button"
              onClick={() => setLang('curl')}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                lang === 'curl'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              cURL
            </button>
            <button
              type="button"
              onClick={() => setLang('node')}
              className={`rounded-md px-3 py-1 font-semibold transition-colors ${
                lang === 'node'
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-black'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              Node.js
            </button>
          </div>

          {/* Copy Snippet Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            {copied ? (
              <span className="text-emerald-600">Copied!</span>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Block */}
      <div className="relative bg-[#000F24] p-5 text-zinc-100 overflow-x-auto font-mono text-xs leading-relaxed">
        <pre>{activeSnippet}</pre>
      </div>
    </div>
    <PaymentButtonGenerator paymentLinks={paymentLinks} />
    </div>
  );
}
