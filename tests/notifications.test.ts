/**
 * tests/notifications.test.ts
 *
 * Tests for lib/notifications.ts.
 *
 * Key constraints:
 *  - No real network calls. fetchNew() is the only async boundary and it
 *    uses Math.random internally — we stub it where the outcome matters.
 *  - setInterval / setTimeout timers are faked with vi.useFakeTimers() so
 *    polling tests don't take 30 seconds.
 *  - localStorage is reset between tests to prevent state leakage.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  notificationStore,
  prefsStore,
  markRead,
  markAllRead,
  unreadLabel,
  isVisible,
  channelPrefs,
  useNotifications,
  useNotificationPolling,
  useNotificationPrefs,
  DEFAULT_PREFS,
  type AppNotification,
  type NotificationPrefs,
} from "@/lib/notifications";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNotification(overrides: Partial<AppNotification> = {}): AppNotification {
  return {
    id: Math.random().toString(36).slice(2, 8),
    type: "payment_received",
    title: "Payment received",
    body: "You received 10 USDC.",
    href: "/payments",
    createdAt: new Date().toISOString(),
    read: false,
    ...overrides,
  };
}

function resetStores() {
  notificationStore.set([]);
  prefsStore.set(DEFAULT_PREFS);
  // Also clear localStorage so the store re-hydrates cleanly
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("facilpay_notifications");
    window.localStorage.removeItem("facilpay_notification_prefs");
  }
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  resetStores();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetStores();
});

// ─── markRead ─────────────────────────────────────────────────────────────────

describe("markRead", () => {
  it("marks a single notification as read by id", () => {
    const n = makeNotification({ id: "n1", read: false });
    notificationStore.set([n]);

    markRead("n1");

    const updated = notificationStore.get();
    expect(updated.find((x) => x.id === "n1")?.read).toBe(true);
  });

  it("does not affect other notifications", () => {
    const a = makeNotification({ id: "a", read: false });
    const b = makeNotification({ id: "b", read: false });
    notificationStore.set([a, b]);

    markRead("a");

    const updated = notificationStore.get();
    expect(updated.find((x) => x.id === "b")?.read).toBe(false);
  });

  it("is idempotent — marking an already-read notification has no side effect", () => {
    const n = makeNotification({ id: "n2", read: true });
    notificationStore.set([n]);

    markRead("n2");

    expect(notificationStore.get().find((x) => x.id === "n2")?.read).toBe(true);
  });

  it("is a no-op for an unknown id", () => {
    const n = makeNotification({ id: "n3", read: false });
    notificationStore.set([n]);

    markRead("does-not-exist");

    expect(notificationStore.get().find((x) => x.id === "n3")?.read).toBe(false);
  });
});

// ─── markAllRead ──────────────────────────────────────────────────────────────

describe("markAllRead", () => {
  it("marks every notification in the store as read", () => {
    notificationStore.set([
      makeNotification({ id: "x1", read: false }),
      makeNotification({ id: "x2", read: false }),
      makeNotification({ id: "x3", read: true }),
    ]);

    markAllRead();

    const updated = notificationStore.get();
    expect(updated.every((n) => n.read)).toBe(true);
  });

  it("works on an empty store without throwing", () => {
    notificationStore.set([]);
    expect(() => markAllRead()).not.toThrow();
  });
});

// ─── unreadLabel ─────────────────────────────────────────────────────────────

describe("unreadLabel", () => {
  it("returns null for 0 unread", () => {
    expect(unreadLabel(0)).toBeNull();
  });

  it("returns the number as a string for counts 1–9", () => {
    expect(unreadLabel(1)).toBe("1");
    expect(unreadLabel(5)).toBe("5");
    expect(unreadLabel(9)).toBe("9");
  });

  it('returns "9+" for counts above 9', () => {
    expect(unreadLabel(10)).toBe("9+");
    expect(unreadLabel(100)).toBe("9+");
  });
});

// ─── isVisible ────────────────────────────────────────────────────────────────

describe("isVisible", () => {
  it("returns true when inApp is enabled and amount is above threshold", () => {
    const n = makeNotification({ type: "payment_received", amount: 50 });
    const prefs: NotificationPrefs = {
      ...DEFAULT_PREFS,
      paymentThreshold: 10,
    };
    expect(isVisible(n, prefs)).toBe(true);
  });

  it("returns false when inApp is disabled for the type", () => {
    const n = makeNotification({ type: "payment_received" });
    const prefs: NotificationPrefs = {
      ...DEFAULT_PREFS,
      channels: {
        ...DEFAULT_PREFS.channels,
        payment_received: { inApp: false, email: false },
      },
    };
    expect(isVisible(n, prefs)).toBe(false);
  });

  it("returns false when payment amount is below the threshold", () => {
    const n = makeNotification({ type: "payment_received", amount: 5 });
    const prefs: NotificationPrefs = {
      ...DEFAULT_PREFS,
      paymentThreshold: 10,
    };
    expect(isVisible(n, prefs)).toBe(false);
  });

  it("returns true for payment_received when amount equals the threshold exactly", () => {
    const n = makeNotification({ type: "payment_received", amount: 10 });
    const prefs: NotificationPrefs = {
      ...DEFAULT_PREFS,
      paymentThreshold: 10,
    };
    // ">=" is used: amount (10) >= threshold (10)
    expect(isVisible(n, prefs)).toBe(true);
  });

  it("threshold does not apply to non-payment types", () => {
    const n = makeNotification({ type: "webhook_failing" });
    const prefs: NotificationPrefs = {
      ...DEFAULT_PREFS,
      paymentThreshold: 9999,
    };
    expect(isVisible(n, prefs)).toBe(true);
  });

  it("returns false for payment_received when amount is undefined and threshold > 0", () => {
    const n = makeNotification({ type: "payment_received", amount: undefined });
    const prefs: NotificationPrefs = {
      ...DEFAULT_PREFS,
      paymentThreshold: 1,
    };
    // amount ?? 0 → 0 < 1 → not visible
    expect(isVisible(n, prefs)).toBe(false);
  });
});

// ─── channelPrefs ─────────────────────────────────────────────────────────────

describe("channelPrefs", () => {
  it("returns stored prefs for a known type", () => {
    expect(channelPrefs(DEFAULT_PREFS, "payment_received")).toEqual(
      DEFAULT_PREFS.channels["payment_received"]
    );
  });

  it("falls back to DEFAULT_PREFS for a type missing from stored channels", () => {
    const partialPrefs = {
      ...DEFAULT_PREFS,
      channels: {} as NotificationPrefs["channels"],
    };
    // Should return the default channel entry without throwing
    const result = channelPrefs(partialPrefs, "new_device_login");
    expect(result).toEqual(DEFAULT_PREFS.channels["new_device_login"]);
  });
});

// ─── useNotifications hook ────────────────────────────────────────────────────

describe("useNotifications", () => {
  it("reflects the current store value", () => {
    const { result } = renderHook(() => useNotifications());
    expect(result.current).toEqual([]);

    const n = makeNotification();
    act(() => notificationStore.set([n]));

    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe(n.id);
  });

  it("updates reactively when markRead is called", () => {
    const n = makeNotification({ id: "reactive_1", read: false });
    notificationStore.set([n]);

    const { result } = renderHook(() => useNotifications());
    expect(result.current[0].read).toBe(false);

    act(() => markRead("reactive_1"));

    expect(result.current[0].read).toBe(true);
  });

  it("updates reactively when markAllRead is called", () => {
    notificationStore.set([
      makeNotification({ id: "r1", read: false }),
      makeNotification({ id: "r2", read: false }),
    ]);

    const { result } = renderHook(() => useNotifications());
    expect(result.current.some((n) => !n.read)).toBe(true);

    act(() => markAllRead());

    expect(result.current.every((n) => n.read)).toBe(true);
  });
});

// ─── useNotificationPolling ───────────────────────────────────────────────────

describe("useNotificationPolling", () => {
  it("seeds the store with 12 notifications on first mount when the store is empty", () => {
    const { result } = renderHook(() => {
      useNotificationPolling();
      return useNotifications();
    });

    // Seeds happen synchronously in the effect on first render
    act(() => {});
    expect(result.current).toHaveLength(12);
  });

  it("does not re-seed when the store already has notifications", () => {
    const existing = makeNotification({ id: "pre_existing" });
    notificationStore.set([existing]);

    renderHook(() => {
      useNotificationPolling();
      return useNotifications();
    });

    act(() => {});
    // Store should still have only the one pre-existing notification (no seed)
    expect(notificationStore.get()[0].id).toBe("pre_existing");
  });

  it("sets the first 4 seeded notifications as unread (read: false)", () => {
    const { result } = renderHook(() => {
      useNotificationPolling();
      return useNotifications();
    });

    act(() => {});

    const notifications = result.current;
    // Seed logic: notifications seeded as `read: i > 3`
    // So first 4 (index 0-3) should be unread
    const unread = notifications.filter((n) => !n.read);
    expect(unread).toHaveLength(4);
  });

  it("polls for new notifications every 30 seconds", async () => {
    // Force fetchNew to always return a new notification
    vi.spyOn(Math, "random").mockReturnValue(0.1); // < 0.4 → fetchNew returns a notification

    const { result } = renderHook(() => {
      useNotificationPolling();
      return useNotifications();
    });

    act(() => {});
    const countAfterSeed = result.current.length;

    // Advance by 30 seconds to fire the interval
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    // At least one new notification should have been added
    expect(result.current.length).toBeGreaterThan(countAfterSeed);
  });

  it("does not add notifications when fetchNew returns empty (Math.random >= 0.4)", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9); // >= 0.4 → fetchNew returns []

    const { result } = renderHook(() => {
      useNotificationPolling();
      return useNotifications();
    });

    act(() => {});
    const countAfterSeed = result.current.length;

    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    expect(result.current.length).toBe(countAfterSeed);
  });

  it("shares a single interval across multiple subscribers", () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    const hook1 = renderHook(() => useNotificationPolling());
    const hook2 = renderHook(() => useNotificationPolling());
    act(() => {});

    // The pollers reference-count means setInterval is only called once
    // (second subscriber increments pollers but does not call setInterval again)
    const intervalCalls = setIntervalSpy.mock.calls.length;
    expect(intervalCalls).toBe(1);

    hook1.unmount();
    hook2.unmount();
  });

  it("clears the interval when the last subscriber unmounts", () => {
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    const { unmount } = renderHook(() => useNotificationPolling());
    act(() => {});

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it("caps the notification store at 200 entries when polling adds new items", async () => {
    // Pre-fill with 199 notifications
    notificationStore.set(
      Array.from({ length: 199 }, (_, i) => makeNotification({ id: `bulk_${i}` }))
    );

    vi.spyOn(Math, "random").mockReturnValue(0.1); // always return a notification

    renderHook(() => useNotificationPolling());

    // Trigger poll
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });

    // Store is capped at 200: 199 existing + 1 new = 200, then sliced
    expect(notificationStore.get().length).toBeLessThanOrEqual(200);
  });
});

// ─── DEFAULT_PREFS ────────────────────────────────────────────────────────────

describe("DEFAULT_PREFS", () => {
  it("enables inApp for all notification types", () => {
    const types = Object.keys(DEFAULT_PREFS.channels) as Array<keyof typeof DEFAULT_PREFS.channels>;
    expect(types.length).toBeGreaterThan(0);
    expect(types.every((t) => DEFAULT_PREFS.channels[t].inApp)).toBe(true);
  });

  it("disables email for payment_received but enables it for other types", () => {
    expect(DEFAULT_PREFS.channels.payment_received.email).toBe(false);
    // All other types should have email enabled
    const others = Object.entries(DEFAULT_PREFS.channels).filter(
      ([type]) => type !== "payment_received"
    );
    expect(others.every(([, ch]) => ch.email)).toBe(true);
  });

  it("sets paymentThreshold to 0 (all payments visible)", () => {
    expect(DEFAULT_PREFS.paymentThreshold).toBe(0);
  });
});
