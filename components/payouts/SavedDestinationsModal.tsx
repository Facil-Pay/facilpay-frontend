'use client';

import React, { useState } from 'react';
import { SavedDestination } from '@/lib/types';
import { StrKey } from '@/lib/stellar/strkey';
import { isFederationAddress, resolveFederationAddress } from '@/lib/stellar/federation';
import { getExchangeDetails } from '@/lib/stellar/exchanges';

interface SavedDestinationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  destinations: SavedDestination[];
  onAddDestination: (dest: SavedDestination) => void;
  onDeleteDestination: (id: string) => void;
  onSelectDestination?: (dest: SavedDestination) => void;
}

export default function SavedDestinationsModal({
  isOpen,
  onClose,
  destinations,
  onAddDestination,
  onDeleteDestination,
  onSelectDestination,
}: SavedDestinationsModalProps) {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [label, setLabel] = useState('');
  const [address, setAddress] = useState('');
  const [memo, setMemo] = useState('');
  const [memoType, setMemoType] = useState<'text' | 'id' | 'hash'>('text');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const cleanLabel = label.trim();
    const cleanAddress = address.trim();

    if (!cleanLabel) {
      setValidationError('Please enter a destination label (e.g. Binance Hot Wallet).');
      return;
    }

    if (!cleanAddress) {
      setValidationError('Please enter a Stellar address or federation address.');
      return;
    }

    let resolvedKey: string | undefined = undefined;
    let isExchange = false;
    let exchangeName: string | undefined = undefined;

    // Validate StrKey or Federation
    if (StrKey.isValidEd25519PublicKey(cleanAddress)) {
      resolvedKey = cleanAddress;
      const ex = getExchangeDetails(cleanAddress);
      if (ex) {
        isExchange = true;
        exchangeName = ex.name;
      }
    } else if (isFederationAddress(cleanAddress)) {
      setIsResolving(true);
      const fed = await resolveFederationAddress(cleanAddress);
      setIsResolving(false);

      if (!fed) {
        setValidationError('Could not resolve federation address. Please check syntax (user*domain.com).');
        return;
      }
      resolvedKey = fed.account_id;
      if (fed.isExchange) {
        isExchange = true;
        exchangeName = fed.exchangeName;
      }
    } else {
      setValidationError('Invalid address. Must be a 56-char Stellar address (G...) or federation address (user*domain.com).');
      return;
    }

    const newDest: SavedDestination = {
      id: `dest_${Date.now()}`,
      label: cleanLabel,
      address: cleanAddress,
      resolvedAddress: resolvedKey !== cleanAddress ? resolvedKey : undefined,
      memo: memo.trim() || undefined,
      memoType: memo.trim() ? memoType : undefined,
      isExchange,
      exchangeName,
      createdAt: new Date().toISOString(),
    };

    onAddDestination(newDest);
    setIsAddingNew(false);
    setLabel('');
    setAddress('');
    setMemo('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Saved Destinations
            </h2>
            <p className="text-xs text-zinc-500">
              Manage frequently used external Stellar wallets and exchange addresses
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
        <div className="p-6 space-y-4">
          {!isAddingNew ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {destinations.length} Destination{destinations.length !== 1 ? 's' : ''} Saved
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#000F24] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Destination
                </button>
              </div>

              {destinations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-xs text-zinc-500 dark:border-zinc-700">
                  No saved destinations yet. Add your external wallets or exchange deposit addresses for quick access.
                </div>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {destinations.map((dest) => (
                    <div
                      key={dest.id}
                      className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-3.5 transition-all hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60"
                    >
                      <div className="space-y-1 pr-3 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-zinc-900 dark:text-white truncate">
                            {dest.label}
                          </span>
                          {dest.isExchange && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                              {dest.exchangeName || 'Exchange'}
                            </span>
                          )}
                        </div>
                        <div className="font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate">
                          {dest.address}
                        </div>
                        {dest.memo && (
                          <div className="text-[10px] text-zinc-500">
                            Memo ({dest.memoType || 'text'}):{' '}
                            <span className="font-mono font-medium text-zinc-700 dark:text-zinc-300">
                              {dest.memo}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {onSelectDestination && (
                          <button
                            type="button"
                            onClick={() => {
                              onSelectDestination(dest);
                              onClose();
                            }}
                            className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/50 dark:text-sky-300"
                          >
                            Use
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onDeleteDestination(dest.id)}
                          className="rounded-lg p-1.5 text-zinc-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          title="Remove saved destination"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Add New Destination Form */
            <form onSubmit={handleSave} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                  New Destination
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                >
                  Back to List
                </button>
              </div>

              {validationError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                  {validationError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Destination Label *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Binance Operations, Cold Storage Vault"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Stellar Address or Federation Address *
                </label>
                <input
                  type="text"
                  required
                  placeholder="G... or user*domain.com"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 font-mono text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                <p className="mt-1 text-[11px] text-zinc-500">
                  Supports Ed25519 Public Keys (56 chars starting with G) and SEP-2 Federation addresses.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Default Memo (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Deposit Tag / Memo ID"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Memo Type
                  </label>
                  <select
                    value={memoType}
                    onChange={(e) => setMemoType(e.target.value as any)}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                  >
                    <option value="text">TEXT</option>
                    <option value="id">ID (Numeric)</option>
                    <option value="hash">HASH</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingNew(false)}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResolving}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#000F24] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                >
                  {isResolving ? 'Resolving Address...' : 'Save Destination'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-200 px-6 py-3.5 bg-zinc-50/50 rounded-b-2xl dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
