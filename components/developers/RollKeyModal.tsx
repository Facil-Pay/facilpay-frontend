'use client';

import React, { useState } from 'react';
import {
  ApiKeyItem,
  generateSecretKeyString,
} from '@/lib/apiKeys';
import { useStepUp } from '@/components/security/use-step-up';

interface RollKeyModalProps {
  keyItem: ApiKeyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onKeyRolled: (oldKeyId: string, newKey: ApiKeyItem, gracePeriod: 'now' | '1h' | '24h' | '7d') => void;
}

export default function RollKeyModal({
  keyItem,
  isOpen,
  onClose,
  onKeyRolled,
}: RollKeyModalProps) {
  const [gracePeriod, setGracePeriod] = useState<'now' | '1h' | '24h' | '7d'>('24h');
  const [newGeneratedKey, setNewGeneratedKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [step, setStep] = useState<'confirm' | 'revealed'>('confirm');
  const [stepUpError, setStepUpError] = useState<string | null>(null);
  const { requestStepUp, stepUpDialog } = useStepUp();

  if (!isOpen || !keyItem) return null;

  const handleRoll = async () => {
    // Rolling reveals a new secret, so it needs a fresh 2FA code.
    setStepUpError(null);
    try {
      if (!(await requestStepUp('reveal_api_key'))) return;
    } catch (err) {
      setStepUpError(err instanceof Error ? err.message : 'Could not verify two-factor authentication.');
      return;
    }

    const fullKey = generateSecretKeyString(keyItem.network);
    const keyPrefix = `${fullKey.slice(0, 16)}...`;

    const newKey: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: `${keyItem.name} (Rolled)`,
      keyPrefix,
      fullKey,
      network: keyItem.network,
      createdDate: new Date().toISOString(),
      lastUsed: null,
      createdBy: 'merchant@facilpay.io',
      status: 'active',
      permissions: keyItem.permissions,
      expiresAt: keyItem.expiresAt,
    };

    onKeyRolled(keyItem.id, newKey, gracePeriod);
    setNewGeneratedKey(fullKey);
    setStep('revealed');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(newGeneratedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleFinish = () => {
    setStep('confirm');
    setNewGeneratedKey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Roll Secret API Key
            </h2>
            <p className="font-mono text-xs text-zinc-500">{keyItem.name} ({keyItem.keyPrefix})</p>
          </div>
          {step === 'confirm' && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 'confirm' ? (
            <div className="space-y-4">
              {stepUpError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {stepUpError}
                </p>
              )}
              <p className="text-xs text-zinc-600 dark:text-zinc-300">
                Rolling this key will immediately generate a new secret API key while keeping your existing key active for a grace period, preventing server downtime during deployment.
              </p>

              {/* Grace Period Selection */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Old Key Expiration (Grace Period)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'now', label: 'Expire Immediately (Now)', desc: 'Instant cutover' },
                    { id: '1h', label: '1 Hour Grace Period', desc: 'Quick server restart' },
                    { id: '24h', label: '24 Hours (Recommended)', desc: 'Safe phased deployment' },
                    { id: '7d', label: '7 Days', desc: 'Distributed microservices' },
                  ].map((gp) => (
                    <div
                      key={gp.id}
                      onClick={() => setGracePeriod(gp.id as any)}
                      className={`rounded-xl border p-3 cursor-pointer transition-all ${
                        gracePeriod === gp.id
                          ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 dark:bg-sky-950/20 dark:border-sky-700'
                          : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <span className="font-semibold text-zinc-900 dark:text-white block">
                        {gp.label}
                      </span>
                      <span className="text-[10px] text-zinc-500 block mt-0.5">
                        {gp.desc}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRoll()}
                  className="rounded-xl bg-[#000F24] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                >
                  Roll Key Now
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
                  <span>⚠️</span>
                  <span>Save Your New Key Now!</span>
                </div>
                <p className="text-amber-800 dark:text-amber-300">
                  You won&apos;t be able to see this key again once this dialog is closed. Your previous key will expire according to your selected {gracePeriod} grace period.
                </p>
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-[11px] font-semibold uppercase text-zinc-400">
                  New Secret API Key
                </span>
                <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-lg border border-zinc-200 font-mono text-xs text-zinc-900 select-all break-all dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100">
                  <span>{newGeneratedKey}</span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="shrink-0 rounded-md bg-zinc-100 px-3 py-1 font-sans text-xs font-semibold text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    {copied ? 'Copied!' : 'Copy Key'}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleFinish}
                  className="rounded-xl bg-[#000F24] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                >
                  I have saved this key
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {stepUpDialog}
    </div>
  );
}
