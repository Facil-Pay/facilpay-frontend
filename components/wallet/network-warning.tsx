"use client";

import { AlertTriangle } from "lucide-react";
import { useWallet } from "./wallet-provider";
import { useTestMode } from "@/lib/test-mode-context";

export function WalletNetworkWarning() {
  const { configuredNetwork, isNetworkMismatch, isNetworkUnverified, network, isConnected } = useWallet();
  const { mode, isTestMode } = useTestMode();

  // Check mismatch between wallet and active Test/Live mode
  const normalizedWalletNet = (network || "").toLowerCase();
  const isWalletMainnet =
    normalizedWalletNet.includes("public") || normalizedWalletNet.includes("mainnet");
  const isWalletTestnet =
    normalizedWalletNet.includes("testnet") || normalizedWalletNet.includes("test");

  const modeMismatch =
    isConnected &&
    network &&
    ((isTestMode && isWalletMainnet) || (!isTestMode && isWalletTestnet));

  if (modeMismatch) {
    const targetNet = isTestMode ? "Stellar Testnet" : "Stellar Public (Mainnet)";
    const currentNet = isWalletMainnet ? "Mainnet" : "Testnet";
    return (
      <div
        role="alert"
        data-testid="wallet-network-mismatch-warning"
        className="flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 sm:px-8 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p>
          <strong>Wallet Network Mismatch:</strong> Your wallet is connected to {currentNet}, but FacilPay is currently in{" "}
          {isTestMode ? "Test Mode" : "Live Mode"}. Please switch your wallet network to {targetNet} before signing transactions.
        </p>
      </div>
    );
  }

  if (isNetworkMismatch) {
    return (
      <div
        role="alert"
        data-testid="wallet-network-warning"
        className="flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 sm:px-8 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p>
          Your wallet is connected to {network}. Switch it to {configuredNetwork} before signing transactions.
        </p>
      </div>
    );
  }

  if (isNetworkUnverified) {
    return (
      <div
        role="alert"
        className="flex items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 sm:px-8 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
      >
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <p>The connected wallet network could not be verified. Transaction signing is disabled.</p>
      </div>
    );
  }

  return null;
}
