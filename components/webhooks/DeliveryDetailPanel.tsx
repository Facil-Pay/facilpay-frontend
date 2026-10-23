'use client';

import React, { useState } from 'react';
import { WebhookDelivery } from '@/types/webhooks';
import SyntaxHighlightedJson from './SyntaxHighlightedJson';
import { useFormat } from '@/lib/i18n/use-format';

interface DeliveryDetailPanelProps {
  delivery: WebhookDelivery | null;
  onClose: () => void;
  onResend: (deliveryId: string) => void;
  isResending?: boolean;
}

const MAX_BODY_BYTES = 10 * 1024; // 10KB

export default function DeliveryDetailPanel({
  delivery,
  onClose,
  onResend,
  isResending = false,
}: DeliveryDetailPanelProps) {
  const f = useFormat();
  const [activeTab, setActiveTab] = useState<'request' | 'response' | 'attempts'>('request');
  const [copiedPayload, setCopiedPayload] = useState(false);

  if (!delivery) return null;

  const isSuccess = delivery.status === 'succeeded';
  const isFailed = delivery.status === 'failed';
  const isPending = delivery.status === 'pending_retry';

  const handleCopyPayload = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(JSON.stringify(delivery.request.payload, null, 2));
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2000);
    }
  };

  // Truncate response body if larger than 10KB
  const rawBody = delivery.response?.body || '';
  const isBodyTruncated = rawBody.length > MAX_BODY_BYTES;
  const displayBody = isBodyTruncated ? rawBody.slice(0, MAX_BODY_BYTES) : rawBody;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fadeIn">
      <div
        className="w-full max-w-2xl bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full overflow-hidden animate-slideInRight"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Panel Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-zinc-900 dark:text-white">
                {delivery.eventId}
              </span>
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
            </div>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
              title="Close panel"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                {delivery.eventType}
              </span>
              <span className="text-zinc-400 mx-1.5">•</span>
              <span className="text-zinc-500 font-mono">
                {f.dateWith(delivery.deliveredAt, { dateStyle: "medium", timeStyle: "medium" })}
              </span>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleCopyPayload}
                className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer shadow-sm"
              >
                {copiedPayload ? '✓ Copied' : 'Copy JSON'}
              </button>

              <button
                type="button"
                onClick={() => onResend(delivery.id)}
                disabled={isResending}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-3 py-1 text-xs font-semibold text-white shadow-sm hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                {isResending ? (
                  <>
                    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>Resending...</span>
                  </>
                ) : (
                  <>
                    <span>↻ Resend Webhook</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-5 text-xs font-semibold">
          {[
            { id: 'request', label: 'Request' },
            { id: 'response', label: `Response (${delivery.httpStatus})` },
            { id: 'attempts', label: `Attempt History (${delivery.attempts.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-3 px-3 border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'border-sky-500 text-sky-600 dark:text-sky-400 font-bold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: Request */}
          {activeTab === 'request' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                  Destination URL
                </span>
                <div className="p-2.5 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 font-mono text-xs text-zinc-800 dark:text-zinc-200 break-all">
                  <span className="text-sky-600 font-bold mr-2">POST</span>
                  {delivery.request.url}
                </div>
              </div>

              {/* Request Headers */}
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                  Request Headers
                </span>
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                  {Object.entries(delivery.request.headers).map(([key, val]) => {
                    const isSig = key.toLowerCase().includes('signature');
                    return (
                      <div
                        key={key}
                        className={`flex flex-col sm:flex-row p-2.5 font-mono ${
                          isSig
                            ? 'bg-sky-50/70 dark:bg-sky-950/40 text-sky-900 dark:text-sky-200'
                            : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <span className="sm:w-52 font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                          {key}
                        </span>
                        <span className="break-all">{val}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pretty-Printed JSON Payload */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    JSON Payload (Syntax Highlighted)
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">application/json</span>
                </div>
                <SyntaxHighlightedJson
                  data={delivery.request.payload}
                  maxHeight="max-h-[380px]"
                  showCopy={true}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Response */}
          {activeTab === 'response' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Response Status & Latency */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-[11px] text-zinc-500 block">HTTP Response Status</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`text-base font-bold font-mono ${
                        isSuccess
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {delivery.response.statusCode} {delivery.response.statusText}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="text-[11px] text-zinc-500 block">Roundtrip Latency</span>
                  <div className="text-base font-bold font-mono text-zinc-900 dark:text-white mt-1">
                    {delivery.response.responseTimeMs} ms
                  </div>
                </div>
              </div>

              {/* Response Headers */}
              {delivery.response.headers && Object.keys(delivery.response.headers).length > 0 && (
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
                    Response Headers
                  </span>
                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
                    {Object.entries(delivery.response.headers).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row p-2.5 font-mono bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                      >
                        <span className="sm:w-44 font-semibold text-zinc-500 dark:text-zinc-400 shrink-0">
                          {key}
                        </span>
                        <span className="break-all">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response Body with 10KB Truncation Notice */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Response Body
                  </span>
                  {isBodyTruncated && (
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                      ⚠️ Truncated at 10KB
                    </span>
                  )}
                </div>

                <SyntaxHighlightedJson
                  data={displayBody}
                  maxHeight="max-h-[340px]"
                  showCopy={true}
                />
              </div>
            </div>
          )}

          {/* TAB 3: Attempt History */}
          {activeTab === 'attempts' && (
            <div className="space-y-3 animate-fadeIn">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">
                Delivery Execution Log ({delivery.attempts.length} attempts recorded)
              </span>

              <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 space-y-4 py-1">
                {delivery.attempts.map((attempt) => {
                  const attemptSuccess = attempt.result === 'succeeded';
                  const attemptPending = attempt.result === 'pending_retry';

                  return (
                    <div key={attempt.attemptNumber} className="relative pl-6">
                      {/* Timeline dot */}
                      <span
                        className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white dark:border-zinc-950 ${
                          attemptSuccess
                            ? 'bg-emerald-500'
                            : attemptPending
                            ? 'bg-amber-500 animate-pulse'
                            : 'bg-rose-500'
                        }`}
                      />

                      <div className="p-3.5 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            Attempt #{attempt.attemptNumber}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              attemptSuccess
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : attemptPending
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {attempt.result.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 font-mono">
                          <span>Status: <strong>{attempt.httpStatus} {attempt.statusText}</strong></span>
                          <span>•</span>
                          <span>Latency: {attempt.responseTimeMs}ms</span>
                          <span>•</span>
                          <span>{f.time(attempt.timestamp, true)}</span>
                        </div>

                        {attempt.errorMessage && (
                          <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 text-[11px] font-mono break-all border border-rose-200 dark:border-rose-900">
                            {attempt.errorMessage}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
