'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/lib/auth-context';
import { Webhook, WebhookDelivery } from '@/lib/types';
import {
  getStoredEndpoints,
  toggleEndpointStatus,
  deleteEndpoint,
  getStoredDeliveries,
  calculateEndpoint24hSuccessRate,
} from '@/lib/webhook-data';
import EndpointsList from './EndpointsList';
import WebhookEndpointModal from './WebhookEndpointModal';
import SecretCreatedModal from './SecretCreatedModal';
import RollSecretModal from './RollSecretModal';
import DeleteEndpointModal from './DeleteEndpointModal';
import TestEndpointModal from './TestEndpointModal';
import SignatureVerificationModal from './SignatureVerificationModal';

export default function WebhookManagementView() {
  const [endpoints, setEndpoints] = useState<Webhook[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);

  // Modal states
  const [isEndpointModalOpen, setIsEndpointModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Webhook | null>(null);

  const [secretCreatedState, setSecretCreatedState] = useState<{
    isOpen: boolean;
    endpoint: Webhook | null;
    secret: string;
  }>({
    isOpen: false,
    endpoint: null,
    secret: '',
  });

  const [rollSecretTarget, setRollSecretTarget] = useState<Webhook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Webhook | null>(null);
  const [testTarget, setTestTarget] = useState<Webhook | null>(null);
  const [signatureGuideState, setSignatureGuideState] = useState<{
    isOpen: boolean;
    secret?: string;
  }>({
    isOpen: false,
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info';
  } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load endpoints and deliveries from local storage
  const reloadData = () => {
    const epList = getStoredEndpoints();
    const delList = getStoredDeliveries();
    setDeliveries(delList);

    // Compute updated success rates dynamically
    const updated = epList.map((ep) => {
      const dynamicRate = calculateEndpoint24hSuccessRate(ep.id, delList);
      return {
        ...ep,
        successRate24h: dynamicRate,
      };
    });

    setEndpoints(updated);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Handlers for CRUD
  const handleOpenCreateModal = () => {
    setEditingEndpoint(null);
    setIsEndpointModalOpen(true);
  };

  const handleOpenEditModal = (ep: Webhook) => {
    setEditingEndpoint(ep);
    setIsEndpointModalOpen(true);
  };

  const handleEndpointSuccess = (
    savedEndpoint: Webhook,
    generatedSecret?: string
  ) => {
    reloadData();
    if (generatedSecret) {
      // Newly created endpoint -> Show one-time secret disclosure modal
      setSecretCreatedState({
        isOpen: true,
        endpoint: savedEndpoint,
        secret: generatedSecret,
      });
      showToast('✓ Webhook endpoint created successfully! Secret generated.');
    } else {
      showToast('✓ Webhook endpoint updated successfully.');
    }
  };

  const handleToggleStatus = (id: string) => {
    const updated = toggleEndpointStatus(id);
    reloadData();
    if (updated) {
      showToast(
        updated.status === 'active'
          ? `✓ Endpoint enabled: receiving live notifications`
          : `⏸ Endpoint paused: notifications disabled`
      );
    }
  };

  const handleRollSecret = (ep: Webhook) => {
    setRollSecretTarget(ep);
  };

  const handleSecretRolled = (updatedEndpoint: Webhook, _newSecret: string) => {
    reloadData();
    showToast(`✓ Signing secret rolled for ${updatedEndpoint.url}`);
  };

  const handleDeletePrompt = (ep: Webhook) => {
    setDeleteTarget(ep);
  };

  const handleConfirmDelete = (id: string) => {
    deleteEndpoint(id);
    reloadData();
    showToast('✓ Webhook endpoint deleted successfully.');
  };

  const handleTestPrompt = (ep: Webhook) => {
    setTestTarget(ep);
  };

  const handleTestSent = (_delivery: WebhookDelivery) => {
    reloadData();
    showToast('✓ Test webhook event dispatched and response logged.');
  };

  const handleOpenVerificationGuide = (secret?: string) => {
    setSignatureGuideState({
      isOpen: true,
      secret: secret || endpoints[0]?.secret || 'whsec_7f9b8c2d1e0a4f5e6b7c8d9e0f1a2b3c4d5e6f7a',
    });
  };

  // Metrics summary
  const stats = useMemo(() => {
    const total = endpoints.length;
    const active = endpoints.filter((e) => e.status === 'active').length;
    const avgSuccess =
      total > 0
        ? Math.round(
            endpoints.reduce((sum, e) => sum + (e.successRate24h ?? 100), 0) / total
          )
        : 100;
    return { total, active, avgSuccess };
  }, [endpoints]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Toast Feedback */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-emerald-300 bg-white p-4 shadow-xl dark:border-emerald-800 dark:bg-zinc-900 text-xs font-semibold text-emerald-800 dark:text-emerald-200 animate-bounce">
            {toastMessage.text}
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/overview" className="hover:text-zinc-900 dark:hover:text-white">
            Overview
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-white font-medium">Webhooks</span>
        </div>

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Webhook Endpoints
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                Stellar Testnet
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-2xl">
              Configure endpoints to receive automated notifications when transactions are confirmed on the Stellar ledger. All webhooks are signed using HMAC-SHA256.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenVerificationGuide()}
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <span>&lt;/&gt;</span>
              <span>Verification Guide</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer"
            >
              <span>+ Add Webhook Endpoint</span>
            </button>
          </div>
        </div>

        {/* Stats & Testnet Helper Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Endpoints
            </div>
            <div className="mt-1 text-xl font-bold text-zinc-900 dark:text-white">
              {stats.total}
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Active Listeners
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {stats.active}
              </span>
              <span className="text-xs text-zinc-400">of {stats.total} enabled</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-zinc-200/80 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Avg 24h Success Rate
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xl font-bold text-zinc-900 dark:text-white">
                {stats.avgSuccess}%
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ● Normal
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-sky-200/80 bg-sky-50/50 dark:border-sky-900/50 dark:bg-sky-950/20 flex flex-col justify-between">
            <div className="text-[11px] font-semibold text-sky-800 dark:text-sky-300">
              🛠️ Testnet Environment
            </div>
            <p className="text-[10px] text-sky-700 dark:text-sky-400 mt-1">
              Supports <code className="font-mono bg-sky-100 dark:bg-sky-900/60 px-1 py-0.5 rounded">http://localhost</code> and <code className="font-mono bg-sky-100 dark:bg-sky-900/60 px-1 py-0.5 rounded">127.0.0.1</code> for rapid local development.
            </p>
          </div>
        </div>

        {/* Endpoints Table View */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">
              Configured Endpoints ({endpoints.length})
            </h2>
            <span className="text-xs text-zinc-500">
              Deliveries automatically retry with exponential backoff
            </span>
          </div>

          <EndpointsList
            endpoints={endpoints}
            onEdit={handleOpenEditModal}
            onDelete={handleDeletePrompt}
            onRollSecret={handleRollSecret}
            onTest={handleTestPrompt}
            onToggleStatus={handleToggleStatus}
            onViewVerificationGuide={handleOpenVerificationGuide}
          />
        </div>

        {/* All Modals */}
        <WebhookEndpointModal
          isOpen={isEndpointModalOpen}
          endpoint={editingEndpoint}
          onClose={() => setIsEndpointModalOpen(false)}
          onSuccess={handleEndpointSuccess}
        />

        <SecretCreatedModal
          isOpen={secretCreatedState.isOpen}
          endpoint={secretCreatedState.endpoint}
          secret={secretCreatedState.secret}
          onClose={() => setSecretCreatedState((prev) => ({ ...prev, isOpen: false }))}
          onOpenVerificationGuide={() => {
            setSecretCreatedState((prev) => ({ ...prev, isOpen: false }));
            handleOpenVerificationGuide(secretCreatedState.secret);
          }}
        />

        <RollSecretModal
          isOpen={Boolean(rollSecretTarget)}
          endpoint={rollSecretTarget}
          onClose={() => setRollSecretTarget(null)}
          onSecretRolled={handleSecretRolled}
        />

        <DeleteEndpointModal
          isOpen={Boolean(deleteTarget)}
          endpoint={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirmDelete={handleConfirmDelete}
        />

        <TestEndpointModal
          isOpen={Boolean(testTarget)}
          endpoint={testTarget}
          onClose={() => setTestTarget(null)}
          onTestSent={handleTestSent}
        />

        <SignatureVerificationModal
          isOpen={signatureGuideState.isOpen}
          secret={signatureGuideState.secret}
          onClose={() => setSignatureGuideState((prev) => ({ ...prev, isOpen: false }))}
        />
      </main>
    </div>
  );
}
