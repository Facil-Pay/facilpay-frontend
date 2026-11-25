'use client';

import React, { useState } from 'react';

interface SignatureVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  secret?: string;
}

export default function SignatureVerificationModal({
  isOpen,
  onClose,
  secret = 'whsec_your_signing_secret_here',
}: SignatureVerificationModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'nodejs' | 'express'>('nodejs');

  if (!isOpen) return null;

  const nodeCode = `const crypto = require('crypto');

/**
 * Verify FacilPay Webhook Signature in Node.js
 *
 * Header format: X-FacilPay-Signature: t=1790418376,v1=5e4d3c2b1a0f9e8d...
 *
 * @param {string} rawBody - Raw unparsed HTTP request body string
 * @param {string} signatureHeader - Value of 'X-FacilPay-Signature' header
 * @param {string} secret - Webhook endpoint signing secret (e.g. "${secret}")
 * @param {number} toleranceSeconds - Allowed clock drift (default 300s = 5m)
 * @returns {boolean}
 */
function verifyFacilPaySignature(rawBody, signatureHeader, secret, toleranceSeconds = 300) {
  if (!signatureHeader || !secret) {
    throw new Error('Missing signature header or secret');
  }

  // 1. Extract timestamp and signature components
  const elements = signatureHeader.split(',');
  const timestampItem = elements.find((item) => item.startsWith('t='));
  const signatureItem = elements.find((item) => item.startsWith('v1='));

  if (!timestampItem || !signatureItem) {
    throw new Error('Malformed signature header');
  }

  const timestamp = timestampItem.split('=')[1];
  const signature = signatureItem.split('=')[1];

  // 2. Prevent replay attacks: verify timestamp freshness
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > toleranceSeconds) {
    throw new Error('Webhook timestamp outside allowed tolerance window');
  }

  // 3. Compute expected HMAC-SHA256 signature over \`\${timestamp}.\${rawBody}\`
  const signedPayload = \`\${timestamp}.\${rawBody}\`;
  const computedHash = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');

  // 4. Timing-safe equality check to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(computedHash, 'utf8'),
    Buffer.from(signature, 'utf8')
  );
}

module.exports = { verifyFacilPaySignature };`;

  const expressCode = `const express = require('express');
const { verifyFacilPaySignature } = require('./verifyWebhook');

const app = express();
const WEBHOOK_SECRET = process.env.FACILPAY_WEBHOOK_SECRET || '${secret}';

// IMPORTANT: Parse raw body before json parser
app.post(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  (req, res) => {
    const rawBody = req.body.toString('utf8');
    const signature = req.headers['x-facilpay-signature'];

    try {
      const isValid = verifyFacilPaySignature(rawBody, signature, WEBHOOK_SECRET);
      if (!isValid) {
        return res.status(400).send('Invalid signature');
      }

      // Safe to parse JSON payload
      const event = JSON.parse(rawBody);
      console.log('Received verified event:', event.event, event.id);

      switch (event.event) {
        case 'payment.completed':
          // Handle successful Stellar payment
          break;
        case 'refund.completed':
          // Handle refund confirmation
          break;
        default:
          console.log('Unhandled event type:', event.event);
      }

      return res.status(200).json({ received: true });
    } catch (err) {
      console.error('Webhook verification error:', err.message);
      return res.status(400).send(\`Webhook Error: \${err.message}\`);
    }
  }
);

app.listen(3000, () => console.log('Listening on port 3000'));`;

  const currentCode = activeTab === 'nodejs' ? nodeCode : expressCode;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-mono text-sm font-bold">
              &lt;/&gt;
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Webhook Signature Verification
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Secure your webhook listener by verifying the HMAC-SHA256 signature in Node.js
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab switcher & Copy action */}
        <div className="flex items-center justify-between pt-4 pb-2">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900">
            <button
              onClick={() => setActiveTab('nodejs')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'nodejs'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Node.js Function
            </button>
            <button
              onClick={() => setActiveTab('express')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'express'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Express.js Example
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <span className="text-emerald-500">✓</span>
                <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>

        {/* Code Snippet Box */}
        <div className="flex-1 overflow-auto rounded-xl border border-zinc-200 bg-zinc-900 p-4 text-xs font-mono text-zinc-200 dark:border-zinc-800 shadow-inner">
          <pre className="whitespace-pre overflow-x-auto text-[11px] leading-relaxed">
            {currentCode}
          </pre>
        </div>

        {/* Note / Advice */}
        <div className="mt-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 text-[11px] text-sky-800 dark:text-sky-300">
          <span className="font-bold">Security tip:</span> Always verify signatures using the raw unparsed request body string and <code className="font-mono bg-sky-100 dark:bg-sky-900/50 px-1 py-0.5 rounded">crypto.timingSafeEqual</code> to guard against timing analysis attacks.
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
