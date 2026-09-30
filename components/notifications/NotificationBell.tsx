"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  isVisible, markAllRead, markRead, NOTIFICATION_TYPES, unreadLabel,
  useNotificationPolling, useNotificationPrefs, useNotifications, type AppNotification,
} from "@/lib/notifications";

export function NotificationItem({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  return (
    <button type="button" onClick={() => onOpen(n)} className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-zinc-50 ${n.read ? "" : "bg-sky-50/60"}`}>
      <span className="text-lg" aria-hidden="true">{NOTIFICATION_TYPES[n.type].icon}</span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-sm font-medium text-zinc-900">
          {n.title}
          {!n.read && <span className="h-2 w-2 rounded-full bg-[#20a7ee]" aria-label="Unread" />}
        </span>
        <span className="block text-xs text-zinc-500">{n.body}</span>
        <span className="block text-[11px] text-zinc-400">{new Date(n.createdAt).toLocaleString()}</span>
      </span>
    </button>
  );
}

export function useOpenNotification() {
  const router = useRouter();
  return (n: AppNotification) => {
    markRead(n.id);
    router.push(n.href);
  };
}

export function NotificationBell() {
  useNotificationPolling();
  const prefs = useNotificationPrefs();
  const items = useNotifications().filter((n) => isVisible(n, prefs));
  const badge = unreadLabel(items.filter((n) => !n.read).length);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const openNotification = useOpenNotification();

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label={`Notifications${badge ? ` (${badge} unread)` : ""}`} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="relative rounded-full p-2 text-zinc-600 hover:bg-zinc-100">
        <Bell className="h-5 w-5" />
        {badge && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{badge}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5">
            <p className="text-sm font-semibold text-zinc-900">Notifications</p>
            <button type="button" onClick={markAllRead} className="text-xs text-[#20a7ee] hover:underline">Mark all as read</button>
          </div>
          <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
            {items.length === 0 ? <p className="p-6 text-center text-sm text-zinc-500">You&apos;re all caught up.</p> :
              items.slice(0, 20).map((n) => <NotificationItem key={n.id} n={n} onOpen={(x) => { setOpen(false); openNotification(x); }} />)}
          </div>
          <Link href="/notifications" onClick={() => setOpen(false)} className="block border-t border-zinc-100 py-2.5 text-center text-xs font-medium text-zinc-700 hover:bg-zinc-50">View all</Link>
        </div>
      )}
    </div>
  );
}
