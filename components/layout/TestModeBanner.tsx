"use client";

import React, { useState } from "react";
import { useTestMode } from "@/lib/test-mode-context";
import { TestModeToolsModal } from "./TestModeToolsModal";
import { FlaskConical, Send, Coins, ArrowRight } from "lucide-react";

export function TestModeBanner() {
  const { isTestMode, setMode } = useTestMode();
  const [modalOpen, setModalOpen] = useState(false);
  const [defaultTab, setDefaultTab] = useState<"faucet" | "simulate">("simulate");

  if (!isTestMode) return null;

  const openSimulate = () => {
    setDefaultTab("simulate");
    setModalOpen(true);
  };

  const openFaucet = () => {
    setDefaultTab("faucet");
    setModalOpen(true);
  };

  return (
    <>
      <aside
        aria-label="Test Mode Active"
        data-testid="test-mode-banner"
        className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-400 px-4 py-2 text-xs font-medium text-amber-950 sm:px-6 lg:px-8 dark:border-amber-500/40 dark:bg-amber-500/20 dark:text-amber-200"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-950/10 dark:bg-amber-400/20">
            <FlaskConical className="h-3.5 w-3.5 text-amber-900 dark:text-amber-300" aria-hidden="true" />
          </span>
          <p className="leading-tight">
            <strong className="font-semibold uppercase tracking-wider">Test Mode Active:</strong>{" "}
            You are viewing simulated testnet data. No real cryptocurrency or funds are moved.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSimulate}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-950/10 px-2.5 py-1 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-950/20 dark:bg-amber-400/20 dark:text-amber-100 dark:hover:bg-amber-400/30"
          >
            <Send className="h-3 w-3" />
            Simulate Payment
          </button>

          <button
            type="button"
            onClick={openFaucet}
            className="inline-flex items-center gap-1.5 rounded-md bg-amber-950/10 px-2.5 py-1 text-xs font-semibold text-amber-950 transition-colors hover:bg-amber-950/20 dark:bg-amber-400/20 dark:text-amber-100 dark:hover:bg-amber-400/30"
          >
            <Coins className="h-3 w-3" />
            Friendbot
          </button>

          <button
            type="button"
            onClick={() => setMode("mainnet")}
            className="inline-flex items-center gap-1 rounded-md bg-white/70 px-2.5 py-1 text-xs font-semibold text-zinc-900 shadow-2xs transition-colors hover:bg-white dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
          >
            Switch to Live
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </aside>

      <TestModeToolsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultTab={defaultTab}
      />
    </>
  );
}
