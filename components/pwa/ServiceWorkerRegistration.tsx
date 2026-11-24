"use client";

import { useEffect } from "react";

const MOCKS_ENABLED = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/**
 * Registers the PWA shell service worker (public/sw.js) for the installable
 * dashboard (Issue #136). Skipped entirely when mocks are enabled so this
 * worker never registers alongside MSW's mockServiceWorker.js — the two
 * would otherwise fight over which one controls page fetches.
 */
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (MOCKS_ENABLED) return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").catch((err: unknown) => {
      console.error("[PWA] Service worker registration failed:", err);
    });
  }, []);

  return null;
}
