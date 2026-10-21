"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Can } from "@/components/auth/Can";
import { generateCsv, triggerCsvDownload } from "@/lib/csvExport";
import type { ExportColumn } from "@/lib/types";

type AuditActionType = "Authentication" | "API keys" | "Webhooks" | "Team" | "Payouts" | "Settings";

interface AuditEvent {
  id: string;
  actor: string;
  actionType: AuditActionType;
  action: string;
  target: string;
  ip: string;
  timestamp: string;
}

const AUDIT_EVENTS: AuditEvent[] = [
  { id: "evt_101", actor: "Morgan Lee", actionType: "Authentication", action: "Logged in", target: "Merchant dashboard", ip: "203.0.113.42", timestamp: "2026-10-21T09:14:00.000Z" },
  { id: "evt_102", actor: "Dara Okafor", actionType: "API keys", action: "API key created", target: "Production · Payments API", ip: "198.51.100.18", timestamp: "2026-10-21T08:52:00.000Z" },
  { id: "evt_103", actor: "Morgan Lee", actionType: "Webhooks", action: "Webhook endpoint updated", target: "Order events endpoint", ip: "203.0.113.42", timestamp: "2026-10-20T16:38:00.000Z" },
  { id: "evt_104", actor: "Alex Chen", actionType: "Team", action: "Team member invited", target: "samira@acme.example · Developer", ip: "192.0.2.77", timestamp: "2026-10-20T13:05:00.000Z" },
  { id: "evt_105", actor: "Morgan Lee", actionType: "Payouts", action: "Payout created", target: "pay_8f12 · 1,250.00 USDC", ip: "203.0.113.42", timestamp: "2026-10-19T11:27:00.000Z" },
  { id: "evt_106", actor: "Dara Okafor", actionType: "API keys", action: "API key rotated", target: "Production · Payments API", ip: "198.51.100.18", timestamp: "2026-10-18T15:41:00.000Z" },
  { id: "evt_107", actor: "Morgan Lee", actionType: "Settings", action: "Business settings changed", target: "Settlement currency · EUR to USD", ip: "203.0.113.42", timestamp: "2026-10-17T10:16:00.000Z" },
  { id: "evt_108", actor: "Alex Chen", actionType: "Team", action: "Team member role changed", target: "jamie@acme.example · Support to Admin", ip: "192.0.2.77", timestamp: "2026-10-16T17:22:00.000Z" },
  { id: "evt_109", actor: "Morgan Lee", actionType: "Webhooks", action: "Webhook endpoint created", target: "Billing notifications", ip: "203.0.113.42", timestamp: "2026-10-15T12:49:00.000Z" },
  { id: "evt_110", actor: "Dara Okafor", actionType: "API keys", action: "API key revoked", target: "Legacy integration", ip: "198.51.100.18", timestamp: "2026-10-14T09:33:00.000Z" },
  { id: "evt_111", actor: "Morgan Lee", actionType: "Authentication", action: "Logged in", target: "Merchant dashboard", ip: "203.0.113.42", timestamp: "2026-10-13T08:12:00.000Z" },
  { id: "evt_112", actor: "Alex Chen", actionType: "Team", action: "Team member removed", target: "lee@acme.example", ip: "192.0.2.77", timestamp: "2026-10-12T14:57:00.000Z" },
  { id: "evt_113", actor: "Morgan Lee", actionType: "Webhooks", action: "Webhook endpoint disabled", target: "Legacy order events", ip: "203.0.113.42", timestamp: "2026-10-10T16:04:00.000Z" },
  { id: "evt_114", actor: "Morgan Lee", actionType: "Settings", action: "Security settings changed", target: "Two-step verification required", ip: "203.0.113.42", timestamp: "2026-10-08T11:39:00.000Z" },
];

const ACTION_TYPES: AuditActionType[] = ["Authentication", "API keys", "Webhooks", "Team", "Payouts", "Settings"];

const EXPORT_COLUMNS: ExportColumn<AuditEvent>[] = [
  { key: "actor", label: "Actor", selected: true },
  { key: "action", label: "Action", selected: true },
  { key: "target", label: "Target", selected: true },
  { key: "ip", label: "IP", selected: true },
  { key: "timestamp", label: "Time (UTC)", selected: true },
];

function formatTimestamp(timestamp: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

export default function AuditLogPage() {
  const [actorFilter, setActorFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const filteredEvents = AUDIT_EVENTS.filter((event) => {
    const eventDate = event.timestamp.slice(0, 10);
    return (
      (actorFilter === "ALL" || event.actor === actorFilter) &&
      (actionFilter === "ALL" || event.actionType === actionFilter) &&
      (!startDate || eventDate >= startDate) &&
      (!endDate || eventDate <= endDate)
    );
  });

  const exportEvents = () => {
    const csv = generateCsv(filteredEvents, EXPORT_COLUMNS);
    const today = new Date().toISOString().slice(0, 10);
    const range = startDate || endDate
      ? `${startDate || "start"}_${endDate || "end"}`
      : today;
    triggerCsvDownload(csv, `facilpay-audit-log-${range}.csv`);
  };

  const resetFilters = () => {
    setActorFilter("ALL");
    setActionFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  return (
    <Can
      permission="team:manage"
      fallback={
        <div className="rounded-lg border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Audit logs are available to account owners and admins.
        </div>
      }
    >
      <section className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Account audit log</h1>
              <span className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">Sample data</span>
            </div>
            <p className="mt-1 text-sm text-zinc-500">Review sample account access and changes made by your team.</p>
          </div>
          <button
            type="button"
            onClick={exportEvents}
            disabled={filteredEvents.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-[#000F24] px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Download aria-hidden="true" size={16} />
            Export CSV
          </button>
        </div>

        <div className="grid gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
            Actor
            <select value={actorFilter} onChange={(event) => setActorFilter(event.target.value)} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900">
              <option value="ALL">All actors</option>
              {Array.from(new Set(AUDIT_EVENTS.map((event) => event.actor))).map((actor) => (
                <option key={actor} value={actor}>{actor}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
            Action type
            <select value={actionFilter} onChange={(event) => setActionFilter(event.target.value)} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900">
              <option value="ALL">All action types</option>
              {ACTION_TYPES.map((actionType) => <option key={actionType} value={actionType}>{actionType}</option>)}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
            From
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900" />
          </label>
          <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-600">
            To
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900" />
          </label>
        </div>

        <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3">
            <p className="text-sm font-medium text-zinc-800">Activity</p>
            <div className="flex items-center gap-3 text-xs text-zinc-500">
              <span>{filteredEvents.length} events</span>
              {(actorFilter !== "ALL" || actionFilter !== "ALL" || startDate || endDate) && (
                <button type="button" onClick={resetFilters} className="font-medium text-sky-700 hover:text-sky-900">Clear filters</button>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-medium text-zinc-500">
                <tr>
                  <th scope="col" className="px-4 py-3">Actor</th>
                  <th scope="col" className="px-4 py-3">Action</th>
                  <th scope="col" className="px-4 py-3">Target</th>
                  <th scope="col" className="px-4 py-3">IP</th>
                  <th scope="col" className="px-4 py-3">Time (UTC)</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="border-b border-zinc-100 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-zinc-900">{event.actor}</td>
                    <td className="px-4 py-3">
                      <span className="block text-zinc-800">{event.action}</span>
                      <span className="text-xs text-zinc-500">{event.actionType}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{event.target}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-zinc-600">{event.ip}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-zinc-600">{formatTimestamp(event.timestamp)}</td>
                  </tr>
                ))}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-500">No events match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </Can>
  );
}