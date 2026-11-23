'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth-context';
import {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEndpoint,
  WEBHOOK_EVENT_GROUPS,
} from '@/types/webhooks';
import {
  DEFAULT_ENDPOINT,
  getEndpointById,
  getStoredDeliveries,
  calculateEndpointHealth,
  retrySingleDelivery,
  bulkRetryDeliveries,
  dispatchTestWebhookEvent,
} from '@/lib/webhook-data';
import EndpointHealthChart from '@/components/webhooks/EndpointHealthChart';
import FailureWarningBanner from '@/components/webhooks/FailureWarningBanner';
import DeliveriesList from '@/components/webhooks/DeliveriesList';
import SyntaxHighlightedJson from '@/components/webhooks/SyntaxHighlightedJson';

function WebhookDeliveriesContent() {
  const params = useParams();
  const endpointId = (params?.endpointId as string) || DEFAULT_ENDPOINT.id;

  const [endpoint, setEndpoint] = useState<WebhookEndpoint>(DEFAULT_ENDPOINT);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [activeFilterStatus, setActiveFilterStatus] = useState<WebhookDeliveryStatus | 'all'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [testEventType, setTestEventType] = useState<string>('payment.completed');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<WebhookDelivery | null>(null);
  const [testDispatchError, setTestDispatchError] = useState<string | null>(null);

  // Load endpoint and deliveries
  useEffect(() => {
    const ep = getEndpointById(endpointId);
    if (!ep) {
      notFound();
      return;
    }
    setEndpoint(ep);
    const list = getStoredDeliveries(endpointId);
    setDeliveries(list);
  }, [endpointId]);

  // Calculate health
  const health = calculateEndpointHealth(deliveries);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Single Resend Action
  const handleResendSingle = (deliveryId: string) => {
    const { updatedList } = retrySingleDelivery(deliveryId, deliveries);
    setDeliveries(updatedList);
    showToast(`✓ Delivery ${deliveryId} resent successfully! Status updated to 200 OK.`);
  };

  // Bulk Resend Action
  const handleBulkResend = (deliveryIds: string[]) => {
    const updatedList = bulkRetryDeliveries(deliveryIds, deliveries);
    setDeliveries(updatedList);
    showToast(`✓ Bulk resent ${deliveryIds.length} failed deliveries! Updated to 200 OK.`);
  };

  // Send test event action (event picker + request/response inspection)
  const isEndpointDisabled = endpoint.status !== 'active';

  const handleSendTestEvent = () => {
    if (isEndpointDisabled || isSendingTest) return;

    setIsSendingTest(true);
    setTestResult(null);
    setTestDispatchError(null);

    // Simulate the round trip so the UI mirrors a real outbound dispatch.
    setTimeout(() => {
      try {
        const { delivery } = dispatchTestWebhookEvent(endpointId, testEventType);
        setDeliveries((prev) => [delivery, ...prev]);
        setTestResult(delivery);
        showToast(
          delivery.status === 'succeeded'
            ? `✓ Test ${delivery.eventType} delivered — HTTP ${delivery.response.statusCode} (${delivery.response.responseTimeMs} ms)`
            : `✕ Test ${delivery.eventType} failed — ${delivery.statusText} (${delivery.response.responseTimeMs} ms)`
        );
      } catch {
        setTestDispatchError(
          'Unable to dispatch the test event. Verify the endpoint URL is reachable and try again.'
        );
      } finally {
        setIsSendingTest(false);
      }
    }, 600);
  };

  const handleCopySecret = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(endpoint.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-300 bg-white p-4 shadow-xl dark:border-emerald-800 dark:bg-zinc-900 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-zinc-500">
        <Link href="/overview" className="hover:text-zinc-900 dark:hover:text-white">
          Overview
        </Link>
        <span>/</span>
        <Link href="/webhooks" className="hover:text-zinc-900 dark:hover:text-white">
          Webhooks
        </Link>
        <span>/</span>
        <span className="text-zinc-900 dark:text-white font-medium font-mono">
          {endpointId}
        </span>
      </div>

      {/* Endpoint Header & Secret Key Card */}
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 sm:p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Webhook Delivery Logs
              </h1>
              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold border ${
                endpoint.status === 'active'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                  : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${endpoint.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'}`} />
                {endpoint.status === 'active' ? 'Active Endpoint' : 'Paused Endpoint'}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-600 dark:text-zinc-300 mt-1 break-all">
              {endpoint.url}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <label htmlFor="test-event-type" className="sr-only">
                Test event type
              </label>
              <select
                id="test-event-type"
                value={testEventType}
                onChange={(e) => setTestEventType(e.target.value)}
                disabled={isEndpointDisabled || isSendingTest}
                title={
                  isEndpointDisabled
                    ? 'Enable this endpoint to send a test event'
                    : 'Choose the event type to dispatch'
                }
                className="max-w-[220px] rounded-xl border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-mono font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {WEBHOOK_EVENT_GROUPS.map((group) => (
                  <optgroup key={group.id} label={group.name}>
                    {group.events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>

              <button
                type="button"
                onClick={handleSendTestEvent}
                disabled={isEndpointDisabled || isSendingTest}
                title={
                  isEndpointDisabled
                    ? 'Enable this endpoint to send a test event'
                    : 'Dispatch a sample event and inspect the response'
                }
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              >
                {isSendingTest ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Sending…</span>
                  </>
                ) : (
                  <span>⚡ Send Test Event</span>
                )}
              </button>
            </div>

            <Link
              href="/webhooks"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 text-center"
            >
              All Webhooks
            </Link>
          </div>
        </div>

        {/* Signing Secret Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500 font-medium">Signing Secret:</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
              {showSecret ? endpoint.secret : 'whsec_••••••••••••••••••••••••••••••••'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSecret(!showSecret)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
            >
              {showSecret ? 'Hide' : 'Reveal'}
            </button>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <button
              type="button"
              onClick={handleCopySecret}
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white cursor-pointer"
            >
              {copiedSecret ? '✓ Copied' : 'Copy Secret'}
            </button>
          </div>
        </div>
      </div>

      {/* Send Test Event dispatch error */}
      {testDispatchError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
          {testDispatchError}
        </div>
      )}

      {/* Send Test Event result: request payload, response status, latency, response body */}
      {testResult && (
        <div className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
                  Test Event Result
                </h2>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase border ${
                    testResult.status === 'succeeded'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800'
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      testResult.status === 'succeeded' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                  />
                  {testResult.status === 'succeeded' ? 'Delivered' : 'Failed'}
                </span>
                <span className="rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:border-sky-800 dark:bg-sky-950/60 dark:text-sky-300">
                  Test
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                <code className="font-mono text-zinc-700 dark:text-zinc-300">
                  {testResult.eventType}
                </code>
                <span className="mx-1.5">•</span>
                <span className="font-mono">{testResult.id}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setTestResult(null)}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              title="Dismiss test result"
            >
              ✕
            </button>
          </div>

          {/* Response status, latency & destination */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-[11px] text-zinc-500 block">Response Status</span>
              <span
                className={`mt-1 block text-sm font-bold font-mono ${
                  testResult.status === 'succeeded'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                HTTP {testResult.response.statusCode} {testResult.response.statusText}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-[11px] text-zinc-500 block">Roundtrip Latency</span>
              <span className="mt-1 block text-sm font-bold font-mono text-zinc-900 dark:text-white">
                {testResult.response.responseTimeMs} ms
              </span>
            </div>

            <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              <span className="text-[11px] text-zinc-500 block">Destination</span>
              <span className="mt-1 block text-[11px] font-mono text-zinc-700 dark:text-zinc-300 break-all">
                {testResult.request.url}
              </span>
            </div>
          </div>

          {/* Failure guidance */}
          {testResult.status !== 'succeeded' && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              <span className="mb-0.5 block font-bold">
                {testResult.response.statusCode === 504
                  ? 'Request timed out'
                  : 'Endpoint rejected the test event'}
              </span>
              {testResult.attempts[0]?.errorMessage ||
                'Your endpoint must return a 2xx status within 10s to acknowledge a webhook delivery.'}
            </div>
          )}

          {/* Request payload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Request Payload (POST application/json)
              </span>
              <span className="font-mono text-[10px] text-zinc-400">{testResult.eventId}</span>
            </div>
            <SyntaxHighlightedJson
              data={testResult.request.payload}
              maxHeight="max-h-72"
              showCopy={true}
            />
          </div>

          {/* Response body */}
          <div className="space-y-2">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Response Body
            </span>
            <SyntaxHighlightedJson
              data={testResult.response.body}
              maxHeight="max-h-56"
              showCopy={true}
            />
          </div>
        </div>
      )}

      {/* Requirement 4: High Failure Rate Warning Banner */}
      <FailureWarningBanner
        failureRate={health.failureRate}
        failedCount={health.failedDeliveries}
        totalCount={health.totalDeliveries}
        onFilterFailed={() => setActiveFilterStatus('failed')}
      />

      {/* Requirement 4: 7-Day Endpoint Health Chart */}
      <EndpointHealthChart
        health={health}
        endpointUrl={endpoint.url}
      />

      {/* Requirement 1, 2, 3: Deliveries List with Filters, Payload Detail Panel, and Single/Bulk Resend */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 dark:text-white">
            Delivery History ({deliveries.length})
          </h2>
          <span className="text-xs text-zinc-500">
            Click any row to inspect full request & response payloads
          </span>
        </div>

        <DeliveriesList
          deliveries={deliveries}
          onResendSingle={handleResendSingle}
          onBulkResend={handleBulkResend}
          filterStatus={activeFilterStatus}
        />
      </div>
    </main>
  );
}

export default function WebhookDeliveriesPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
        <WebhookDeliveriesContent />
      </div>
    </AuthProvider>
  );
}
