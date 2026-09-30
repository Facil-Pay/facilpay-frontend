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
  if (!prefs.channels[n.type]?.inApp) return false;
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
  return Math.random() < 0.4 ? [mockNotification()] : [];
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
