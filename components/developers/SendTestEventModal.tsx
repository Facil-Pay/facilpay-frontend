'use client';

import React, { useState, useEffect } from 'react';
import {
  WebhookEndpoint,
  WebhookDelivery,
  WebhookEventType,
} from '@/types/webhooks';
import {
  getStoredEndpoints,
  sendTestWebhookEvent,
  INITIAL_ENDPOINTS,
  DEFAULT_ENDPOINT,
} from '@/lib/webhook-data';
import { WEBHOOK_CATALOG } from '@/lib/webhook-catalog';
import SyntaxHighlightedJson from '@/components/webhooks/SyntaxHighlightedJson';
import { CheckCircle2, XCircle, Send, Clock, ShieldCheck, ArrowRight, X } from 'lucide-react';

interface SendTestEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEventType?: WebhookEventType;
}

export default function SendTestEventModal({
  isOpen,
  onClose,
  initialEventType = 'payment.completed',
}: SendTestEventModalProps) {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(INITIAL_ENDPOINTS);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>(DEFAULT_ENDPOINT.id);
  const [selectedEventType, setSelectedEventType] = useState<WebhookEventType>(initialEventType);
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<{
    delivery: WebhookDelivery;
    status: number;
    statusText: string;
    responseTimeMs: number;
  } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = getStoredEndpoints();
      if (stored && stored.length > 0) {
        setEndpoints(stored);
        setSelectedEndpointId(stored[0].id);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialEventType) {
      setSelectedEventType(initialEventType);
    }
  }, [initialEventType]);

  if (!isOpen) return null;

  const activeEndpoint =
    endpoints.find((ep) => ep.id === selectedEndpointId) ||
    endpoints[0] ||
    DEFAULT_ENDPOINT;

  const handleSendTest = () => {
    setIsSending(true);
    setTestResult(null);

    setTimeout(() => {
      const result = sendTestWebhookEvent(activeEndpoint.id, selectedEventType);
      setIsSending(false);
      setTestResult(result);
    }, 600);
  };

  const handleClose = () => {
    setTestResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col max-h-[90vh] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-950/60 text-[#0066FF] dark:text-[#55C2FF]">
              <Send className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Dispatch Test Webhook Event
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Trigger mock events with signed headers to test your local or production endpoint.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body or Results */}
        {!testResult ? (
          <div className="space-y-4 overflow-y-auto pr-1">
            {/* Target Endpoint Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Target Webhook Endpoint
              </label>
              <select
                value={selectedEndpointId}
                onChange={(e) => setSelectedEndpointId(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-sky-500 focus:outline-none"
              >
                {endpoints.map((ep) => (
                  <option key={ep.id} value={ep.id}>
                    {ep.description} ({ep.url})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Destination URL: <code className="font-mono text-zinc-800 dark:text-zinc-200">{activeEndpoint.url}</code>
              </p>
            </div>

            {/* Event Type Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
                Select Event Type
              </label>
              <select
                value={selectedEventType}
                onChange={(e) => setSelectedEventType(e.target.value as WebhookEventType)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3.5 py-2.5 text-xs font-mono text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-sky-500 focus:outline-none"
              >
                {WEBHOOK_CATALOG.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {item.summary}
                  </option>
                ))}
              </select>
            </div>

            {/* Information Banner */}
            <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3.5 dark:border-sky-900/40 dark:bg-sky-950/20 text-xs text-sky-900 dark:text-sky-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <ShieldCheck className="h-4 w-4 text-sky-600 dark:text-sky-400" />
                <span>HMAC-SHA256 Signature Header Included</span>
              </div>
              <p className="text-[11px] leading-relaxed text-sky-800/80 dark:text-sky-400/80">
                The mock payload is signed using your endpoint secret (<code className="font-mono">{activeEndpoint.secret.slice(0, 10)}...</code>) and dispatched with standard <code className="font-mono">X-FacilPay-Signature</code> headers.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl border border-zinc-300 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendTest}
                disabled={isSending}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {isSending ? (
                  <>
                    <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Dispatching Payload...</span>
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" />
                    <span>Send Test Event</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Test Result Screen */
          <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
            {/* Status Summary Banner */}
            <div
              className={`flex items-center justify-between rounded-xl p-3.5 text-xs font-semibold ${
                testResult.status === 200
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                  : 'border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.status === 200 ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                )}
                <span>
                  Delivery {testResult.status === 200 ? 'Succeeded' : 'Failed'}: HTTP {testResult.status} {testResult.statusText}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] opacity-80">
                <Clock className="h-3.5 w-3.5" />
                <span>{testResult.responseTimeMs}ms</span>
              </div>
            </div>

            {/* Request Headers Inspection */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
                Dispatched Headers
              </p>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 font-mono text-[11px] dark:border-zinc-800 dark:bg-zinc-900">
                {Object.entries(testResult.delivery.request.headers).map(([k, v]) => (
                  <div key={k} className="flex gap-2 py-0.5 truncate">
                    <span className="text-zinc-500 dark:text-zinc-400">{k}:</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Request Payload Inspection */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Event Payload Dispatched
                </p>
                <span className="text-[11px] font-mono text-zinc-500">
                  {testResult.delivery.eventType}
                </span>
              </div>
              <SyntaxHighlightedJson data={testResult.delivery.request.payload} maxHeight="max-h-56" />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setTestResult(null)}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 transition-colors"
              >
                ← Send Another Event
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
