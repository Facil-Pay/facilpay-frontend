'use client';

import React, { useState } from 'react';
import { Webhook } from '@/lib/types';

interface DeleteEndpointModalProps {
  isOpen: boolean;
  endpoint: Webhook | null;
  onClose: () => void;
  onConfirmDelete: (endpointId: string) => void;
}

export default function DeleteEndpointModal({
  isOpen,
  endpoint,
  onClose,
  onConfirmDelete,
}: DeleteEndpointModalProps) {
  const [typedConfirmation, setTypedConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !endpoint) return null;

  const isConfirmed = typedConfirmation.trim().toLowerCase() === 'delete';

  const handleDelete = () => {
    if (!isConfirmed) return;
    setIsDeleting(true);
    setTimeout(() => {
      onConfirmDelete(endpoint.id);
      setIsDeleting(false);
      setTypedConfirmation('');
      onClose();
    }, 400);
  };

  const handleClose = () => {
    setTypedConfirmation('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Delete Webhook Endpoint?
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              This action cannot be undone. Webhooks will no longer be dispatched to this URL.
            </p>
          </div>
        </div>

        {/* Target Details */}
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1">
          <div className="font-mono font-semibold text-zinc-900 dark:text-zinc-100 truncate">
            {endpoint.url}
          </div>
          {endpoint.description && (
            <div className="text-zinc-500 dark:text-zinc-400 text-[11px] truncate">
              {endpoint.description}
            </div>
          )}
        </div>

        {/* Typed Confirmation Prompt */}
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
            To confirm deletion, please type <strong className="text-rose-600 dark:text-rose-400 font-mono">delete</strong> below:
          </label>
          <input
            type="text"
            value={typedConfirmation}
            onChange={(e) => setTypedConfirmation(e.target.value)}
            placeholder="Type 'delete' to confirm"
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            autoFocus
          />
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className={`rounded-xl px-5 py-2 text-xs font-semibold text-white shadow-sm transition-all ${
              isConfirmed && !isDeleting
                ? 'bg-rose-600 hover:bg-rose-500 cursor-pointer shadow-rose-600/20'
                : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-600 cursor-not-allowed'
            }`}
          >
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}
