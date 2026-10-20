"use client";

import React from "react";
import { useTestMode } from "@/lib/test-mode-context";
import { cn } from "@/components/ui/utils";

export function TestModeSwitch() {
  const { isTestMode, toggleMode } = useTestMode();

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={isTestMode}
        aria-label="Toggle Test Mode"
        onClick={toggleMode}
        data-testid="test-mode-switch"
        className={cn(
          "group relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:ring-offset-2",
          isTestMode ? "bg-amber-500" : "bg-zinc-300 dark:bg-zinc-700"
        )}
      >
        <span className="sr-only">Toggle Test Mode</span>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out dark:bg-zinc-100",
            isTestMode ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>

      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors",
          isTestMode
            ? "bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700"
            : "bg-emerald-100 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
        )}
      >
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full animate-pulse",
            isTestMode ? "bg-amber-600" : "bg-emerald-600"
          )}
          aria-hidden="true"
        />
        {isTestMode ? "Test Mode" : "Live Mode"}
      </span>
    </div>
  );
}
