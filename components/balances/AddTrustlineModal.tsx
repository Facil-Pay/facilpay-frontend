'use client';

import React, { useState } from 'react';
import {
  SUPPORTED_TRUSTLINE_ASSETS,
  SupportedAssetOption,
} from '@/lib/stellar/horizon';
import { StrKey } from '@/lib/stellar/strkey';

interface AddTrustlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingAssetCodes: string[];
  onConfirmAddTrustline: (asset: {
    code: string;
    issuer: string;
    name?: string;
  }) => Promise<void>;
}

export default function AddTrustlineModal({
  isOpen,
  onClose,
  existingAssetCodes,
  onConfirmAddTrustline,
}: AddTrustlineModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<SupportedAssetOption | null>(
    SUPPORTED_TRUSTLINE_ASSETS[0]
  );
  const [isCustom, setIsCustom] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customIssuer, setCustomIssuer] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);

  // Stepper: select -> review -> signing -> success
  const [step, setStep] = useState<'select' | 'review' | 'signing' | 'success'>('select');

  if (!isOpen) return null;

  const handleSelectPreset = (preset: SupportedAssetOption) => {
    setSelectedPreset(preset);
    setIsCustom(false);
    setCustomError(null);
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomError(null);

    if (isCustom) {
      const code = customCode.trim().toUpperCase();
      const issuer = customIssuer.trim();

      if (!code || code.length < 1 || code.length > 12) {
        setCustomError('Asset code must be 1 to 12 alphanumeric characters.');
        return;
      }

      if (!StrKey.isValidEd25519PublicKey(issuer)) {
        setCustomError('Invalid issuer Stellar account ID (must be 56 chars starting with G).');
        return;
      }

      if (existingAssetCodes.includes(code)) {
        setCustomError(`Trustline for ${code} already exists on this account.`);
        return;
      }
    } else if (selectedPreset) {
      if (existingAssetCodes.includes(selectedPreset.code)) {
        setCustomError(`Trustline for ${selectedPreset.code} is already established on this account.`);
        return;
      }
    }

    setStep('review');
  };

  const handleWalletSignAndSubmit = async () => {
    setStep('signing');

    const assetToAdd = isCustom
      ? { code: customCode.trim().toUpperCase(), issuer: customIssuer.trim() }
      : { code: selectedPreset!.code, issuer: selectedPreset!.issuer, name: selectedPreset!.name };

    // Simulate wallet signature
    setTimeout(async () => {
      await onConfirmAddTrustline(assetToAdd);
      setStep('success');
    }, 1200);
  };

  const activeAsset = isCustom
    ? { code: customCode.trim().toUpperCase(), issuer: customIssuer.trim(), name: 'Custom Token' }
    : selectedPreset!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Add Asset Trustline
            </h2>
            <p className="text-xs text-zinc-500">
              Establish a trustline on Stellar ledger via changeTrust operation
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'select' && (
            <form onSubmit={handleProceedToReview} className="space-y-4">
              {customError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  {customError}
                </div>
              )}

              {/* Supported Assets Presets */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Select Supported Asset
                </label>
                <div className="space-y-2">
                  {SUPPORTED_TRUSTLINE_ASSETS.map((asset) => {
                    const isAlreadyAdded = existingAssetCodes.includes(asset.code);
                    const isSelected = !isCustom && selectedPreset?.code === asset.code;

                    return (
                      <div
                        key={asset.code}
                        onClick={() => !isAlreadyAdded && handleSelectPreset(asset)}
                        className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer transition-all ${
                          isAlreadyAdded
                            ? 'opacity-50 cursor-not-allowed border-zinc-200 bg-zinc-50 dark:bg-zinc-800/30'
                            : isSelected
                            ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 dark:bg-sky-950/20 dark:border-sky-700'
                            : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-100 font-bold text-xs text-zinc-800 dark:bg-zinc-800 dark:text-white">
                            {asset.code}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-zinc-900 dark:text-white block">
                              {asset.name}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono">
                              {StrKey.truncateAddress(asset.issuer, 8, 8)}
                            </span>
                          </div>
                        </div>

                        {isAlreadyAdded ? (
                          <span className="rounded bg-zinc-200 px-2 py-0.5 text-[10px] font-semibold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            Already Added
                          </span>
                        ) : isSelected ? (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white text-xs">
                            ✓
                          </span>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Asset Toggle */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setIsCustom(!isCustom)}
                  className="text-xs font-semibold text-sky-600 hover:underline dark:text-sky-400"
                >
                  {isCustom ? '← Pick from supported presets' : '+ Add custom asset by issuer account'}
                </button>

                {isCustom && (
                  <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Asset Code (e.g. BTC, USDC)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={12}
                        placeholder="e.g. USDC"
                        value={customCode}
                        onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Issuer Stellar Account ID (G...)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="G..."
                        value={customIssuer}
                        onChange={(e) => setCustomIssuer(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-mono text-zinc-900 focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#000F24] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                >
                  <span>Review Operation</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          )}

          {step === 'review' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                  Stellar changeTrust Operation Review
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-zinc-200/80 dark:border-zinc-700">
                    <span className="text-zinc-500">Asset</span>
                    <span className="font-bold text-zinc-900 dark:text-white">
                      {activeAsset.code} ({activeAsset.name})
                    </span>
                  </div>
                  <div className="py-1 border-b border-zinc-200/80 dark:border-zinc-700">
                    <span className="text-zinc-500 block mb-0.5">Asset Issuer</span>
                    <span className="font-mono text-[11px] text-zinc-900 dark:text-white break-all">
                      {activeAsset.issuer}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-200/80 dark:border-zinc-700">
                    <span className="text-zinc-500">Trust Limit</span>
                    <span className="font-mono text-zinc-800 dark:text-zinc-200">
                      Maximum (922,337,203,685.4775807)
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-zinc-200/80 dark:border-zinc-700">
                    <span className="text-zinc-500">Network Transaction Fee</span>
                    <span className="font-medium text-zinc-900 dark:text-white">
                      0.00001 XLM
                    </span>
                  </div>
                  <div className="flex justify-between py-1 text-sky-700 dark:text-sky-300">
                    <span>Account Base Reserve Impact</span>
                    <span className="font-bold">+0.5 XLM locked reserve</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('select')}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleWalletSignAndSubmit}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Sign with Wallet & Add Trustline
                </button>
              </div>
            </div>
          )}

          {step === 'signing' && (
            <div className="py-12 text-center space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Signing changeTrust Operation...
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Please approve the trustline creation in your connected Stellar wallet.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  Trustline Established!
                </h3>
                <p className="text-xs text-zinc-500 mt-1">
                  Your account is now ready to hold, receive, and facilitate {activeAsset.code} payments on Stellar.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl bg-[#000F24] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
