'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth-context';
import ApiKeyModal from '@/components/overview/ApiKeyModal';

export default function ApiKeysPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keys, setKeys] = useState([
    {
      id: 'key_1',
      name: 'Default Testnet Integration Key',
      prefix: 'fp_test_89a3...',
      type: 'test',
      createdAt: 'Just now',
    },
  ]);

  const handleCreate = () => {
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    setKeys((prev) => [
      ...prev,
      {
        id: `key_${Date.now()}`,
        name: 'New Integration Key',
        prefix: 'fp_test_live...',
        type: 'test',
        createdAt: 'Just now',
      },
    ]);
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link href="/overview" className="hover:text-zinc-900 dark:hover:text-white">
              Overview
            </Link>
            <span>/</span>
            <span className="text-zinc-900 dark:text-white font-medium">API Keys</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-5 dark:border-zinc-800">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                API Keys & Developer Tokens
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                Authenticate requests from your backend server or e-commerce shop using secret tokens.
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 cursor-pointer"
            >
              + Create New API Key
            </button>
          </div>

          {/* Keys List */}
          <div className="space-y-3">
            {keys.map((k) => (
              <div
                key={k.id}
                className="p-4 rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">
                      {k.name}
                    </span>
                    <span className="rounded bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 uppercase">
                      {k.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 font-mono">
                    <span>Key Prefix: {k.prefix}</span>
                    <span>•</span>
                    <span>Created: {k.createdAt}</span>
                  </div>
                </div>

                <button
                  onClick={() => alert('API key revoked')}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 cursor-pointer self-start sm:self-center"
                >
                  Revoke Key
                </button>
              </div>
            ))}
          </div>

          <ApiKeyModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSuccess}
          />
        </main>
      </div>
    </AuthProvider>
  );
}
