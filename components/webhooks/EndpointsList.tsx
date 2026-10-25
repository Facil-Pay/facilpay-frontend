'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WebhookEndpoint } from '@/types/webhooks';
import { useFormat } from '@/lib/i18n/use-format';

interface EndpointsListProps {
  endpoints: WebhookEndpoint[];
  onEdit: (endpoint: WebhookEndpoint) => void;
  onDelete: (endpoint: WebhookEndpoint) => void;
  onRollSecret: (endpoint: WebhookEndpoint) => void;
  onTest: (endpoint: WebhookEndpoint) => void;
  onToggleStatus: (endpointId: string) => void;
  onViewVerificationGuide: (secret?: string) => void;
}

export default function EndpointsList({
  endpoints,
  onEdit,
  onDelete,
  onRollSecret,
  onTest,
  onToggleStatus,
  onViewVerificationGuide,
}: EndpointsListProps) {
  const f = useFormat();
  // Revealed secret tracking per endpoint ID
  const [revealedSecretIds, setRevealedSecretIds] = useState<Set<string>>(new Set());
  const [copiedSecretId, setCopiedSecretId] = useState<string | null>(null);
  const [expandedEventsEndpointId, setExpandedEventsEndpointId] = useState<string | null>(null);
  const [activeMenuEndpointId, setActiveMenuEndpointId] = useState<string | null>(null);

  const toggleRevealSecret = (id: string) => {
    setRevealedSecretIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopySecret = (endpoint: WebhookEndpoint) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(endpoint.secret);
      setCopiedSecretId(endpoint.id);
      setTimeout(() => setCopiedSecretId(null), 2000);
    }
  };

  const formatDate = (isoString: string) => f.date(isoString);

  if (endpoints.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center bg-white dark:bg-zinc-950/40">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 text-xl font-bold">
          🔔
        </div>
        <h3 className="mt-3 text-sm font-bold text-zinc-900 dark:text-white">
          No webhook endpoints configured
        </h3>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
          Add an endpoint URL to start receiving real-time event notifications for completed payments and escrow settlements.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200/80 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-200/80 bg-zinc-50/75 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-400">
              <th className="py-3.5 pl-5 pr-3">Endpoint URL & Secret</th>
              <th className="py-3.5 px-3">Subscribed Events</th>
              <th className="py-3.5 px-3 text-center">Status</th>
              <th className="py-3.5 px-3 text-center">Success Rate (24h)</th>
              <th className="py-3.5 px-3">Created</th>
              <th className="py-3.5 pl-3 pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/70 text-xs dark:divide-zinc-800">
            {endpoints.map((ep) => {
              const isRevealed = revealedSecretIds.has(ep.id);
              const isCopied = copiedSecretId === ep.id;
              const isEventsExpanded = expandedEventsEndpointId === ep.id;
              const isMenuOpen = activeMenuEndpointId === ep.id;

              const successRate = ep.successRate24h ?? 100;
              let successRateBadgeClass =
                'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
              if (successRate < 75) {
                successRateBadgeClass =
                  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
              } else if (successRate < 90) {
                successRateBadgeClass =
                  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
              }

              return (
                <tr
                  key={ep.id}
                  className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                >
                  {/* Column 1: URL & Secret */}
                  <td className="py-4 pl-5 pr-3 align-top max-w-sm">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full shrink-0 ${
                            ep.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'
                          }`}
                        />
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100 break-all select-all">
                          {ep.url}
                        </span>
                      </div>

                      {ep.description && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1 pl-4">
                          {ep.description}
                        </p>
                      )}

                      {/* Signing Secret Box with Mask & Reveal */}
                      <div className="pl-4 pt-1">
                        <div className="flex flex-wrap items-center gap-2 p-1.5 px-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800/80 text-[11px]">
                          <span className="text-zinc-400 font-medium">Secret:</span>
                          <span className="font-mono text-[11px] text-zinc-700 dark:text-zinc-300 select-all">
                            {isRevealed
                              ? ep.secret
                              : 'whsec_••••••••••••••••••••••••••••••••'}
                          </span>

                          <div className="flex items-center gap-1.5 ml-auto">
                            <button
                              type="button"
                              onClick={() => toggleRevealSecret(ep.id)}
                              className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
                            >
                              {isRevealed ? 'Hide' : 'Reveal'}
                            </button>
                            <span className="text-zinc-300 dark:text-zinc-700">|</span>
                            <button
                              type="button"
                              onClick={() => handleCopySecret(ep)}
                              className="text-[10px] font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
                            >
                              {isCopied ? '✓ Copied' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Subscribed Events */}
                  <td className="py-4 px-3 align-top max-w-[220px]">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap gap-1">
                        {(isEventsExpanded
                          ? ep.subscribedEvents
                          : ep.subscribedEvents.slice(0, 3)
                        ).map((ev) => (
                          <span
                            key={ev}
                            className="inline-flex items-center rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700"
                          >
                            {ev}
                          </span>
                        ))}
                      </div>

                      {ep.subscribedEvents.length > 3 && (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedEventsEndpointId(
                              isEventsExpanded ? null : ep.id
                            )
                          }
                          className="text-[10px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer block"
                        >
                          {isEventsExpanded
                            ? 'Show less'
                            : `+${ep.subscribedEvents.length - 3} more events`}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Column 3: Status (Enabled / Disabled toggle) */}
                  <td className="py-4 px-3 align-top text-center">
                    <div className="flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(ep.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          ep.status === 'active'
                            ? 'bg-emerald-500'
                            : 'bg-zinc-300 dark:bg-zinc-700'
                        }`}
                        title={
                          ep.status === 'active'
                            ? 'Click to disable endpoint'
                            : 'Click to enable endpoint'
                        }
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            ep.status === 'active'
                              ? 'translate-x-4'
                              : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          ep.status === 'active'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-zinc-400 dark:text-zinc-500'
                        }`}
                      >
                        {ep.status === 'active' ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </td>

                  {/* Column 4: Success Rate (last 24h) */}
                  <td className="py-4 px-3 align-top text-center">
                    <div className="inline-flex flex-col items-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold border ${successRateBadgeClass}`}
                      >
                        {successRate}%
                      </span>
                      <span className="text-[10px] text-zinc-400 mt-0.5">
                        last 24h
                      </span>
                    </div>
                  </td>

                  {/* Column 5: Created Date */}
                  <td className="py-4 px-3 align-top text-zinc-600 dark:text-zinc-400 text-xs whitespace-nowrap">
                    {formatDate(ep.createdAt)}
                  </td>

                  {/* Column 6: Actions */}
                  <td className="py-4 pl-3 pr-5 align-top text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Test Action */}
                      <button
                        type="button"
                        onClick={() => onTest(ep)}
                        className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                        title="Dispatch test event"
                      >
                        ⚡ Test
                      </button>

                      {/* View Deliveries Logs */}
                      <Link
                        href={`/webhooks/${ep.id}`}
                        className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/60 dark:text-sky-300 dark:hover:bg-sky-900/60 transition-colors"
                        title="View delivery attempts and inspection panel"
                      >
                        Logs →
                      </Link>

                      {/* Actions Menu Trigger */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() =>
                            setActiveMenuEndpointId(isMenuOpen ? null : ep.id)
                          }
                          className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                          title="More actions"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                          <div
                            onMouseLeave={() => setActiveMenuEndpointId(null)}
                            className="absolute right-0 z-30 mt-1 w-48 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 text-left animate-fadeIn"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuEndpointId(null);
                                onEdit(ep);
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                            >
                              <span>✎</span>
                              <span>Edit Endpoint</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuEndpointId(null);
                                onRollSecret(ep);
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                            >
                              <span>🔄</span>
                              <span>Roll Signing Secret</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuEndpointId(null);
                                onViewVerificationGuide(ep.secret);
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs text-left text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-2"
                            >
                              <span>&lt;/&gt;</span>
                              <span>Verify Signature Code</span>
                            </button>

                            <div className="my-1 border-t border-zinc-100 dark:border-zinc-800" />

                            <button
                              type="button"
                              onClick={() => {
                                setActiveMenuEndpointId(null);
                                onDelete(ep);
                              }}
                              className="w-full rounded-lg px-2.5 py-1.5 text-xs text-left text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 cursor-pointer flex items-center gap-2"
                            >
                              <span>🗑</span>
                              <span>Delete Endpoint...</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
