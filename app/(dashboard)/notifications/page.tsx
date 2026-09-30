"use client";

import { useState } from "react";
import { NotificationItem, useOpenNotification } from "@/components/notifications/NotificationBell";
import { isVisible, markAllRead, NOTIFICATION_TYPES, useNotificationPrefs, useNotifications, type NotificationType } from "@/lib/notifications";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const prefs = useNotificationPrefs();
  const all = useNotifications().filter((n) => isVisible(n, prefs));
  const [type, setType] = useState<NotificationType | "all">("all");
  const [status, setStatus] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(0);
  const openNotification = useOpenNotification();

  const filtered = all.filter((n) => (type === "all" || n.type === type) && (status === "all" || (status === "unread" ? !n.read : n.read)));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select aria-label="Filter by type" value={type} onChange={(e) => { setType(e.target.value as NotificationType | "all"); setPage(0); }} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
          <option value="all">All types</option>
          {Object.entries(NOTIFICATION_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
        </select>
        <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as typeof status); setPage(0); }} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm">
          <option value="all">All</option><option value="unread">Unread</option><option value="read">Read</option>
        </select>
        <button type="button" onClick={markAllRead} className="ml-auto text-sm text-[#20a7ee] hover:underline">Mark all as read</button>
      </div>

      <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {filtered.length === 0 ? <p className="p-8 text-center text-sm text-zinc-500">No notifications match these filters.</p> :
          filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map((n) => <NotificationItem key={n.id} n={n} onOpen={openNotification} />)}
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-600">
        <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)} className="rounded-md border border-zinc-300 px-3 py-1.5 disabled:opacity-40">Previous</button>
        <span>Page {current + 1} of {pages}</span>
        <button type="button" disabled={current >= pages - 1} onClick={() => setPage(current + 1)} className="rounded-md border border-zinc-300 px-3 py-1.5 disabled:opacity-40">Next</button>
      </div>
    </div>
  );
}
