/// <reference types="vitest/globals" />
/**
 * tests/setup.ts
 *
 * Global test setup for React Testing Library.
 * Imported by vitest.config.ts via `setupFiles`.
 */

import "@testing-library/jest-dom";

// Node 25+ ships an experimental global `localStorage` that shadows jsdom's
// and is unusable without --localstorage-file. Fall back to an in-memory
// Storage so code under test can persist state.
if (typeof window !== "undefined" && typeof window.localStorage?.clear !== "function") {
  class MemoryStorage implements Storage {
    private store = new Map<string, string>();
    get length() {
      return this.store.size;
    }
    clear() {
      this.store.clear();
    }
    getItem(key: string) {
      return this.store.get(key) ?? null;
    }
    key(index: number) {
      return [...this.store.keys()][index] ?? null;
    }
    removeItem(key: string) {
      this.store.delete(key);
    }
    setItem(key: string, value: string) {
      this.store.set(key, String(value));
    }
  }
  for (const name of ["localStorage", "sessionStorage"] as const) {
    const storage = new MemoryStorage();
    Object.defineProperty(window, name, { value: storage, configurable: true });
    Object.defineProperty(globalThis, name, { value: storage, configurable: true });
  }
}
