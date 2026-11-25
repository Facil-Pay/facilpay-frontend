'use client';

import React, { useState } from 'react';

interface InviteTeammateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteTeammateModal({
  isOpen,
  onClose,
  onSuccess,
}: InviteTeammateModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'developer' | 'accountant' | 'viewer'>('developer');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      onSuccess();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Invite a Teammate
            </h3>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSend} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Colleague Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              placeholder="developer@yourcompany.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-sky-500 focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Role & Permissions
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'admin', label: 'Admin', desc: 'Full access to settlements & settings' },
                { id: 'developer', label: 'Developer', desc: 'Webhooks, API keys & payment links' },
                { id: 'accountant', label: 'Accountant', desc: 'Read balances & transaction reports' },
                { id: 'viewer', label: 'Viewer', desc: 'Read-only dashboard metrics' },
              ].map((r) => (
                <label
                  key={r.id}
                  onClick={() => setRole(r.id as typeof role)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer ${
                    role === r.id
                      ? 'border-sky-400 bg-sky-50 dark:bg-sky-950/60 dark:border-sky-700 text-sky-800 dark:text-sky-200'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  <div className="font-semibold">{r.label}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">{r.desc}</div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSending}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 cursor-pointer"
            >
              {isSending ? 'Sending Invite...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
