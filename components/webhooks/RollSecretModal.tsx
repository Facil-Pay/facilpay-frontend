'use client';

import React, { useState } from 'react';
import { WebhookEndpoint } from '@/types/webhooks';
import { rollEndpointSecret } from '@/lib/webhook-data';
import { getMerchantUser, saveAuditEvent } from '@/lib/storage';
import { CopyButton } from '@/components/ui/copy-button';

interface RollSecretModalProps {
  isOpen: boolean;
  endpoint: WebhookEndpoint | null;
  onClose: () => void;
  onSecretRolled: (endpoint: WebhookEndpoint, newSecret: string) => void;
}

export default function RollSecretModal({
  isOpen,
  endpoint,
  onClose,
  onSecretRolled,
}: RollSecretModalProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [overlap, setOverlap] = useState<'now' | '1h' | '24h' | '7d'>('24h');
  const [overlapExpiresAt, setOverlapExpiresAt] = useState<string | null>(null);
  const [rotationError, setRotationError] = useState<string | null>(null);

  if (!isOpen || !endpoint) return null;

  const handleRoll = () => {
    setIsRolling(true);
    setRotationError(null);
    setTimeout(() => {
      try {
        const result = rollEndpointSecret(endpoint.id, overlap);
        if (!result.endpoint) {
          setRotationError(
            result.error || 'This webhook endpoint could not be found. Refresh and try again.'
          );
          return;
        }

        setNewSecret(result.newSecret);
        const previousSecret = result.endpoint.previousSecrets?.find(
          ({ secret }) => secret === endpoint.secret
        );
        setOverlapExpiresAt(previousSecret?.expiresAt ?? null);
        const user = getMerchantUser();
        saveAuditEvent({
          id: `evt_webhook_secret_${Date.now()}`,
          actor: user.email,
          actionType: 'Webhooks',
          action: 'Webhook signing secret rotated',
          target: endpoint.url,
          ip: '—',
          timestamp: new Date().toISOString(),
        });
        onSecretRolled(result.endpoint, result.newSecret);
      } catch (error) {
        setRotationError(
          error instanceof Error ? error.message : 'Secret rotation failed. Please try again.'
        );
      } finally {
        setIsRolling(false);
      }
    }, 500);
  };

  const handleDone = () => {
    setNewSecret(null);
    setOverlapExpiresAt(null);
    setRotationError(null);
    onClose();
  };

  const handleCancel = () => {
    setRotationError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col space-y-4">
        {/* Step 1: Warning & Confirmation */}
        {!newSecret ? (
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Roll Signing Secret?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Choose how long the current signing secret remains valid while you update your receiver.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-300 space-y-1.5">
              <span className="font-bold flex items-center gap-1.5">
                <span>⚠️ Secret rotation</span>
              </span>
              <p className="text-[11px] leading-relaxed">
                During the selected overlap, deliveries to{' '}
                <strong className="font-mono">{endpoint.url}</strong> can be verified with either
                secret. The new secret is shown once.
              </p>
            </div>

            <label className="block space-y-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Overlap period
              <select
                value={overlap}
                onChange={(event) => setOverlap(event.target.value as typeof overlap)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900"
              >
                <option value="now">Immediately (no overlap)</option>
                <option value="1h">1 hour</option>
                <option value="24h">24 hours</option>
                <option value="7d">7 days</option>
              </select>
            </label>

            <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
              <p>
                <strong className="text-zinc-900 dark:text-zinc-200">Current masked secret:</strong>{' '}
                <code className="font-mono text-[11px] bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded">
                  whsec_••••••••••••••••••••••••••••••••
                </code>
              </p>
            </div>

            {rotationError && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                {rotationError}
              </p>
            )}

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isRolling}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoll}
                disabled={isRolling}
                className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isRolling ? 'Rolling Secret...' : 'Yes, Roll Secret'}
              </button>
            </div>
          </>
        ) : (
          /* Step 2: Show New Secret */
          <>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Signing Secret Successfully Rolled
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Update your receiver before the overlap period ends.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                New Signing Secret:
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900 text-zinc-100 font-mono text-xs border border-zinc-800 shadow-inner">
                <span className="flex-1 break-all select-all font-bold text-emerald-400">
                  {newSecret}
                </span>
                <CopyButton value={newSecret} label="Copy new signing secret" />
              </div>
            </div>

            {overlapExpiresAt ? (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Old secret expires: {new Date(overlapExpiresAt).toLocaleString()}
              </p>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-300">
                The old secret was invalidated immediately.
              </p>
            )}

            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={handleDone}
                className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
