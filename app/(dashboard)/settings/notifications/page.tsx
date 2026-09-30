"use client";

import { useState } from "react";
import { DEFAULT_PREFS, NOTIFICATION_TYPES, prefsStore, useNotificationPrefs, type NotificationType } from "@/lib/notifications";

export default function NotificationSettingsPage() {
  const saved = useNotificationPrefs();
  const [draft, setDraft] = useState(saved);
  const [status, setStatus] = useState<string | null>(null);

  const toggle = (type: NotificationType, channel: "inApp" | "email") =>
    setDraft((d) => ({ ...d, channels: { ...d.channels, [type]: { ...d.channels[type], [channel]: !d.channels[type][channel] } } }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); prefsStore.set(draft); setStatus("Preferences saved."); }}
      className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6"
    >
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-zinc-500">
          <tr><th className="pb-2">Notification</th><th className="pb-2 text-center">In-app</th><th className="pb-2 text-center">Email</th></tr>
        </thead>
        <tbody>
          {(Object.keys(NOTIFICATION_TYPES) as NotificationType[]).map((t) => (
            <tr key={t} className="border-t border-zinc-100">
              <td className="py-2.5">{NOTIFICATION_TYPES[t].icon} {NOTIFICATION_TYPES[t].label}</td>
              {(["inApp", "email"] as const).map((c) => (
                <td key={c} className="text-center">
                  <input type="checkbox" aria-label={`${NOTIFICATION_TYPES[t].label} ${c === "inApp" ? "in-app" : "email"}`} checked={(draft.channels[t] ?? DEFAULT_PREFS.channels[t])[c]} onChange={() => toggle(t, c)} className="h-4 w-4 accent-[#20a7ee]" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <label className="flex max-w-xs flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Payment received threshold (USDC)</span>
        <input type="number" min={0} step="0.01" value={draft.paymentThreshold} onChange={(e) => setDraft((d) => ({ ...d, paymentThreshold: Math.max(0, Number(e.target.value)) }))} className="rounded-md border border-zinc-300 px-3 py-2" />
        <span className="text-xs text-zinc-500">Only notify for payments at or above this amount.</span>
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-md bg-[#000F24] px-4 py-2 text-sm font-medium text-white">Save preferences</button>
        {status && <span role="status" className="text-sm text-emerald-600">{status}</span>}
      </div>
    </form>
  );
}
