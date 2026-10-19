"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Download,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  Key,
  Webhook,
  Users,
  Coins,
  Sliders,
  LogIn,
  RotateCw,
  Clock,
  Laptop,
} from "lucide-react";
import { Can } from "@/components/auth/Can";
import {
  useAuditLog,
  filterAuditEvents,
  exportAuditLogsToCsv,
  type AuditCategory,
  type AuditEvent,
  type AuditFilterState,
} from "@/lib/audit-log";
import { ROLE_LABELS } from "@/lib/permissions";

const CATEGORY_ICONS: Record<AuditCategory, typeof Shield> = {
  all: Filter,
  auth: LogIn,
  api_key: Key,
  webhook: Webhook,
  team: Users,
  payout: Coins,
  settings: Sliders,
};

function getCategoryColor(category: AuditCategory): string {
  switch (category) {
    case "auth":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "api_key":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "webhook":
      return "bg-purple-50 text-purple-700 border-purple-200";
    case "team":
      return "bg-indigo-50 text-indigo-700 border-indigo-200";
    case "payout":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "settings":
      return "bg-zinc-100 text-zinc-700 border-zinc-200";
    default:
      return "bg-zinc-100 text-zinc-600 border-zinc-200";
  }
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return iso;
  }
}

function formatRelativeTime(iso: string): string {
  try {
    const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (diffSec < 60) return "Just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
}

export default function AuditLogPage() {
  const { events } = useAuditLog();

  const [filters, setFilters] = useState<AuditFilterState>({
    searchQuery: "",
    category: "all",
    dateRange: "all",
  });

  const filteredEvents = useMemo(() => {
    return filterAuditEvents(events, filters);
  }, [events, filters]);

  const handleExportCsv = () => {
    exportAuditLogsToCsv(filteredEvents);
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: "",
      category: "all",
      dateRange: "all",
    });
  };

  return (
    <Can
      permission="team:manage"
      fallback={
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-8 text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-red-500" aria-hidden="true" />
          <h3 className="mt-3 text-lg font-semibold text-zinc-900">Restricted Access</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Audit logs are only accessible to account Owners and Administrators.
          </p>
          <Link
            href="/overview"
            className="mt-4 inline-block rounded-md bg-[#000F24] px-4 py-2 text-sm font-medium text-white"
          >
            Return to Dashboard
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Top Header & Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Account Audit Trail</h3>
            <p className="text-sm text-zinc-500">
              Immutable record of security events, administrative changes, API key activity, and payouts.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={filteredEvents.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4 text-zinc-500" />
            <span>Export CSV</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {filteredEvents.length}
            </span>
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm md:grid-cols-12">
          {/* Search Query Input */}
          <div className="relative md:col-span-6">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))}
              placeholder="Search by actor, action, target, or IP address..."
              className="w-full rounded-md border border-zinc-300 py-2 pl-9 pr-3 text-sm placeholder:text-zinc-400 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
            />
          </div>

          {/* Action Category Selector */}
          <div className="md:col-span-3">
            <select
              aria-label="Filter by action category"
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value as AuditCategory }))}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
            >
              <option value="all">All Action Types</option>
              <option value="auth">Authentication & Logins</option>
              <option value="api_key">API Keys (Create / Roll / Revoke)</option>
              <option value="webhook">Webhooks (Endpoints & Events)</option>
              <option value="team">Team (Roles & Invites)</option>
              <option value="payout">Payouts & Escrow Releases</option>
              <option value="settings">Settings & Policies</option>
            </select>
          </div>

          {/* Date Range Selector */}
          <div className="md:col-span-2">
            <select
              aria-label="Filter by date range"
              value={filters.dateRange}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateRange: e.target.value as AuditFilterState["dateRange"] }))}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]"
            >
              <option value="all">All Time</option>
              <option value="today">Today (Past 24h)</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="md:col-span-1">
            <button
              type="button"
              onClick={handleResetFilters}
              title="Reset Filters"
              className="flex h-full w-full items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 p-2 text-zinc-600 transition hover:bg-zinc-100"
            >
              <RotateCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              <tr>
                <th scope="col" className="px-4 py-3">Actor</th>
                <th scope="col" className="px-4 py-3">Action</th>
                <th scope="col" className="px-4 py-3">Target Resource</th>
                <th scope="col" className="px-4 py-3">IP Address</th>
                <th scope="col" className="px-4 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-500">
                    <Shield className="mx-auto h-8 w-8 text-zinc-300" />
                    <p className="mt-2 text-sm font-medium">No audit events match your filter criteria.</p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="mt-2 text-xs font-medium text-[#20a7ee] underline"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => {
                  const CategoryIcon = CATEGORY_ICONS[evt.category] || Shield;
                  return (
                    <tr key={evt.id} className="transition-colors hover:bg-zinc-50/75">
                      {/* Actor Column */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#000F24] font-semibold text-white text-xs">
                            {evt.actor.name ? evt.actor.name[0].toUpperCase() : "U"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-medium text-zinc-900">{evt.actor.name}</span>
                              <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-zinc-600">
                                {ROLE_LABELS[evt.actor.role] ?? evt.actor.role}
                              </span>
                            </div>
                            <span className="text-xs text-zinc-500">{evt.actor.email}</span>
                          </div>
                        </div>
                      </td>

                      {/* Action Column */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2">
                          <span
                            className={`mt-0.5 inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${getCategoryColor(
                              evt.category
                            )}`}
                          >
                            <CategoryIcon className="h-3 w-3" />
                            {evt.actionLabel}
                          </span>
                        </div>
                        {evt.details && (
                          <p className="mt-1 max-w-sm truncate text-xs text-zinc-500">{evt.details}</p>
                        )}
                      </td>

                      {/* Target Column */}
                      <td className="px-4 py-3.5">
                        <div className="max-w-xs truncate font-mono text-xs text-zinc-800" title={evt.target}>
                          {evt.target}
                        </div>
                      </td>

                      {/* IP Column */}
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-600">
                          <Laptop className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{evt.ipAddress}</span>
                        </div>
                      </td>

                      {/* Time Column */}
                      <td className="whitespace-nowrap px-4 py-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-medium text-zinc-900 text-xs">{formatDate(evt.timestamp)}</span>
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Clock className="h-3 w-3 text-zinc-400" />
                            {formatRelativeTime(evt.timestamp)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Can>
  );
}
