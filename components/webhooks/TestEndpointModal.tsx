'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Webhook, WebhookDelivery, WEBHOOK_EVENT_GROUPS } from '@/lib/types';
import { sendTestWebhookEvent } from '@/lib/webhook-data';

interface TestEndpointModalProps {
  isOpen: boolean;
  endpoint: Webhook | null;
  onClose: () => void;
  onTestSent?: (delivery: WebhookDelivery) => void;
}

export default function TestEndpointModal({
  isOpen,
  endpoint,
  onClose,
  onTestSent,
}: TestEndpointModalProps) {
  const [selectedEventType, setSelectedEventType] = useState<string>('payment.completed');
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    delivery: WebhookDelivery;
    status: number;
    statusText: string;
    responseTimeMs: number;
  } | null>(null);

  if (!isOpen || !endpoint) return null;

  const handleSendTest = () => {
    setIsSending(true);
    setTestResult(null);

    setTimeout(() => {
      const result = sendTestWebhookEvent(endpoint.id, selectedEventType);
      setIsSending(false);
      setTestResult(result);
      if (onTestSent) {
        onTestSent(result.delivery);
      }
    }, 600);
  };

  const handleReset = () => {
    setTestResult(null);
  };

  const handleClose = () => {
    setTestResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col max-h-[90vh] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-sm">
              ⚡
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Send Test Webhook Event
              </h3>
              <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate max-w-md">
                {endpoint.url}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form or Result View */}
        {!testResult ? (
          <div className="space-y-4">
            {/* Event Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Select Event Type to Dispatch
              </label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-sky-500 focus:outline-none"
              >
                {WEBHOOK_EVENT_GROUPS.map((group) => (
                  <optgroup key={group.id} label={group.name}>
                    {group.events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.id} — {ev.description}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* Simulated Payload Preview */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                Event Payload Preview:
              </label>
              <div className="rounded-xl border border-zinc-200 bg-zinc-900 p-3 font-mono text-[11px] text-zinc-300 dark:border-zinc-800 max-h-48 overflow-y-auto">
                <pre>
                  {JSON.stringify(
                    {
                      id: `evt_test_${selectedEventType.replace('.', '_')}`,
                      event: selectedEventType,
                      created_at: new Date().toISOString(),
                      data: {
                        amount: '50.00',
                        currency: 'USDC',
                        status: 'confirmed',
                        network: 'stellar_testnet',
                      },
                    },
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Testnet Note */}
            <p className="text-[11px] text-zinc-500">
              FacilPay will sign the request with this endpoint&apos;s signing secret and dispatch it as a POST request with headers <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">X-FacilPay-Signature</code> and <code className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">X-FacilPay-Event-ID</code>.
            </p>

            {/* Modal Actions */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSending}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Dispatching Event...</span>
                  </>
                ) : (
                  <>
                    <span>⚡ Send Test Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Response Result Box */
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-xs">
                  ✓
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                      HTTP {testResult.status} {testResult.statusText}
                    </span>
                    <span className="rounded-md bg-emerald-200/60 dark:bg-emerald-900/60 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                      {testResult.responseTimeMs} ms
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                    Endpoint responded successfully to <code className="font-mono font-semibold">{testResult.delivery.eventType}</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Response Payload & Details */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Response Body:</span>
                <span className="font-mono text-[10px]">Delivery ID: {testResult.delivery.id}</span>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-900 p-3 font-mono text-[11px] text-emerald-400 dark:border-zinc-800 max-h-40 overflow-y-auto">
                <pre>{testResult.delivery.response.body}</pre>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
              <Link
                href={`/webhooks/${endpoint.id}`}
                className="text-xs text-sky-600 hover:text-sky-700 dark:text-sky-400 font-medium inline-flex items-center gap-1"
              >
                <span>View Full Delivery Logs</span>
                <span>→</span>
              </Link>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  Send Another
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
