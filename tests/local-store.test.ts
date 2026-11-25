/**
 * tests/local-store.test.ts
 *
 * Covers lib/local-store.ts: the localStorage-backed store consumed through
 * useSyncExternalStore. Each test builds its own store on a fresh key and
 * storage is cleared around every case, so no state leaks between tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createLocalStore } from "@/lib/local-store";

const KEY = "facilpay_local_store_test";

interface Counter {
  count: number;
}

const INITIAL: Counter = { count: 0 };

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("createLocalStore", () => {
  describe("reading", () => {
    it("returns the initial value when nothing is stored", () => {
      const store = createLocalStore<Counter>(KEY, INITIAL);

      expect(store.get()).toBe(INITIAL);
    });

    it("loads the persisted value on first read", () => {
      window.localStorage.setItem(KEY, JSON.stringify({ count: 3 }));
      const store = createLocalStore<Counter>(KEY, INITIAL);

      expect(store.get()).toEqual({ count: 3 });
    });

    it("ignores corrupt JSON and keeps the initial value", () => {
      window.localStorage.setItem(KEY, "{broken");
      const store = createLocalStore<Counter>(KEY, INITIAL);

      expect(() => store.get()).not.toThrow();
      expect(store.get()).toBe(INITIAL);
    });

    it("keeps the initial value when getItem throws SecurityError", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("blocked", "SecurityError");
      });
      const store = createLocalStore<Counter>(KEY, INITIAL);

      expect(store.get()).toBe(INITIAL);
    });

    it("returns the initial value and does not touch storage when window is undefined", () => {
      const getItem = vi.spyOn(Storage.prototype, "getItem");
      vi.stubGlobal("window", undefined);
      const store = createLocalStore<Counter>(KEY, INITIAL);

      expect(store.get()).toBe(INITIAL);
      expect(getItem).not.toHaveBeenCalled();
    });
  });

  describe("writing", () => {
    it("updates the value and persists it as JSON", () => {
      const store = createLocalStore<Counter>(KEY, INITIAL);

      store.set({ count: 1 });

      expect(store.get()).toEqual({ count: 1 });
      expect(window.localStorage.getItem(KEY)).toBe('{"count":1}');
    });

    it("accepts an updater function that receives the previous value", () => {
      const store = createLocalStore<Counter>(KEY, { count: 5 });

      store.set((prev) => ({ count: prev.count + 1 }));

      expect(store.get()).toEqual({ count: 6 });
    });

    it("keeps the in-memory value when setItem throws QuotaExceededError", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("full", "QuotaExceededError");
      });
      const store = createLocalStore<Counter>(KEY, INITIAL);

      expect(() => store.set({ count: 9 })).not.toThrow();
      expect(store.get()).toEqual({ count: 9 });
      expect(window.localStorage.getItem(KEY)).toBeNull();
    });

    it("updates in-memory state without throwing when window is undefined", () => {
      vi.stubGlobal("window", undefined);
      const store = createLocalStore<Counter>(KEY, INITIAL);

      expect(() => store.set({ count: 2 })).not.toThrow();
      expect(store.get()).toEqual({ count: 2 });
    });
  });

  describe("subscriptions", () => {
    it("notifies listeners on every set", () => {
      const store = createLocalStore<Counter>(KEY, INITIAL);
      const listener = vi.fn();
      store.subscribe(listener);

      store.set({ count: 1 });
      store.set({ count: 2 });

      expect(listener).toHaveBeenCalledTimes(2);
    });

    it("stops notifying a listener after unsubscribe", () => {
      const store = createLocalStore<Counter>(KEY, INITIAL);
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store.set({ count: 1 });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("useStore hook", () => {
    it("starts with the stored value and re-renders when the store changes", () => {
      window.localStorage.setItem(KEY, JSON.stringify({ count: 4 }));
      const store = createLocalStore<Counter>(KEY, INITIAL);

      const { result } = renderHook(() => store.useStore());
      expect(result.current).toEqual({ count: 4 });

      act(() => {
        store.set((prev) => ({ count: prev.count * 2 }));
      });

      expect(result.current).toEqual({ count: 8 });
      expect(window.localStorage.getItem(KEY)).toBe('{"count":8}');
    });
  });
});
