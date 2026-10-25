'use client';

import React, { useState, useMemo } from 'react';
import {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookFilterOptions,
} from '@/types/webhooks';
import DeliveryDetailPanel from './DeliveryDetailPanel';
import { useFormat } from '@/lib/i18n/use-format';

interface DeliveriesListProps {
  deliveries: WebhookDelivery[];
  onResendSingle: (deliveryId: string) => void;
  onBulkResend: (deliveryIds: string[]) => void;
  filterStatus?: WebhookDeliveryStatus | 'all';
}

export default function DeliveriesList({
  deliveries,
  onResendSingle,
  onBulkResend,
  filterStatus: initialStatus = 'all',
}: DeliveriesListProps) {
  const f = useFormat();
  const [filters, setFilters] = useState<WebhookFilterOptions>({
    status: initialStatus,
    eventType: 'all',
    dateRange: 'all',
    searchQuery: '',
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inspectingDelivery, setInspectingDelivery] = useState<WebhookDelivery | null>(null);
  const [isBulkResending, setIsBulkResending] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  // Sync external filter changes if provided
  React.useEffect(() => {
    if (initialStatus) {
      setFilters((prev) => ({ ...prev, status: initialStatus }));
    }
  }, [initialStatus]);

  // Apply filters
  const filteredDeliveries = useMemo(() => {
    const now = Date.now();

    return deliveries.filter((item) => {
      // Status filter
      if (filters.status !== 'all' && item.status !== filters.status) {
        return false;
      }

      // Event type filter
      if (filters.eventType !== 'all' && item.eventType !== filters.eventType) {
        return false;
      }

      // Date range filter
      if (filters.dateRange !== 'all') {
        const itemTime = new Date(item.deliveredAt).getTime();
        const diffMs = now - itemTime;

        if (filters.dateRange === '24h' && diffMs > 24 * 3600 * 1000) return false;
        if (filters.dateRange === '7d' && diffMs > 7 * 24 * 3600 * 1000) return false;
        if (filters.dateRange === '30d' && diffMs > 30 * 24 * 3600 * 1000) return false;
      }

      // Search query
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const matchesId = item.id.toLowerCase().includes(q);
        const matchesEventId = item.eventId.toLowerCase().includes(q);
        const matchesType = item.eventType.toLowerCase().includes(q);
        if (!matchesId && !matchesEventId && !matchesType) return false;
      }

      return true;
    });
  }, [deliveries, filters]);

  // Selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredDeliveries.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBulkResendClick = () => {
    if (selectedIds.length === 0) return;
    setIsBulkResending(true);
    setTimeout(() => {
      onBulkResend(selectedIds);
      setIsBulkResending(false);
      setSelectedIds([]);
    }, 600);
  };

  const handleCopyEventId = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(eventId);
      setCopiedEventId(eventId);
      setTimeout(() => setCopiedEventId(null), 2000);
    }
  };

  const allSelected =
    filteredDeliveries.length > 0 &&
    filteredDeliveries.every((d) => selectedIds.includes(d.id));

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 shadow-sm">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-medium">Status:</span>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  status: e.target.value as WebhookFilterOptions['status'],
                }))
              }
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="succeeded">Succeeded (2xx)</option>
              <option value="failed">Failed (4xx/5xx)</option>
              <option value="pending_retry">Pending Retry</option>
            </select>
          </div>

          {/* Event Type Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-medium">Event:</span>
            <select
              value={filters.eventType}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, eventType: e.target.value }))
              }
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              <option value="all">All Events</option>
              <option value="payment.completed">payment.completed</option>
              <option value="payment.failed">payment.failed</option>
              <option value="refund.processed">refund.processed</option>
              <option value="trustline.added">trustline.added</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-500 font-medium">Range:</span>
            <select
              value={filters.dateRange}
              onChange={(e) =>
                setFilters((prev) => ({
                  ...prev,
                  dateRange: e.target.value as WebhookFilterOptions['dateRange'],
                }))
              }
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              <option value="all">All Time</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>

        {/* Search query */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search Event ID, Del ID..."
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full sm:w-56 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs dark:border-zinc-700 dark:bg-zinc-800 dark:text-white focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-xs animate-fadeIn">
          <div className="flex items-center gap-2 font-medium text-sky-800 dark:text-sky-200">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-white text-[10px] font-bold">
              {selectedIds.length}
            </span>
            <span>Selected deliveries</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              Deselect All
            </button>

            <button
              type="button"
              onClick={handleBulkResendClick}
              disabled={isBulkResending}
              className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-sky-700 cursor-pointer"
            >
              {isBulkResending ? (
                <>
                  <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Resending {selectedIds.length}...</span>
                </>
              ) : (
                <>
                  <span>↻ Bulk Resend ({selectedIds.length})</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Deliveries Table */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 text-[10px] uppercase font-semibold text-zinc-400">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="h-3.5 w-3.5 rounded text-sky-600 focus:ring-sky-500"
                  />
                </th>
                <th className="py-3 pr-4">Event Type</th>
                <th className="py-3 pr-4">Event ID</th>
                <th className="py-3 pr-4">Status</th>
                <th className="py-3 pr-4">HTTP Response</th>
                <th className="py-3 pr-4">Attempts</th>
                <th className="py-3 pr-4">Delivered At</th>
                <th className="py-3 pr-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-sans">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    No webhook deliveries match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((delivery) => {
                  const isSuccess = delivery.status === 'succeeded';
                  const isFailed = delivery.status === 'failed';
                  const isPending = delivery.status === 'pending_retry';
                  const isSelected = selectedIds.includes(delivery.id);

                  return (
                    <tr
                      key={delivery.id}
                      onClick={() => setInspectingDelivery(delivery)}
                      className={`hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer ${
                        isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4" onClick={(e) => handleToggleSelect(delivery.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="h-3.5 w-3.5 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </td>

                      {/* Event Type */}
                      <td className="py-3 pr-4 font-semibold text-zinc-900 dark:text-white">
                        <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          {delivery.eventType}
                        </span>
                      </td>

                      {/* Event ID with copy */}
                      <td className="py-3 pr-4 font-mono text-zinc-600 dark:text-zinc-300">
                        <div className="flex items-center gap-1">
                          <span>{delivery.eventId}</span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyEventId(delivery.eventId, e)}
                            className="rounded p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                            title="Copy Event ID"
                          >
                            {copiedEventId === delivery.eventId ? (
                              <span className="text-[10px] text-emerald-600">✓</span>
                            ) : (
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                            isSuccess
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                              : isFailed
                              ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isSuccess ? 'bg-emerald-500' : isFailed ? 'bg-rose-500' : 'bg-amber-500 animate-pulse'
                            }`}
                          />
                          {delivery.status.replace('_', ' ')}
                        </span>
                      </td>

                      {/* HTTP Response Code */}
                      <td className="py-3 pr-4 font-mono font-medium">
                        <span
                          className={
                            delivery.httpStatus >= 200 && delivery.httpStatus < 300
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }
                        >
                          {delivery.httpStatus} {delivery.statusText}
                        </span>
                      </td>

                      {/* Attempt Count */}
                      <td className="py-3 pr-4 text-zinc-500">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {delivery.attemptCount}
                        </span>{' '}
                        {delivery.attemptCount === 1 ? 'attempt' : 'attempts'}
                      </td>

                      {/* Delivered At */}
                      <td className="py-3 pr-4 text-zinc-500 whitespace-nowrap">
                        {f.time(delivery.deliveredAt, true)}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingDelivery(delivery)}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer shadow-sm"
                          >
                            Inspect
                          </button>

                          <button
                            type="button"
                            onClick={() => onResendSingle(delivery.id)}
                            className="rounded-lg bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 cursor-pointer transition-colors"
                            title="Resend this delivery"
                          >
                            ↻ Resend
                          </button>
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

      {/* Slide-over Inspection Panel */}
      <DeliveryDetailPanel
        delivery={inspectingDelivery}
        onClose={() => setInspectingDelivery(null)}
        onResend={(id) => {
          onResendSingle(id);
          // Refresh inspected item with updated values
          setTimeout(() => {
            const updated = deliveries.find((d) => d.id === id);
            if (updated) setInspectingDelivery(updated);
          }, 300);
        }}
      />
    </div>
  );
}
