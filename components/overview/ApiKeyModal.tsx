'use client';

import React, { useState } from 'react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const [keyName, setKeyName] = useState('Production Backend Service');
  const [keyType, setKeyType] = useState<'test' | 'live'>('test');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const prefix = keyType === 'live' ? 'fp_live_' : 'fp_test_';
    const randomBytes = Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    const fullKey = `${prefix}${randomBytes}`;
    setGeneratedKey(fullKey);
    onSuccess();
  };

  const handleCopy = () => {
    if (generatedKey && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔑</span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Create FacilPay API Key
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {!generatedKey ? (
          <form onSubmit={handleGenerate} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Key Label / Description
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. Node.js Payment Worker"
                className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Environment
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  onClick={() => setKeyType('test')}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                    keyType === 'test'
                      ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/60 dark:border-sky-700 text-sky-700 dark:text-sky-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="keyType"
                    checked={keyType === 'test'}
                    onChange={() => setKeyType('test')}
                    className="h-3.5 w-3.5 text-sky-600"
                  />
                  <span>Testnet (Recommended)</span>
                </label>

                <label
                  onClick={() => setKeyType('live')}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                    keyType === 'live'
                      ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/60 dark:border-sky-700 text-sky-700 dark:text-sky-300'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="keyType"
                    checked={keyType === 'live'}
                    onChange={() => setKeyType('live')}
                    className="h-3.5 w-3.5 text-sky-600"
                  />
                  <span>Mainnet Live</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 cursor-pointer"
              >
                Generate API Key
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300">
              ⚠️ Make sure to copy your API secret now. You won&apos;t be able to see it again!
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Your API Key
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-zinc-300 bg-zinc-50 p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
                <input
                  type="text"
                  readOnly
                  value={generatedKey}
                  className="w-full bg-transparent font-mono text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200 transition-colors cursor-pointer"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-zinc-900 px-5 py-2 text-xs font-semibold text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
