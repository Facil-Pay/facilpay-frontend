"use client";

import { useSyncExternalStore } from "react";

/** Minimal localStorage-backed store usable from React via `useStore`. */
export function createLocalStore<T>(key: string, initial: T) {
  let state = initial;
  let loaded = false;
  const listeners = new Set<() => void>();

  const load = () => {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) state = JSON.parse(raw) as T;
    } catch {
      /* ignore corrupt storage */
    }
  };

  const get = () => {
    load();
    return state;
  };

  const set = (next: T | ((prev: T) => T)) => {
    state = typeof next === "function" ? (next as (prev: T) => T)(get()) : next;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* storage unavailable */
    }
    listeners.forEach((l) => l());
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const useStore = () => useSyncExternalStore(subscribe, get, () => initial);

  return { get, set, subscribe, useStore };
}
