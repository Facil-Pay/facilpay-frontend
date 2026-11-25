'use client';

import React, { useState } from 'react';
import { Webhook } from '@/lib/types';

interface SecretCreatedModalProps {
  isOpen: boolean;
  endpoint: Webhook | null;
  secret: string;
  onClose: () => void;
  onOpenVerificationGuide?: () => void;
}

export default function SecretCreatedModal({
  isOpen,
  endpoint,
  secret,
  onClose,
  onOpenVerificationGuide,
}: SecretCreatedModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !endpoint) return null;

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Webhook Endpoint Created!
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Copy and securely store your signing secret now. For security purposes, FacilPay will mask this secret afterwards.
            </p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-1">
          <div className="font-semibold flex items-center gap-1.5">
            <span>⚠️ One-Time Secret Disclosure</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            This secret will not be displayed unmasked in full again without manual reveal authorization. Store it in your backend environment variables (e.g. <code className="font-mono bg-amber-100 dark:bg-amber-900/50 px-1 py-0.5 rounded">FACILPAY_WEBHOOK_SECRET</code>).
          </p>
        </div>

        {/* Endpoint info & Secret Box */}
        <div className="space-y-2">
          <div className="text-xs">
            <span className="text-zinc-500 font-medium">Destination URL:</span>
            <p className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
              {endpoint.url}
            </p>
          </div>

          <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Signing Secret:
          </label>
          <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs border border-zinc-800 shadow-inner">
            <span className="flex-1 break-all select-all font-bold text-sky-400">
              {secret}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 flex items-center gap-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <span>✓</span>
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Code Verification Help Link */}
        {onOpenVerificationGuide && (
          <div className="pt-1">
            <button
              type="button"
              onClick={onOpenVerificationGuide}
              className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View Node.js HMAC verification snippet</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
          >
            I Have Saved This Secret
          </button>
        </div>
      </div>
    </div>
  );
}
