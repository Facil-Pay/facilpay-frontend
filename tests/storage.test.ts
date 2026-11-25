/**
 * tests/storage.test.ts
 *
 * Covers lib/storage.ts: the localStorage helpers, the SSR guard when
 * `window` is undefined, and resilience when storage throws (private mode,
 * blocked cookies, exhausted quota). Storage is cleared around every test so
 * no state leaks between cases.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  STORAGE_KEYS,
  INITIAL_GETTING_STARTED,
  INITIAL_ONBOARDING_STATE,
  INITIAL_USER,
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
  getOnboardingState,
  saveOnboardingState,
  getGettingStartedTasks,
  saveGettingStartedTasks,
  getMerchantUser,
  saveMerchantUser,
  resetOnboardingProgress,
} from "@/lib/storage";
import type { OnboardingState } from "@/types/onboarding";

const TEST_KEY = "facilpay_test_key";

function makeQuotaError(): DOMException {
  return new DOMException("The quota has been exceeded.", "QuotaExceededError");
}

function makeSecurityError(): DOMException {
  return new DOMException("The operation is insecure.", "SecurityError");
}

beforeEach(() => {
  window.localStorage.clear();
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  // Restore `window` first, then reset storage, so the clear reaches the real jsdom store.
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe("loadFromStorage / saveToStorage / removeFromStorage", () => {
  describe("happy paths", () => {
    it("round-trips a JSON-serialisable value", () => {
      saveToStorage(TEST_KEY, { count: 2, tags: ["a", "b"] });

      expect(window.localStorage.getItem(TEST_KEY)).toBe('{"count":2,"tags":["a","b"]}');
      expect(loadFromStorage(TEST_KEY, null)).toEqual({ count: 2, tags: ["a", "b"] });
    });

    it("returns the fallback when the key has never been written", () => {
      const fallback = { count: 0 };

      expect(loadFromStorage(TEST_KEY, fallback)).toBe(fallback);
    });

    it("overwrites an existing value on a second save", () => {
      saveToStorage(TEST_KEY, "first");
      saveToStorage(TEST_KEY, "second");

      expect(loadFromStorage(TEST_KEY, "")).toBe("second");
    });

    it("removes a key so the fallback is returned afterwards", () => {
      saveToStorage(TEST_KEY, "value");
      removeFromStorage(TEST_KEY);

      expect(window.localStorage.getItem(TEST_KEY)).toBeNull();
      expect(loadFromStorage(TEST_KEY, "fallback")).toBe("fallback");
    });

    it("treats an empty stored string as absent", () => {
      window.localStorage.setItem(TEST_KEY, "");

      expect(loadFromStorage(TEST_KEY, "fallback")).toBe("fallback");
    });
  });

  describe("JSON parse failures", () => {
    it("returns the fallback when the stored JSON is corrupt", () => {
      window.localStorage.setItem(TEST_KEY, "{not valid json");

      expect(loadFromStorage(TEST_KEY, { ok: true })).toEqual({ ok: true });
    });

    it("logs a warning that names the failing key", () => {
      window.localStorage.setItem(TEST_KEY, "{not valid json");

      loadFromStorage(TEST_KEY, null);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining(TEST_KEY),
        expect.any(SyntaxError)
      );
    });
  });

  describe("storage that throws", () => {
    it("does not throw when setItem hits QuotaExceededError", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw makeQuotaError();
      });

      expect(() => saveToStorage(TEST_KEY, { big: true })).not.toThrow();
      expect(console.warn).toHaveBeenCalled();
    });

    it("does not throw when setItem hits SecurityError (blocked cookies)", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw makeSecurityError();
      });

      expect(() => saveToStorage(TEST_KEY, "x")).not.toThrow();
      expect(window.localStorage.getItem(TEST_KEY)).toBeNull();
    });

    it("returns the fallback when getItem hits SecurityError", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw makeSecurityError();
      });

      expect(loadFromStorage(TEST_KEY, "fallback")).toBe("fallback");
      expect(console.warn).toHaveBeenCalled();
    });

    it("does not throw when removeItem fails in private mode", () => {
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw makeSecurityError();
      });

      expect(() => removeFromStorage(TEST_KEY)).not.toThrow();
    });
  });

  describe("SSR safety when window is undefined", () => {
    it("loadFromStorage returns the fallback without touching storage", () => {
      const getItem = vi.spyOn(Storage.prototype, "getItem");
      vi.stubGlobal("window", undefined);

      expect(loadFromStorage(TEST_KEY, "fallback")).toBe("fallback");
      expect(getItem).not.toHaveBeenCalled();
    });

    it("saveToStorage is a no-op", () => {
      const setItem = vi.spyOn(Storage.prototype, "setItem");
      vi.stubGlobal("window", undefined);

      expect(() => saveToStorage(TEST_KEY, "value")).not.toThrow();
      expect(setItem).not.toHaveBeenCalled();
    });

    it("removeFromStorage is a no-op", () => {
      const removeItem = vi.spyOn(Storage.prototype, "removeItem");
      vi.stubGlobal("window", undefined);

      expect(() => removeFromStorage(TEST_KEY)).not.toThrow();
      expect(removeItem).not.toHaveBeenCalled();
    });

    it("domain getters fall back to their initial state on the server", () => {
      vi.stubGlobal("window", undefined);

      expect(getOnboardingState()).toEqual(INITIAL_ONBOARDING_STATE);
      expect(getGettingStartedTasks()).toEqual(INITIAL_GETTING_STARTED);
      expect(getMerchantUser()).toEqual(INITIAL_USER);
    });
  });
});

describe("domain helpers", () => {
  it("getOnboardingState returns the initial state when nothing is saved", () => {
    expect(getOnboardingState()).toEqual(INITIAL_ONBOARDING_STATE);
  });

  it("saves and reloads onboarding progress", () => {
    const state: OnboardingState = {
      ...INITIAL_ONBOARDING_STATE,
      currentStep: 3,
      completedSteps: [1, 2],
      business: { ...INITIAL_ONBOARDING_STATE.business, name: "Acme" },
    };

    saveOnboardingState(state);

    expect(getOnboardingState()).toEqual(state);
  });

  it("does not touch the merchant user while onboarding is incomplete", () => {
    saveOnboardingState({ ...INITIAL_ONBOARDING_STATE, currentStep: 2 });

    expect(window.localStorage.getItem(STORAGE_KEYS.MERCHANT_USER)).toBeNull();
  });

  it("marks the merchant profile complete when onboarding finishes", () => {
    saveOnboardingState({
      ...INITIAL_ONBOARDING_STATE,
      isCompleted: true,
      business: { ...INITIAL_ONBOARDING_STATE.business, name: "Acme Store" },
    });

    expect(getMerchantUser()).toMatchObject({
      isProfileCompleted: true,
      name: "Acme Store",
    });
  });

  it("keeps the existing merchant name when the business name is empty", () => {
    saveMerchantUser({ ...INITIAL_USER, name: "Existing Name" });

    saveOnboardingState({ ...INITIAL_ONBOARDING_STATE, isCompleted: true });

    expect(getMerchantUser().name).toBe("Existing Name");
  });

  it("saves and reloads getting-started tasks", () => {
    const tasks = { ...INITIAL_GETTING_STARTED, addWebhook: true, dismissed: true };

    saveGettingStartedTasks(tasks);

    expect(getGettingStartedTasks()).toEqual(tasks);
  });

  it("resetOnboardingProgress clears onboarding keys only", () => {
    saveOnboardingState({ ...INITIAL_ONBOARDING_STATE, currentStep: 4 });
    saveGettingStartedTasks({ ...INITIAL_GETTING_STARTED, createApiKey: true });
    saveMerchantUser(INITIAL_USER);
    window.localStorage.setItem(STORAGE_KEYS.WEBHOOKS, "[]");

    resetOnboardingProgress();

    expect(window.localStorage.getItem(STORAGE_KEYS.ONBOARDING_DATA)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.GETTING_STARTED)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.MERCHANT_USER)).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEYS.WEBHOOKS)).toBe("[]");
  });
});
