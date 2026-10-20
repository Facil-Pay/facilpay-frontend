'use client';

import React, { useState } from 'react';
import {
  ApiKeyItem,
  NetworkMode,
  KeyPermissions,
  generateSecretKeyString,
  maskSecretKey,
} from '@/lib/apiKeys';
import { useStepUp } from '@/components/security/use-step-up';

interface CreateKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  network: NetworkMode;
  onKeyCreated: (newKey: ApiKeyItem) => void;
}

export default function CreateKeyModal({
  isOpen,
  onClose,
  network,
  onKeyCreated,
}: CreateKeyModalProps) {
  // Step: 'form' -> 'created'
  const [step, setStep] = useState<'form' | 'created'>('form');
  const [name, setName] = useState('');
  const [permissionType, setPermissionType] = useState<'full_access' | 'restricted'>('full_access');
  const [permissions, setPermissions] = useState<KeyPermissions['resources']>({
    payments: { read: true, write: true },
    refunds: { read: true, write: false },
    webhooks: { read: true, write: true },
    escrow: { read: false, write: false },
  });
  const [expiryOption, setExpiryOption] = useState<'never' | '30d' | '90d' | 'custom'>('never');
  const [customExpiry, setCustomExpiry] = useState('');
  const [newFullKey, setNewFullKey] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [stepUpError, setStepUpError] = useState<string | null>(null);
  const { requestStepUp, stepUpDialog } = useStepUp();

  if (!isOpen) return null;

  const handleToggleResource = (
    resource: 'payments' | 'refunds' | 'webhooks' | 'escrow',
    action: 'read' | 'write'
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [resource]: {
        ...prev[resource],
        [action]: !prev[resource][action],
      },
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // The secret is shown in full exactly once, so revealing it needs a fresh 2FA code.
    setStepUpError(null);
    try {
      if (!(await requestStepUp('reveal_api_key'))) return;
    } catch (err) {
      setStepUpError(err instanceof Error ? err.message : 'Could not verify two-factor authentication.');
      return;
    }

    const fullKey = generateSecretKeyString(network);
    const keyPrefix = `${fullKey.slice(0, 16)}...`;

    let expiresAt: string | null = null;
    const now = new Date();
    if (expiryOption === '30d') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();
    } else if (expiryOption === '90d') {
      expiresAt = new Date(now.getTime() + 90 * 24 * 3600 * 1000).toISOString();
    } else if (expiryOption === 'custom' && customExpiry) {
      expiresAt = new Date(customExpiry).toISOString();
    }

    const createdItem: ApiKeyItem = {
      id: `key_${Date.now()}`,
      name: name.trim(),
      keyPrefix,
      fullKey,
      network,
      createdDate: new Date().toISOString(),
      lastUsed: null,
      createdBy: 'merchant@facilpay.io',
      status: 'active',
      permissions: {
        type: permissionType,
        resources:
          permissionType === 'full_access'
            ? {
                payments: { read: true, write: true },
                refunds: { read: true, write: true },
                webhooks: { read: true, write: true },
                escrow: { read: true, write: true },
              }
            : permissions,
      },
      expiresAt,
    };

    onKeyCreated(createdItem);
    setNewFullKey(fullKey);
    setStep('created');
  };

  const handleCopyKey = async () => {
    try {
      await navigator.clipboard.writeText(newFullKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleFinish = () => {
    setStep('form');
    setName('');
    setNewFullKey('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              {step === 'form' ? 'Create New Secret API Key' : 'Save Your Secret Key'}
            </h2>
            <p className="text-xs text-zinc-500">
              {step === 'form'
                ? `Environment: ${network.toUpperCase()} • Backend access token`
                : 'Copy and securely store your new secret API key'}
            </p>
          </div>
          {step === 'form' && (
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

        {/* Content */}
        <div className="p-6">
          {step === 'form' ? (
            <form onSubmit={(e) => void handleCreate(e)} className="space-y-4">
              {stepUpError && (
                <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {stepUpError}
                </p>
              )}
              {/* Key Name */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Key Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Production Server, Webhook Worker"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              {/* Permissions Radios */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Permissions *
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label
                    className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-colors ${
                      permissionType === 'full_access'
                        ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500/20 dark:bg-sky-950/20 dark:border-sky-700'
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="permissionType"
                      checked={permissionType === 'full_access'}
                      onChange={() => setPermissionType('full_access')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-white block">
                        Full Access
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Read & write all resources
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition-colors ${
                      permissionType === 'restricted'
                        ? 'border-sky-500 bg-sky-50/50 ring-1 ring-sky-500/20 dark:bg-sky-950/20 dark:border-sky-700'
                        : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="permissionType"
                      checked={permissionType === 'restricted'}
                      onChange={() => setPermissionType('restricted')}
                      className="text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                      <span className="font-semibold text-zinc-900 dark:text-white block">
                        Restricted Access
                      </span>
                      <span className="text-[11px] text-zinc-500">
                        Custom per-resource access
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Per-Resource Permissions Matrix */}
              {permissionType === 'restricted' && (
                <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2.5 dark:border-zinc-800 dark:bg-zinc-900/40 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-zinc-200/80 dark:border-zinc-700/80">
                    <span className="font-bold text-zinc-600 uppercase text-[10px]">Resource</span>
                    <div className="flex gap-8 text-[10px] font-bold text-zinc-600 uppercase">
                      <span>Read</span>
                      <span>Write</span>
                    </div>
                  </div>

                  {(['payments', 'refunds', 'webhooks', 'escrow'] as const).map((res) => (
                    <div key={res} className="flex items-center justify-between">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                        {res}
                      </span>
                      <div className="flex gap-8 pr-1">
                        <input
                          type="checkbox"
                          checked={permissions[res].read}
                          onChange={() => handleToggleResource(res, 'read')}
                          className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                        />
                        <input
                          type="checkbox"
                          checked={permissions[res].write}
                          onChange={() => handleToggleResource(res, 'write')}
                          className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Expiry Options */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Key Expiration
                </label>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {[
                    { id: 'never', label: 'Never' },
                    { id: '30d', label: '30 Days' },
                    { id: '90d', label: '90 Days' },
                    { id: 'custom', label: 'Custom' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setExpiryOption(opt.id as any)}
                      className={`rounded-xl border py-1.5 font-medium transition-colors ${
                        expiryOption === opt.id
                          ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-950 dark:border-sky-700 dark:text-sky-300'
                          : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {expiryOption === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="date"
                      required
                      value={customExpiry}
                      onChange={(e) => setCustomExpiry(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-1.5 text-xs text-zinc-900 focus:border-sky-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                    />
                  </div>
                )}
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#000F24] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                >
                  Create Secret Key
                </button>
              </div>
            </form>
          ) : (
            /* Created Key Display (Shown Only Once) */
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200 space-y-1">
                <div className="flex items-center gap-2 font-bold text-amber-950 dark:text-amber-100">
                  <span>⚠️</span>
                  <span>You won&apos;t be able to see this key again!</span>
                </div>
                <p className="text-amber-800 dark:text-amber-300">
                  Please copy this secret key and store it in a secure password manager or server environment variables (.env). For security, we never display it again.
                </p>
              </div>

              {/* Key Box with Copy Button */}
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-2 dark:border-zinc-800 dark:bg-zinc-900">
                <span className="text-[11px] font-semibold uppercase text-zinc-400">
                  Secret API Key ({network.toUpperCase()})
                </span>
                <div className="flex items-center justify-between gap-2 bg-white p-3 rounded-lg border border-zinc-200 font-mono text-xs text-zinc-900 select-all break-all dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-100">
                  <span>{newFullKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
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
