'use client';

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import { AuthProvider, useAuth } from '@/lib/auth-context';

function LoginContent() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [mode, setMode] = useState<'new' | 'existing'>('new');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({
      isNewMerchant: mode === 'new',
      email: email || (mode === 'new' ? 'newmerchant@example.com' : 'merchant@acme.com'),
      name: mode === 'new' ? 'New Merchant' : 'Acme Corporation',
    });
  };

  const handleWalletLogin = () => {
    login({
      isNewMerchant: mode === 'new',
      email: 'wallet-merchant@stellar.org',
      name: mode === 'new' ? 'New Wallet Merchant' : 'Stellar Verified Merchant',
    });
  };

  return (
    <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-zinc-200/80 bg-white/95 p-8 shadow-xl shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#55C2FF] to-[#0066FF] shadow-sm shadow-[#55C2FF]/30">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Sign In to FacilPay
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Accept non-custodial crypto payments on Stellar
          </p>
        </div>

        {/* Demo Mode Toggle: New vs Existing Merchant */}
        <div className="rounded-xl bg-zinc-100 p-1 dark:bg-zinc-900">
          <div className="grid grid-cols-2 gap-1 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`rounded-lg py-2 transition-all cursor-pointer ${
                mode === 'new'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              New Merchant
            </button>
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`rounded-lg py-2 transition-all cursor-pointer ${
                mode === 'existing'
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Existing Merchant
            </button>
          </div>
        </div>

        {/* Mode Explanation Notice */}
        <div
          className={`p-3 rounded-xl text-xs ${
            mode === 'new'
              ? 'bg-sky-50 border border-sky-200 text-sky-800 dark:bg-sky-950/40 dark:border-sky-800 dark:text-sky-300'
              : 'bg-zinc-100 border border-zinc-200 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-300'
          }`}
        >
          {mode === 'new' ? (
            <p>
              ✨ <strong>Trigger Requirement:</strong> Signing in as a new merchant without a completed profile will automatically send you directly to <strong>/onboarding</strong>.
            </p>
          ) : (
            <p>
              ✓ Signing in as an existing merchant with a completed profile takes you directly to the <strong>Overview</strong> dashboard.
            </p>
          )}
        </div>

        {/* Email form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Merchant Email Address
            </label>
            <input
              type="email"
              placeholder={mode === 'new' ? 'newmerchant@example.com' : 'merchant@acme.com'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
          >
            {mode === 'new' ? 'Sign In & Start Onboarding' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase">
            <span className="bg-white px-2 text-zinc-400 dark:bg-zinc-950">
              Or connect wallet
            </span>
          </div>
        </div>

        {/* Freighter Wallet Connect Button */}
        <button
          type="button"
          onClick={handleWalletLogin}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span>Connect Freighter / Stellar Wallet</span>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
        <Navbar />
        <LoginContent />
      </div>
    </AuthProvider>
  );
}
