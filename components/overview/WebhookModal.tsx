'use client';

import React, { useState } from 'react';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const EVENT_OPTIONS = [
  { id: 'payment.completed', label: 'Payment Completed', desc: 'Triggered when a customer pays successfully' },
  { id: 'payment.failed', label: 'Payment Failed', desc: 'Triggered if a payment is cancelled or rejected' },
  { id: 'refund.processed', label: 'Refund Processed', desc: 'Triggered when a merchant refund is confirmed' },
  { id: 'trustline.added', label: 'Trustline Added', desc: 'Triggered when a customer establishes a trustline' },
];

export default function WebhookModal({ isOpen, onClose, onSuccess }: WebhookModalProps) {
  const [url, setUrl] = useState('https://api.mybrand.com/webhooks/facilpay');
  const [selectedEvents, setSelectedEvents] = useState<string[]>([
    'payment.completed',
    'refund.processed',
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleEvent = (id: string) => {
    if (selectedEvents.includes(id)) {
      setSelectedEvents(selectedEvents.filter((e) => e !== id));
    } else {
      setSelectedEvents([...selectedEvents, id]);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Webhook endpoint URL is required');
      return;
    }
    if (!/^https?:\/\//i.test(url.trim())) {
      setError('URL must start with https:// or http://');
      return;
    }
    if (selectedEvents.length === 0) {
      setError('Please select at least one event');
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSuccess();
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🔔</span>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Configure Webhook Endpoint
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

        <form onSubmit={handleSave} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Payload Destination URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              placeholder="https://api.yourdomain.com/webhooks"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-sky-500 focus:outline-none"
            />
            {error && <p className="mt-1 text-xs text-rose-500">{error}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
              Subscribed Events
            </label>
            <div className="space-y-2">
              {EVENT_OPTIONS.map((ev) => (
                <label
                  key={ev.id}
                  className="flex items-start gap-2.5 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-xs"
                >
                  <input
                    type="checkbox"
                    checked={selectedEvents.includes(ev.id)}
                    onChange={() => toggleEvent(ev.id)}
                    className="mt-0.5 h-4 w-4 rounded text-sky-600 focus:ring-sky-500"
                  />
                  <div>
                    <span className="font-semibold text-zinc-900 dark:text-zinc-200">
                      {ev.label}
                    </span>
                    <span className="font-mono text-[10px] text-zinc-400 block">{ev.id}</span>
                  </div>
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
              disabled={isSaving}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 cursor-pointer"
            >
              {isSaving ? 'Saving...' : 'Save & Enable Webhook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
