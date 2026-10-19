'use client';

import React, { useState } from 'react';
import { Payout } from '@/lib/types';
import {
  getMultisigProgress,
  isPayoutExpired,
  getExpirationMessage,
  signMultisigPayout,
  DEMO_MULTISIG_SIGNERS,
} from '@/lib/stellar/multisig';

interface SignMultisigPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  payout: Payout | null;
  onSigned: (updatedPayout: Payout) => void;
}

export default function SignMultisigPayoutModal({
  isOpen,
  onClose,
  payout,
  onSigned,
}: SignMultisigPayoutModalProps) {
  const [selectedSignerKey, setSelectedSignerKey] = useState<string>(
    DEMO_MULTISIG_SIGNERS[1].key
  );
  const [isSigning, setIsSigning] = useState<boolean>(false);
  const [signError, setSignError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copiedXdr, setCopiedXdr] = useState<boolean>(false);

  if (!isOpen || !payout || !payout.multisig) return null;

  const progress = getMultisigProgress(payout);
  const expired = isPayoutExpired(payout);
  const expirationMessage = getExpirationMessage(payout);

  const handleCopyXdr = async () => {
    try {
      if (payout.multisig?.xdr) {
        await navigator.clipboard.writeText(payout.multisig.xdr);
        setCopiedXdr(true);
        setTimeout(() => setCopiedXdr(false), 2000);
      }
    } catch {
      // Fallback
    }
  };

  const handleSign = async () => {
    setSignError(null);
    setSuccessMessage(null);
    setIsSigning(true);

    try {
      // Simulate wallet signing interaction delay
      await new Promise((resolve) => setTimeout(resolve, 600));

      const result = signMultisigPayout(payout, selectedSignerKey);

      if (result.error) {
        setSignError(result.error);
        setIsSigning(false);
        return;
      }

      if (result.submitted) {
        setSuccessMessage('Threshold met! Payout transaction automatically signed and submitted on-chain.');
      } else {
        setSuccessMessage('Signature appended successfully! Awaiting remaining team signatures.');
      }

      onSigned(result.updatedPayout);
    } catch (err: any) {
      setSignError(err?.message || 'Failed to sign transaction.');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-100 pb-4 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Multi-Signature Payout Approval
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  expired
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : progress.isReadyToSubmit
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {expired ? 'EXPIRED' : progress.isReadyToSubmit ? 'THRESHOLD MET' : 'AWAITING SIGNATURES'}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Transaction ID: <span className="font-mono">{payout.id}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            ✕
          </button>
        </div>

        {/* Expiration Banner if expired */}
        {expired && (
          <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-900/50 dark:bg-rose-950/40">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Transaction Expired
                </h4>
                <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300">
                  {expirationMessage}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="text-zinc-500">Amount & Asset</span>
            <div className="mt-1 font-mono text-base font-bold text-zinc-900 dark:text-white">
              {payout.amount.toLocaleString()} {payout.asset}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/40">
            <span className="text-zinc-500">Destination</span>
            <div className="mt-1 truncate font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200" title={payout.destinationWallet}>
              {payout.destinationLabel || payout.destinationWallet.slice(0, 12) + '...'}
            </div>
          </div>
        </div>

        {/* Threshold Progress */}
        <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/50 p-4 dark:border-purple-900/40 dark:bg-purple-950/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-purple-900 dark:text-purple-200">
              Signature Progress
            </span>
            <span className="font-bold text-purple-700 dark:text-purple-300">
              {progress.signedCount} of {progress.totalRequired} required ({progress.percentage}%)
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-purple-200 dark:bg-purple-900/60">
            <div
              className={`h-full transition-all duration-300 ${
                progress.isReadyToSubmit ? 'bg-emerald-500' : 'bg-purple-600'
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>

          {/* Signers list */}
          <div className="mt-4 space-y-2">
            {payout.multisig.signers.map((signer, index) => (
              <div
                key={signer.key}
                className="flex items-center justify-between rounded-lg bg-white/80 px-3 py-2 text-xs dark:bg-zinc-800/60"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                      signer.signed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold'
                        : 'bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    {signer.signed ? '✓' : index + 1}
                  </span>
                  <span className="font-mono text-zinc-700 dark:text-zinc-300">
                    {signer.key.slice(0, 8)}...{signer.key.slice(-8)}
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    ({signer.label || `Signer ${index + 1}`})
                  </span>
                </div>

                <div>
                  {signer.signed ? (
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      Signed {signer.signedAt ? new Date(signer.signedAt).toLocaleTimeString() : ''}
                    </span>
                  ) : (
                    <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Awaiting Signature
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* XDR Inspection */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Transaction Envelope XDR</span>
            <button
              type="button"
              onClick={handleCopyXdr}
              className="text-sky-600 hover:underline dark:text-sky-400 font-medium text-[11px]"
            >
              {copiedXdr ? 'Copied XDR!' : 'Copy Base64 XDR'}
            </button>
          </div>
          <div className="mt-1 max-h-16 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-2 font-mono text-[10px] text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400 break-all">
            {payout.multisig.xdr}
          </div>
        </div>

        {/* Action feedback */}
        {signError && (
          <div className="mt-3 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
            {signError}
          </div>
        )}
        {successMessage && (
          <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            {successMessage}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <label className="text-xs text-zinc-500">Sign As:</label>
            <select
              value={selectedSignerKey}
              onChange={(e) => setSelectedSignerKey(e.target.value)}
              disabled={expired || progress.isReadyToSubmit || isSigning}
              className="rounded-lg border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              {payout.multisig.signers.map((s, idx) => (
                <option key={s.key} value={s.key} disabled={s.signed}>
                  {s.label || `Signer ${idx + 1}`} ({s.key.slice(0, 6)}...{s.key.slice(-4)}) {s.signed ? '— (Already Signed)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSign}
              disabled={expired || progress.isReadyToSubmit || isSigning}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700 disabled:opacity-50"
            >
              <svg className={`h-3.5 w-3.5 ${isSigning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {isSigning ? 'Signing XDR...' : 'Sign with Wallet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
