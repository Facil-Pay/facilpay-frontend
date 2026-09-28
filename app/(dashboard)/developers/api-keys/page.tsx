'use client';

import React, { useState, useMemo } from 'react';
import CreateKeyModal from '@/components/developers/CreateKeyModal';
import RollKeyModal from '@/components/developers/RollKeyModal';
import QuickstartSection from '@/components/developers/QuickstartSection';
import {
  ApiKeyItem,
  NetworkMode,
  PUBLISHABLE_KEYS,
  INITIAL_API_KEYS,
} from '@/lib/apiKeys';

export default function ApiKeysPage() {
  const [network, setNetwork] = useState<NetworkMode>('testnet');
  const [keys, setKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [rollingKey, setRollingKey] = useState<ApiKeyItem | null>(null);
  const [copiedPk, setCopiedPk] = useState(false);

  // Active publishable key based on network
  const activePublishableKey = PUBLISHABLE_KEYS[network];

  // Filter keys by environment (testnet vs mainnet)
  const filteredKeys = useMemo(() => {
    return keys.filter((k) => k.network === network);
  }, [keys, network]);

  const handleCopyPublishableKey = async () => {
    try {
      await navigator.clipboard.writeText(activePublishableKey);
      setCopiedPk(true);
      setTimeout(() => setCopiedPk(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleKeyCreated = (newKey: ApiKeyItem) => {
    setKeys((prev) => [newKey, ...prev]);
  };

  const handleRevokeKey = (keyId: string) => {
    const target = keys.find((k) => k.id === keyId);
    if (!target) return;

    if (
      !confirm(
        `Are you sure you want to revoke API key "${target.name}"? Applications utilizing this secret key will immediately be rejected by the API.`
      )
    ) {
      return;
    }

    setKeys((prev) =>
      prev.map((k) => (k.id === keyId ? { ...k, status: 'revoked' } : k))
    );
  };

  const handleKeyRolled = (
    oldKeyId: string,
    newKey: ApiKeyItem,
    gracePeriod: 'now' | '1h' | '24h' | '7d'
  ) => {
    const now = new Date();
    let rollingExpiresAt: string = now.toISOString();

    if (gracePeriod === '1h') {
      rollingExpiresAt = new Date(now.getTime() + 3600 * 1000).toISOString();
    } else if (gracePeriod === '24h') {
      rollingExpiresAt = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    } else if (gracePeriod === '7d') {
      rollingExpiresAt = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
    }

    setKeys((prev) => [
      newKey,
      ...prev.map((k) =>
        k.id === oldKeyId
          ? {
              ...k,
              status: gracePeriod === 'now' ? ('revoked' as const) : ('rolling' as const),
              rollingExpiresAt,
              gracePeriod,
            }
          : k
      ),
    ]);
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Title and Network Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              API Keys Management
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Manage publishable and secret keys to authenticate backend integrations and mobile apps.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Network Environment Toggle */}
            <div className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-1 text-xs dark:border-zinc-800 dark:bg-zinc-900">
              <button
                type="button"
                onClick={() => setNetwork('testnet')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  network === 'testnet'
                    ? 'bg-[#000F24] text-white shadow-sm dark:bg-[#55C2FF] dark:text-black'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                Testnet Keys
              </button>
              <button
                type="button"
                onClick={() => setNetwork('mainnet')}
                className={`rounded-lg px-3 py-1.5 font-semibold transition-all ${
                  network === 'mainnet'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400'
                }`}
              >
                Mainnet (Live)
              </button>
            </div>

            {/* Create Secret Key Button */}
            <button
              type="button"
              id="create-secret-key-btn"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black dark:hover:bg-[#A5D4FF]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Create Secret Key</span>
            </button>
          </div>
        </div>

        {/* 1. Publishable Key Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                Publishable API Key ({network.toUpperCase()})
              </span>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Safe to include in client-side code, mobile applications, and checkout scripts.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                network === 'testnet'
                  ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {network}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/70 p-3 font-mono text-xs text-zinc-900 select-all break-all dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100">
            <span>{activePublishableKey}</span>
            <button
              type="button"
              onClick={handleCopyPublishableKey}
              className="shrink-0 rounded-lg bg-white border border-zinc-200 px-3 py-1 font-sans text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
            >
              {copiedPk ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
        </div>

        {/* 2. Secret Keys Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                Secret API Keys ({network.toUpperCase()})
              </h2>
              <p className="text-xs text-zinc-500">
                Full-permission credentials for server-to-server API calls. Do not expose in client code.
              </p>
            </div>
            <span className="text-xs font-semibold text-zinc-500">
              {filteredKeys.length} Key{filteredKeys.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 uppercase tracking-wider text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Key Prefix</th>
                  <th className="px-6 py-3.5">Permissions</th>
                  <th className="px-6 py-3.5">Created Date</th>
                  <th className="px-6 py-3.5">Last Used</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {filteredKeys.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-zinc-500">
                      No secret keys created for {network}. Click &ldquo;Create Secret Key&rdquo; to generate one.
                    </td>
                  </tr>
                ) : (
                  filteredKeys.map((keyItem) => {
                    const isRevoked = keyItem.status === 'revoked';
                    const isRolling = keyItem.status === 'rolling';

                    return (
                      <tr
                        key={keyItem.id}
                        className={`transition-colors ${
                          isRevoked
                            ? 'opacity-60 bg-zinc-50/50 dark:bg-zinc-950/40'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                        }`}
                      >
                        {/* Name & Creator */}
                        <td className="px-6 py-4">
                          <span className="font-semibold text-zinc-900 dark:text-white block">
                            {keyItem.name}
                          </span>
                          <span className="text-[11px] text-zinc-400">
                            By {keyItem.createdBy}
                          </span>
                        </td>

                        {/* Masked Prefix */}
                        <td className="px-6 py-4 font-mono text-zinc-700 dark:text-zinc-300">
                          {keyItem.keyPrefix}
                        </td>

                        {/* Permissions */}
                        <td className="px-6 py-4">
                          {keyItem.permissions.type === 'full_access' ? (
                            <span className="rounded bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              Full Access
                            </span>
                          ) : (
                            <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                              Restricted
                            </span>
                          )}
                          {keyItem.expiresAt && (
                            <span className="text-[10px] text-zinc-400 block mt-0.5">
                              Exp: {keyItem.expiresAt.slice(0, 10)}
                            </span>
                          )}
                        </td>

                        {/* Created Date */}
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                          {keyItem.createdDate.slice(0, 10)}
                        </td>

                        {/* Last Used */}
                        <td className="px-6 py-4 text-zinc-600 dark:text-zinc-400">
                          {keyItem.lastUsed ? (
                            <span>{keyItem.lastUsed.slice(0, 10)}</span>
                          ) : (
                            <span className="text-zinc-400">Never</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                              keyItem.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                                : keyItem.status === 'rolling'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                            }`}
                          >
                            {keyItem.status}
                          </span>
                          {isRolling && keyItem.gracePeriod && (
                            <span className="text-[10px] text-amber-700 block mt-0.5">
                              Expires in {keyItem.gracePeriod}
                            </span>
                          )}
                        </td>

                        {/* Actions: Roll & Revoke */}
                        <td className="px-6 py-4 text-right space-x-2">
                          {!isRevoked && (
                            <>
                              <button
                                type="button"
                                onClick={() => setRollingKey(keyItem)}
                                className="rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                              >
                                Roll Key
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRevokeKey(keyItem.id)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300"
                              >
                                Revoke
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Developer Quickstart Code Section */}
        <QuickstartSection
          publishableKey={activePublishableKey}
          network={network}
        />
      </div>

      {/* Modal: Create Secret Key */}
      <CreateKeyModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        network={network}
        onKeyCreated={handleKeyCreated}
      />

      {/* Modal: Roll Secret Key with Grace Period */}
      <RollKeyModal
        keyItem={rollingKey}
        isOpen={!!rollingKey}
        onClose={() => setRollingKey(null)}
        onKeyRolled={handleKeyRolled}
      />
    </>
  );
}
