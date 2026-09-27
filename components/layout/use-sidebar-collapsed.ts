"use client";

import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "fp_sidebar_collapsed";
const listeners = new Set<() => void>();

function readCollapsed(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Keep multiple tabs in sync
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/**
 * Desktop sidebar collapsed state, persisted in localStorage so it
 * survives a reload. Renders expanded on the server to avoid a hydration
 * mismatch, then syncs with the stored value on the client.
 */
export function useSidebarCollapsed() {
  const collapsed = useSyncExternalStore(subscribe, readCollapsed, () => false);

  const setCollapsed = useCallback((next: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Storage unavailable (private mode) — state simply won't persist
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [collapsed, setCollapsed] as const;
}
