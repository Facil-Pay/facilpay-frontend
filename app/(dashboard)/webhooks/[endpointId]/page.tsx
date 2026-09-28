'use client';

import React, { useState, useEffect, useId } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth-context';
import {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookEndpoint,
} from '@/types/webhooks';
import {
  DEFAULT_ENDPOINT,
  getEndpointById,
  getStoredDeliveries,
  calculateEndpointHealth,
  retrySingleDelivery,
  bulkRetryDeliveries,
  saveStoredDeliveries,
} from '@/lib/webhook-data';
import EndpointHealthChart from '@/components/webhooks/EndpointHealthChart';
import FailureWarningBanner from '@/components/webhooks/FailureWarningBanner';
import DeliveriesList from '@/components/webhooks/DeliveriesList';

function WebhookDeliveriesContent() {
  const params = useParams();
  const endpointId = (params?.endpointId as string) || DEFAULT_ENDPOINT.id;

  const [endpoint, setEndpoint] = useState<WebhookEndpoint>(DEFAULT_ENDPOINT);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [activeFilterStatus, setActiveFilterStatus] = useState<WebhookDeliveryStatus | 'all'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const fallbackId = useId();

  // Load endpoint and deliveries
  useEffect(() => {
    const ep = getEndpointById(endpointId) || DEFAULT_ENDPOINT;
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

  // Trigger test delivery injection
  const handleSendTestWebhook = () => {
    const nowIso = new Date().toISOString();
    const newDelivery: WebhookDelivery = {
      id: `del_${Date.now().toString(36)}`,
      eventId: `evt_test_${fallbackId.replace(/:/g, '')}`,
      eventType: 'payment.completed',
      status: 'succeeded',
      httpStatus: 200,
      statusText: 'OK',
      attemptCount: 1,
      deliveredAt: nowIso,
      endpointId,
      request: {
        url: endpoint.url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FacilPay-Webhooks/1.0',
          'X-FacilPay-Signature': `t=${Math.floor(Date.now() / 1000)},v1=7a9b8c0d1e2f...`,
          'X-FacilPay-Event-ID': `evt_test_${Date.now()}`,
          'X-FacilPay-Delivery-ID': `del_${Date.now().toString(36)}`,
        },
        payload: {
          id: `evt_test_${Date.now()}`,
          event: 'payment.completed',
          data: {
            amount: '25.00',
            currency: 'USDC',
            status: 'settled',
          },
        },
      },
      response: {
        statusCode: 200,
        statusText: 'OK',
        responseTimeMs: Math.floor(Math.random() * 50) + 65,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ received: true, ping: 'test' }, null, 2),
      },
      attempts: [
        {
          attemptNumber: 1,
          timestamp: nowIso,
          httpStatus: 200,
          statusText: 'OK',
          responseTimeMs: 85,
          result: 'succeeded',
        },
      ],
    };

    const updated = [newDelivery, ...deliveries];
    setDeliveries(updated);
    saveStoredDeliveries(updated);
    showToast('✓ Dispatched test payment.completed webhook ping (200 OK)');
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSendTestWebhook}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 cursor-pointer"
            >
              <span>+ Send Test Ping</span>
            </button>

            <Link
              href="/webhooks"
              className="rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
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
