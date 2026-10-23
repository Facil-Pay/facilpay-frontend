'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  AssetType,
  Payout,
  SavedDestination,
  MerchantBalance,
} from '@/lib/types';
import { StrKey } from '@/lib/stellar/strkey';
import {
  isFederationAddress,
  resolveFederationAddress,
  FederationRecord,
} from '@/lib/stellar/federation';
import {
  getExchangeDetails,
  ExchangeInfo,
} from '@/lib/stellar/exchanges';
import {
  CONFIGURABLE_ANCHORS,
  Sep24Anchor,
  createSep24Session,
} from '@/lib/sep24/anchors';
import { useFormat } from '@/lib/i18n/use-format';
import { useStepUp } from '@/components/security/use-step-up';

interface NewPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: Record<AssetType, MerchantBalance>;
  savedDestinations: SavedDestination[];
  onAddSavedDestination: (dest: SavedDestination) => void;
  onCompletePayout: (payout: Payout, deductedAmount: number, asset: AssetType) => void;
}

type PayoutTab = 'stellar' | 'sep24';
type StellarStep = 'form' | 'review' | 'signing' | 'success';
type Sep24Step = 'form' | 'interactive' | 'success';

export default function NewPayoutModal({
  isOpen,
  onClose,
  balances,
  savedDestinations,
  onAddSavedDestination,
  onCompletePayout,
}: NewPayoutModalProps) {
  const f = useFormat();
  const { requestStepUp, stepUpDialog } = useStepUp();
  const [tab, setTab] = useState<PayoutTab>('stellar');

  // Stellar Address Form State
  const [stellarStep, setStellarStep] = useState<StellarStep>('form');
  const [destinationInput, setDestinationInput] = useState('');
  const [resolvedKey, setResolvedKey] = useState<string | null>(null);
  const [isResolvingFed, setIsResolvingFed] = useState(false);
  const [fedDomain, setFedDomain] = useState<string | undefined>(undefined);
  const [selectedAsset, setSelectedAsset] = useState<AssetType>('USDC');
  const [amountInput, setAmountInput] = useState('');
  const [memoInput, setMemoInput] = useState('');
  const [memoType, setMemoType] = useState<'text' | 'id' | 'hash'>('text');
  const [saveDestination, setSaveDestination] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [stellarError, setStellarError] = useState<string | null>(null);
  const [createdPayout, setCreatedPayout] = useState<Payout | null>(null);

  // SEP-24 Bank Off-Ramp State
  const [sep24Step, setSep24Step] = useState<Sep24Step>('form');
  const [selectedAnchor, setSelectedAnchor] = useState<Sep24Anchor>(CONFIGURABLE_ANCHORS[0]);
  const [sep24Asset, setSep24Asset] = useState<AssetType>('USDC');
  const [sep24Amount, setSep24Amount] = useState('');
  const [sep24Error, setSep24Error] = useState<string | null>(null);
  const [bankHolderName, setBankHolderName] = useState('FacilPay Merchant Operations');
  const [bankName, setBankName] = useState('JPMorgan Chase Bank, N.A.');
  const [ibanOrAccount, setIbanOrAccount] = useState('US89 0001 2345 6789 01');
  const [routingOrSwift, setRoutingOrSwift] = useState('CHASUS33');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setStellarStep('form');
      setSep24Step('form');
      setStellarError(null);
      setSep24Error(null);
      setDestinationInput('');
      setResolvedKey(null);
      setAmountInput('');
      setMemoInput('');
      setSaveDestination(false);
      setSaveLabel('');
      setCreatedPayout(null);
    }
  }, [isOpen]);

  // Destination Resolution & Validation
  useEffect(() => {
    const clean = destinationInput.trim();
    if (!clean) {
      setResolvedKey(null);
      setFedDomain(undefined);
      setStellarError(null);
      return;
    }

    if (StrKey.isValidEd25519PublicKey(clean)) {
      setResolvedKey(clean);
      setFedDomain(undefined);
      setStellarError(null);
    } else if (isFederationAddress(clean)) {
      setIsResolvingFed(true);
      resolveFederationAddress(clean)
        .then((fed) => {
          setIsResolvingFed(false);
          if (fed) {
            setResolvedKey(fed.account_id);
            setFedDomain(fed.domain);
            if (fed.memo && !memoInput) {
              setMemoInput(fed.memo);
              if (fed.memo_type) setMemoType(fed.memo_type as any);
            }
            setStellarError(null);
          } else {
            setResolvedKey(null);
            setStellarError('Could not resolve federation address.');
          }
        })
        .catch(() => {
          setIsResolvingFed(false);
          setResolvedKey(null);
        });
    } else {
      setResolvedKey(null);
      setFedDomain(undefined);
      if (clean.length >= 10 && !clean.includes('*')) {
        setStellarError('Invalid address. Must be a 56-char Stellar G... address or name*domain.com');
      } else {
        setStellarError(null);
      }
    }
  }, [destinationInput]);

  // Check if destination is a known exchange
  const exchangeInfo: ExchangeInfo | null = useMemo(() => {
    if (!resolvedKey && !destinationInput) return null;
    return getExchangeDetails(resolvedKey || destinationInput, fedDomain);
  }, [resolvedKey, destinationInput, fedDomain]);

  if (!isOpen) return null;

  const currentAvailableBalance = balances[selectedAsset]?.available || 0;
  const numAmount = parseFloat(amountInput) || 0;

  // Select Saved Destination Helper
  const handleSelectSaved = (dest: SavedDestination) => {
    setDestinationInput(dest.address);
    if (dest.memo) {
      setMemoInput(dest.memo);
      if (dest.memoType) setMemoType(dest.memoType);
    }
  };

  // Set Max Amount
  const handleSetMax = () => {
    setAmountInput(String(currentAvailableBalance));
  };

  // Handle Review Step for Stellar Address
  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setStellarError(null);

    const cleanDest = destinationInput.trim();
    if (!cleanDest) {
      setStellarError('Please enter a destination Stellar address or federation address.');
      return;
    }

    if (!resolvedKey && !StrKey.isValidEd25519PublicKey(cleanDest)) {
      setStellarError('Destination address is invalid. Check for typos.');
      return;
    }

    if (numAmount <= 0) {
      setStellarError('Please enter an amount greater than 0.');
      return;
    }

    if (numAmount > currentAvailableBalance) {
      setStellarError(
        `Insufficient funds. Available balance is ${f.amount(currentAvailableBalance, selectedAsset)}.`
      );
      return;
    }

    // Check exchange memo requirement
    if (exchangeInfo?.memoRequired && !memoInput.trim()) {
      setStellarError(
        `A memo is strictly required when withdrawing to ${exchangeInfo.name}. Omitting a memo will cause permanent loss of funds.`
      );
      return;
    }

    setStellarStep('review');
  };

  // Handle Wallet Signing Simulation
  const handleSignAndSubmitStellar = async () => {
    try {
      const grant = await requestStepUp('create_payout');
      if (!grant) return;
    } catch (err) {
      setStellarStep('form');
      setStellarError(err instanceof Error ? err.message : 'Could not verify two-factor authentication.');
      return;
    }

    setStellarStep('signing');

    // Simulate wallet signature delay
    setTimeout(() => {
      const txHash = `${Date.now().toString(16)}a5c7f89312d8a4369e01bc34df56890213ef4598a72314bcdef56123490abcde`.slice(0, 64);
      const payoutId = `pout_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

      const newPayout: Payout = {
        id: payoutId,
        date: new Date().toISOString(),
        amount: numAmount,
        asset: selectedAsset,
        status: 'COMPLETED',
        destinationWallet: resolvedKey || destinationInput,
        destinationLabel: destinationInput.includes('*')
          ? destinationInput
          : exchangeInfo?.name || 'External Wallet',
        payoutMethod: 'Stellar Direct Transfer',
        txHash,
        fee: 0.00001,
        memo: memoInput.trim() || undefined,
        memoType: memoInput.trim() ? memoType : undefined,
      };

      // Save destination if user requested
      if (saveDestination && saveLabel.trim()) {
        onAddSavedDestination({
          id: `dest_${Date.now()}`,
          label: saveLabel.trim(),
          address: destinationInput.trim(),
          resolvedAddress: resolvedKey !== destinationInput ? resolvedKey || undefined : undefined,
          memo: memoInput.trim() || undefined,
          memoType: memoInput.trim() ? memoType : undefined,
          isExchange: !!exchangeInfo,
          exchangeName: exchangeInfo?.name,
          createdAt: new Date().toISOString(),
        });
      }

      onCompletePayout(newPayout, numAmount, selectedAsset);
      setCreatedPayout(newPayout);
      setStellarStep('success');
    }, 1200);
  };

  // SEP-24 Flow Handlers
  const currentSep24Balance = balances[sep24Asset]?.available || 0;
  const numSep24Amount = parseFloat(sep24Amount) || 0;

  const handleLaunchSep24 = (e: React.FormEvent) => {
    e.preventDefault();
    setSep24Error(null);

    if (numSep24Amount <= 0) {
      setSep24Error('Please enter a withdrawal amount greater than 0.');
      return;
    }

    if (numSep24Amount > currentSep24Balance) {
      setSep24Error(
        `Insufficient balance. Available is ${f.amount(currentSep24Balance, sep24Asset)}.`
      );
      return;
    }

    setSep24Step('interactive');
  };

  const handleConfirmSep24Interactive = async () => {
    try {
      const grant = await requestStepUp('create_payout');
      if (!grant) return;
    } catch (err) {
      setSep24Step('form');
      setSep24Error(err instanceof Error ? err.message : 'Could not verify two-factor authentication.');
      return;
    }

    const { transaction } = createSep24Session(selectedAnchor, {
      amount: numSep24Amount,
      asset: sep24Asset,
    });

    const payoutId = `pout_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const txHash = `${Date.now().toString(16)}ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100`.slice(0, 64);

    const newPayout: Payout = {
      id: payoutId,
      date: new Date().toISOString(),
      amount: numSep24Amount,
      asset: sep24Asset,
      status: 'PROCESSING',
      destinationWallet: ibanOrAccount,
      destinationLabel: `${selectedAnchor.name} (${bankName})`,
      payoutMethod: `SEP-24 Bank Off-Ramp (${selectedAnchor.name})`,
      txHash,
      fee: transaction.feeAmount,
      anchorName: selectedAnchor.name,
      sep24TransactionId: transaction.id,
      bankDetailsSummary: `${bankName} • ${ibanOrAccount} (${bankHolderName})`,
    };

    onCompletePayout(newPayout, numSep24Amount, sep24Asset);
    setCreatedPayout(newPayout);
    setSep24Step('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 transition-all">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
              Withdraw Funds / New Payout
            </h2>
            <p className="text-xs text-zinc-500">
              Move merchant revenue to an external Stellar address or off-ramp to your bank account
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Selection (Stellar Address vs Bank Off-Ramp) */}
        {stellarStep === 'form' && sep24Step === 'form' && (
          <div className="border-b border-zinc-200 bg-zinc-50/50 px-6 py-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTab('stellar')}
                className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                  tab === 'stellar'
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                External Stellar Address
              </button>
              <button
                type="button"
                onClick={() => setTab('sep24')}
                className={`flex-1 rounded-xl py-2 px-3 text-xs font-semibold transition-all ${
                  tab === 'sep24'
                    ? 'bg-white text-zinc-900 shadow-sm border border-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                Bank Off-Ramp (SEP-24 Anchor)
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">
          {tab === 'stellar' ? (
            /* ================= STELLAR ADDRESS FLOW ================= */
            <div>
              {stellarStep === 'form' && (
                <form onSubmit={handleProceedToReview} className="space-y-4">
                  {stellarError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                      {stellarError}
                    </div>
                  )}

                  {/* Saved Destinations Quick Bar */}
                  {savedDestinations.length > 0 && (
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-1.5">
                        Quick Pick from Saved Destinations
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {savedDestinations.map((sd) => (
                          <button
                            key={sd.id}
                            type="button"
                            onClick={() => handleSelectSaved(sd)}
                            className="rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs text-zinc-700 hover:border-sky-300 hover:bg-sky-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                          >
                            {sd.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Destination Address Field */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Destination Address *
                      </label>
                      {isResolvingFed && (
                        <span className="text-[11px] text-sky-600 dark:text-sky-400 animate-pulse">
                          Resolving federation address...
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        placeholder="G... or name*domain.com"
                        value={destinationInput}
                        onChange={(e) => setDestinationInput(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2.5 font-mono text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                      {resolvedKey && (
                        <span className="absolute right-3 top-2.5 text-emerald-500 text-sm">
                          ✓
                        </span>
                      )}
                    </div>

                    {/* Federation Resolution Badge */}
                    {resolvedKey && resolvedKey !== destinationInput && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono">
                        <span className="text-zinc-400">Resolved Account ID:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                          {resolvedKey}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Known Exchange Memo Warning */}
                  {exchangeInfo && (
                    <div className="rounded-xl border border-amber-300 bg-amber-50/80 p-3.5 dark:border-amber-900/60 dark:bg-amber-950/30">
                      <div className="flex items-start gap-2.5">
                        <span className="text-amber-600 text-sm">⚠️</span>
                        <div className="space-y-1 text-xs">
                          <span className="font-bold text-amber-900 dark:text-amber-200">
                            Centralized Exchange Detected ({exchangeInfo.name})
                          </span>
                          <p className="text-amber-800 dark:text-amber-300">
                            Exchanges use pooled deposit addresses and <strong>strictly require a Memo</strong> ({exchangeInfo.memoTypeDescription}). Omitting the memo will result in permanently unrecoverable funds.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Asset & Amount Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Asset *
                        </label>
                        <span className="text-[11px] text-zinc-500">
                          Avail: {f.amount(currentAvailableBalance, selectedAsset)}
                        </span>
                      </div>
                      <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value as AssetType)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      >
                        <option value="USDC">USDC (Circle USD)</option>
                        <option value="XLM">XLM (Native Stellar)</option>
                        <option value="EURC">EURC (Circle Euro)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Amount *
                        </label>
                        <button
                          type="button"
                          onClick={handleSetMax}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                        >
                          USE MAX
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          required
                          min="0.01"
                          max={currentAvailableBalance}
                          placeholder="0.00"
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Memo Inputs */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Memo {exchangeInfo?.memoRequired ? '(Required for Exchange) *' : '(Optional)'}
                      </label>
                      <input
                        type="text"
                        required={exchangeInfo?.memoRequired}
                        placeholder={exchangeInfo ? `Enter ${exchangeInfo.memoTypeDescription}` : 'Memo text or ID'}
                        value={memoInput}
                        onChange={(e) => setMemoInput(e.target.value)}
                        className={`w-full rounded-xl border px-3.5 py-2 text-xs text-zinc-900 focus:outline-none dark:bg-zinc-800 dark:text-white ${
                          exchangeInfo?.memoRequired && !memoInput.trim()
                            ? 'border-amber-400 bg-amber-50/50'
                            : 'border-zinc-200 bg-zinc-50'
                        }`}
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

                  {/* Save Destination Option */}
                  <div className="pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-700 dark:text-zinc-300">
                      <input
                        type="checkbox"
                        checked={saveDestination}
                        onChange={(e) => setSaveDestination(e.target.checked)}
                        className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Save destination address for future withdrawals</span>
                    </label>

                    {saveDestination && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required={saveDestination}
                          placeholder="Label name (e.g. Binance Operational Deposit)"
                          value={saveLabel}
                          onChange={(e) => setSaveLabel(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                    )}
                  </div>

                  {/* Form Footer Action */}
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
                      className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                    >
                      <span>Review Payout</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}

              {/* Stellar Step 2: Review Details */}
              {stellarStep === 'review' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-800/40 space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                      Payout Summary Review
                    </h3>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-zinc-500 block">Withdrawal Amount</span>
                        <span className="text-lg font-bold text-zinc-900 dark:text-white">
                          {f.amount(numAmount, selectedAsset)}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 block">Network Fee</span>
                        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          0.00001 XLM
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-zinc-200/80 pt-2 dark:border-zinc-700">
                        <span className="text-zinc-500 block">Recipient Address</span>
                        <span className="font-mono text-xs text-zinc-900 dark:text-white break-all">
                          {resolvedKey || destinationInput}
                        </span>
                        {destinationInput.includes('*') && (
                          <span className="text-[11px] text-sky-600 block mt-0.5">
                            Federation: {destinationInput}
                          </span>
                        )}
                      </div>
                      {memoInput && (
                        <div className="col-span-2">
                          <span className="text-zinc-500 block">Memo ({memoType})</span>
                          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-white">
                            {memoInput}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setStellarStep('form')}
                      className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                    >
                      Back to Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSignAndSubmitStellar()}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Sign with Stellar Wallet & Submit
                    </button>
                  </div>
                </div>
              )}

              {/* Stellar Step 3: Wallet Signing */}
              {stellarStep === 'signing' && (
                <div className="py-12 text-center space-y-4">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400">
                    <svg className="h-7 w-7 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      Requesting Wallet Signature...
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                      Please confirm and sign the withdrawal transaction in your Stellar wallet extension (Freighter, Albedo, or Ledger).
                    </p>
                  </div>
                </div>
              )}

              {/* Stellar Step 4: Success */}
              {stellarStep === 'success' && createdPayout && (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                      Payout Successfully Submitted!
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {f.amount(numAmount, selectedAsset)} has been transmitted onto the Stellar ledger.
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-xs text-left font-mono space-y-1 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="text-zinc-500">Transaction Hash:</div>
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${createdPayout.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:underline break-all block"
                    >
                      {createdPayout.txHash}
                    </a>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl bg-[#000F24] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                    >
                      Done & Return to Payouts
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ================= SEP-24 BANK OFF-RAMP FLOW ================= */
            <div>
              {sep24Step === 'form' && (
                <form onSubmit={handleLaunchSep24} className="space-y-4">
                  {sep24Error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                      {sep24Error}
                    </div>
                  )}

                  {/* Pick Regulated Anchor */}
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                      Select Regulated Anchor (SEP-24) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {CONFIGURABLE_ANCHORS.map((anchor) => (
                        <div
                          key={anchor.id}
                          onClick={() => setSelectedAnchor(anchor)}
                          className={`rounded-xl border p-3 cursor-pointer transition-all ${
                            selectedAnchor.id === anchor.id
                              ? 'border-sky-500 bg-sky-50/50 ring-2 ring-sky-500/20 dark:bg-sky-950/20 dark:border-sky-700'
                              : 'border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-zinc-900 dark:text-white">
                              {anchor.name}
                            </span>
                            <span className="text-[10px] text-zinc-400 font-mono">
                              {anchor.domain}
                            </span>
                          </div>
                          <div className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                            {anchor.supportedMethods.join(', ')}
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-sky-600 dark:text-sky-400 mt-2 font-medium">
                            <span>{anchor.estimatedDeliveryTime}</span>
                            <span>{anchor.supportedAssets.join(' / ')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Asset & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                        Off-Ramp Asset *
                      </label>
                      <select
                        value={sep24Asset}
                        onChange={(e) => setSep24Asset(e.target.value as AssetType)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      >
                        {selectedAnchor.supportedAssets.map((ast) => (
                          <option key={ast} value={ast}>
                            {ast} (Avail: {f.amount(balances[ast]?.available ?? 0, ast, { withCode: false })})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          Withdrawal Amount *
                        </label>
                        <button
                          type="button"
                          onClick={() => setSep24Amount(String(currentSep24Balance))}
                          className="text-[11px] font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                        >
                          MAX
                        </button>
                      </div>
                      <input
                        type="number"
                        step="any"
                        required
                        min="1"
                        max={currentSep24Balance}
                        placeholder="0.00"
                        value={sep24Amount}
                        onChange={(e) => setSep24Amount(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>

                  {/* Fee & Delivery Preview */}
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 text-xs space-y-1.5 dark:border-zinc-800 dark:bg-zinc-800/40">
                    <div className="flex justify-between text-zinc-500">
                      <span>Anchor Fee</span>
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {selectedAnchor.feeDescription}
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-500">
                      <span>Estimated Bank Settlement</span>
                      <span className="font-medium text-zinc-900 dark:text-white">
                        {selectedAnchor.estimatedDeliveryTime}
                      </span>
                    </div>
                  </div>

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
                      className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                    >
                      <span>Start Interactive SEP-24 Flow</span>
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </button>
                  </div>
                </form>
              )}

              {/* SEP-24 Step 2: Interactive Session Frame */}
              {sep24Step === 'interactive' && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-3 text-xs text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/20">
                    <span className="font-bold">SEP-24 Interactive Session:</span> {selectedAnchor.name} requires recipient bank account details for direct off-ramp settlement.
                  </div>

                  {/* Simulated Anchor Bank Details Form (embedded inside SEP-24 interactive modal) */}
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                        Recipient Bank Account Information
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        SSL 256-bit Encrypted
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                        Account Holder / Company Name *
                      </label>
                      <input
                        type="text"
                        value={bankHolderName}
                        onChange={(e) => setBankHolderName(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                          SWIFT / BIC / Routing *
                        </label>
                        <input
                          type="text"
                          value={routingOrSwift}
                          onChange={(e) => setRoutingOrSwift(e.target.value)}
                          className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                        IBAN / Account Number *
                      </label>
                      <input
                        type="text"
                        value={ibanOrAccount}
                        onChange={(e) => setIbanOrAccount(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setSep24Step('form')}
                      className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleConfirmSep24Interactive()}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
                    >
                      <span>Authorize Bank Transfer ({numSep24Amount} {sep24Asset})</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SEP-24 Step 3: Success */}
              {sep24Step === 'success' && createdPayout && (
                <div className="text-center py-6 space-y-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                      SEP-24 Off-Ramp Authorized
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      {selectedAnchor.name} has registered your off-ramp request. Funds are processing through the banking rail.
                    </p>
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-left space-y-1.5 dark:border-zinc-800 dark:bg-zinc-900">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Anchor Transaction ID:</span>
                      <span className="font-mono font-semibold text-zinc-900 dark:text-white">
                        {createdPayout.sep24TransactionId}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Destination:</span>
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {createdPayout.bankDetailsSummary}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-xl bg-[#000F24] px-6 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
                    >
                      Done & Return to Payouts
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {stepUpDialog}
    </div>
  );
}
