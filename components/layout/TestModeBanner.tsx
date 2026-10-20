"use client";

/**
 * components/layout/TestModeBanner.tsx
 *
 * Sticky amber banner displayed on every dashboard page while the app is
 * running in testnet mode.  Includes a quick-switch button so the merchant
 * can flip to live mode without navigating to settings.
 */

import { FlaskConical } from "lucide-react";
import { useNetworkMode } from "@/lib/network-mode-context";

export function TestModeBanner() {
  const { isTestnet, setMode } = useNetworkMode();

  if (!isTestnet) return null;

  return (
    <div
      role="status"
      aria-label="Test mode active"
      className="flex items-center justify-between gap-3 bg-amber-50 border-b border-amber-200 px-4 py-2 text-amber-900 text-sm"
    >
      <span className="flex items-center gap-2 font-medium">
        <FlaskConical className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
        You are viewing&nbsp;<strong>testnet</strong>&nbsp;data.
        Transactions here use no real funds.
      </span>
      <button
        type="button"
        onClick={() => setMode("mainnet")}
        className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 transition-colors"
      >
        Switch to Live
      </button>
    </div>
  );
}
