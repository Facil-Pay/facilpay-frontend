"use client";

import React, { useState } from "react";
import { useTestMode } from "@/lib/test-mode-context";
import { useWallet } from "@/components/wallet/wallet-provider";
import { useToast } from "@/components/ui";
import { Coins, Send, X, Loader2, Sparkles } from "lucide-react";

interface TestModeToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "faucet" | "simulate";
}

export function TestModeToolsModal({
  isOpen,
  onClose,
  defaultTab = "simulate",
}: TestModeToolsModalProps) {
  const { fundFriendbot, simulatePayment } = useTestMode();
  const { address } = useWallet();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<"faucet" | "simulate">(defaultTab);
  const [faucetAddress, setFaucetAddress] = useState(address || "");
  const [isFunding, setIsFunding] = useState(false);

  const [simAmount, setSimAmount] = useState("50.00");
  const [simAsset, setSimAsset] = useState("USDC");
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsFunding(true);
    try {
      const result = await fundFriendbot(faucetAddress || address || undefined);
      if (result.success) {
        toast(result.message, "success");
        onClose();
      } else {
        toast(result.message, "error");
      }
    } finally {
      setIsFunding(false);
    }
  };

  const handleSimulate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSimulating(true);
    try {
      const result = await simulatePayment({
        amount: simAmount,
        asset_code: simAsset,
      });
      if (result.success) {
        toast(`Simulated payment received: ${result.payment.amount} ${result.payment.asset_code}`, "success");
        onClose();
      }
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="test-tools-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-xs"
    >
      <div className="relative w-full max-w-md rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 id="test-tools-title" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Test Mode Tools
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-zinc-200 px-6 pt-2 dark:border-zinc-800">
          <button
            type="button"
            onClick={() => setActiveTab("simulate")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "simulate"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Send className="h-4 w-4" />
            Simulate Payment
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("faucet")}
            className={`flex items-center gap-2 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === "faucet"
                ? "border-amber-500 text-amber-600 dark:text-amber-400"
                : "border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            }`}
          >
            <Coins className="h-4 w-4" />
            Friendbot Faucet
          </button>
        </div>

        <div className="p-6">
          {activeTab === "simulate" ? (
            <form onSubmit={handleSimulate} className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Generate a simulated customer payment to test webhooks, real-time balances, and receipt workflows without sending on-chain funds.
              </p>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={simAmount}
                  onChange={(e) => setSimAmount(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Asset
                </label>
                <select
                  value={simAsset}
                  onChange={(e) => setSimAsset(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                >
                  <option value="USDC">USDC (Circle USD)</option>
                  <option value="XLM">XLM (Native Stellar Lumens)</option>
                  <option value="EURC">EURC (Circle Euro)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSimulating}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Simulating...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Dispatch Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleFund} className="space-y-4">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Fund any Stellar public key with 10,000 testnet XLM via the official SDF Friendbot faucet.
              </p>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Stellar Account Address (Public Key)
                </label>
                <input
                  type="text"
                  required
                  placeholder="G..."
                  value={faucetAddress}
                  onChange={(e) => setFaucetAddress(e.target.value)}
                  className="mt-1 block w-full font-mono text-xs rounded-md border border-zinc-300 px-3 py-2 text-zinc-900 shadow-xs focus:border-amber-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
                {address && address !== faucetAddress && (
                  <button
                    type="button"
                    onClick={() => setFaucetAddress(address)}
                    className="mt-1 text-xs text-amber-600 hover:underline dark:text-amber-400"
                  >
                    Use connected wallet ({address.slice(0, 4)}...{address.slice(-4)})
                  </button>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFunding}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  {isFunding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Requesting Lumens...
                    </>
                  ) : (
                    <>
                      <Coins className="h-4 w-4" />
                      Fund 10,000 XLM
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
