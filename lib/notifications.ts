"use client";

import { useEffect } from "react";
import { createLocalStore } from "./local-store";

export const NOTIFICATION_TYPES = {
  payment_received: { icon: "💰", label: "Payment received", href: "/payments" },
  refund_completed: { icon: "↩️", label: "Refund completed", href: "/refunds" },
  refund_failed: { icon: "↩️", label: "Refund failed", href: "/refunds" },
  webhook_failing: { icon: "⚠️", label: "Webhook endpoint failing", href: "/settings/webhooks" },
  escrow_dispute: { icon: "⚖️", label: "Escrow dispute raised", href: "/escrow" },
  escrow_releasing: { icon: "⚖️", label: "Escrow releasing soon", href: "/escrow" },
  team_joined: { icon: "👥", label: "Team member joined", href: "/settings/team" },
  api_key_expiring: { icon: "🔑", label: "API key expiring soon", href: "/settings/api-keys" },
  new_device_login: { icon: "🔐", label: "New device sign-in", href: "/settings/security" },
  low_balance_alert: { icon: "🪫", label: "Low balance alert", href: "/balances" },
  large_payment_alert: { icon: "💸", label: "Large payment alert", href: "/payments" },
} as const;
export type NotificationType = keyof typeof NOTIFICATION_TYPES;

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  href: string;
  amount?: number;
  createdAt: string;
  read: boolean;
}

export interface NotificationPrefs {
  channels: Record<NotificationType, { inApp: boolean; email: boolean }>;
  paymentThreshold: number;
}

const TYPES = Object.keys(NOTIFICATION_TYPES) as NotificationType[];

export const DEFAULT_PREFS: NotificationPrefs = {
  paymentThreshold: 0,
  channels: Object.fromEntries(TYPES.map((t) => [t, { inApp: true, email: t !== "payment_received" }])) as NotificationPrefs["channels"],
};

export const notificationStore = createLocalStore<AppNotification[]>("facilpay_notifications", []);
export const prefsStore = createLocalStore<NotificationPrefs>("facilpay_notification_prefs", DEFAULT_PREFS);

export const useNotifications = notificationStore.useStore;

// ─── Per-asset low balance / large payment thresholds (issue #132) ────────────

export interface AssetThreshold {
  /** Alert when the available balance drops below this amount. 0 disables the alert. */
  lowBalance: number;
  /** Alert when a single payment in this asset is at or above this amount. 0 disables the alert. */
  largePayment: number;
}

const DEFAULT_ASSET_THRESHOLDS: Record<string, AssetThreshold> = {
  USDC: { lowBalance: 1000, largePayment: 5000 },
  XLM: { lowBalance: 2000, largePayment: 10000 },
  EURC: { lowBalance: 1000, largePayment: 5000 },
};

export const assetThresholdsStore = createLocalStore<Record<string, AssetThreshold>>(
  "facilpay_asset_thresholds",
  DEFAULT_ASSET_THRESHOLDS,
);
export const useAssetThresholds = assetThresholdsStore.useStore;

export function thresholdFor(assetCode: string): AssetThreshold {
  return assetThresholdsStore.get()[assetCode] ?? { lowBalance: 0, largePayment: 0 };
}

/** Tracks which assets currently have an active low-balance alert, so we only re-alert after balance recovers above the threshold and drops again. */
const balanceAlertStateStore = createLocalStore<Record<string, boolean>>("facilpay_balance_alert_state", {});

function pushNotification(n: Omit<AppNotification, "id" | "createdAt" | "read">) {
  notificationStore.set((list) => [
    { ...n, id: Math.random().toString(36).slice(2, 10), createdAt: new Date().toISOString(), read: false },
    ...list,
  ]);
}

/** Call whenever balances are loaded/refreshed. Fires at most once per crossing until the balance recovers above the threshold. */
export function checkLowBalance(assetCode: string, availableBalance: number) {
  const threshold = thresholdFor(assetCode);
  const state = balanceAlertStateStore.get();
  const isBelow = threshold.lowBalance > 0 && availableBalance < threshold.lowBalance;

  if (isBelow && !state[assetCode]) {
    balanceAlertStateStore.set((prev) => ({ ...prev, [assetCode]: true }));
    pushNotification({
      type: "low_balance_alert",
      title: NOTIFICATION_TYPES.low_balance_alert.label,
      body: `Your ${assetCode} balance (${availableBalance.toLocaleString()}) dropped below your alert threshold of ${threshold.lowBalance.toLocaleString()}.`,
      href: NOTIFICATION_TYPES.low_balance_alert.href,
      amount: availableBalance,
    });
  } else if (!isBelow && state[assetCode]) {
    // Crossed back above the threshold; resets so the next drop alerts again.
    balanceAlertStateStore.set((prev) => ({ ...prev, [assetCode]: false }));
  }
}

/** Call for each new incoming payment. Large-payment alerts fire every time, since each payment is a distinct event. */
export function checkLargePayment(assetCode: string, amount: number) {
  const threshold = thresholdFor(assetCode);
  if (threshold.largePayment > 0 && amount >= threshold.largePayment) {
    pushNotification({
      type: "large_payment_alert",
      title: NOTIFICATION_TYPES.large_payment_alert.label,
      body: `A payment of ${amount.toLocaleString()} ${assetCode} exceeded your large payment threshold of ${threshold.largePayment.toLocaleString()}.`,
      href: NOTIFICATION_TYPES.large_payment_alert.href,
      amount,
    });
  }
}

/** Channel settings for a type, falling back to defaults for types added after the prefs were saved. */
export function channelPrefs(prefs: NotificationPrefs, type: NotificationType) {
  return prefs.channels[type] ?? DEFAULT_PREFS.channels[type];
}
export const useNotificationPrefs = prefsStore.useStore;

export function markRead(id: string) {
  notificationStore.set((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
}

export function markAllRead() {
  notificationStore.set((list) => list.map((n) => ({ ...n, read: true })));
}

export function unreadLabel(count: number): string | null {
  return count <= 0 ? null : count > 9 ? "9+" : String(count);
}

/** Applies in-app preferences and the payment threshold. */
export function isVisible(n: AppNotification, prefs: NotificationPrefs): boolean {
  if (!channelPrefs(prefs, n.type).inApp) return false;
  if (n.type === "payment_received" && (n.amount ?? 0) < prefs.paymentThreshold) return false;
  return true;
}

// ─── Mock backend ─────────────────────────────────────────────────────────────

const SAMPLES: Record<NotificationType, (amt: number) => string> = {
  payment_received: (a) => `You received ${a} USDC.`,
  refund_completed: () => "A refund was settled on-chain.",
  refund_failed: () => "A refund could not be submitted. Check the destination account.",
  webhook_failing: () => "Your endpoint returned 5xx for the last 5 deliveries.",
  escrow_dispute: () => "A customer opened a dispute on an escrow payment.",
  escrow_releasing: () => "An escrow payment releases in 24 hours.",
  team_joined: () => "A new teammate accepted their invitation.",
  api_key_expiring: () => "A live API key expires in 7 days.",
  new_device_login: () => "New sign-in from Chrome on Windows near Abuja, NG. Not you? Revoke it in Security settings.",
  low_balance_alert: () => "An asset balance dropped below your configured alert threshold.",
  large_payment_alert: (a) => `A payment of ${a} exceeded your large payment threshold.`,
};

function mockNotification(createdAt = new Date()): AppNotification {
  const type = TYPES[Math.floor(Math.random() * TYPES.length)];
  const amount = Math.round(Math.random() * 2000);
  const id = Math.random().toString(36).slice(2, 10);
  return {
    id,
    type,
    title: NOTIFICATION_TYPES[type].label,
    body: SAMPLES[type](amount),
    href: NOTIFICATION_TYPES[type].href,
    amount: type === "payment_received" ? amount : undefined,
    createdAt: createdAt.toISOString(),
    read: false,
  };
}

/** Mocked `GET /notifications?since=` — replace with a real fetch / SSE when available. */
async function fetchNew(): Promise<AppNotification[]> {
  if (Math.random() >= 0.4) return [];
  const notification = mockNotification();
  if (notification.type === "payment_received" && notification.amount != null) {
    // A simulated incoming payment also runs the large-payment threshold check (#132).
    checkLargePayment("USDC", notification.amount);
  }
  return [notification];
}

const POLL_MS = 30_000;
let pollers = 0;
let timer: ReturnType<typeof setInterval> | undefined;

/** Starts polling (shared across subscribers) so new notifications appear without reload. */
export function useNotificationPolling() {
  useEffect(() => {
    if (notificationStore.get().length === 0) {
      const now = Date.now();
      notificationStore.set(Array.from({ length: 12 }, (_, i) => ({ ...mockNotification(new Date(now - i * 3_600_000)), read: i > 3 })));
    }
    if (pollers++ === 0) {
      timer = setInterval(async () => {
        const fresh = await fetchNew();
        if (fresh.length) notificationStore.set((list) => [...fresh, ...list].slice(0, 200));
      }, POLL_MS);
    }
    return () => {
      if (--pollers === 0) clearInterval(timer);
    };
  }, []);
}
