'use client';

import React, { useEffect, useState } from 'react';
import {
  ApiKeyItem,
  addIpAllowlistEntry,
  parseIpAllowlistInput,
} from '@/lib/apiKeys';
import IpAllowlistEditor from '@/components/developers/IpAllowlistEditor';

interface EditKeyModalProps {
  keyItem: ApiKeyItem | null;
  isOpen: boolean;
  onClose: () => void;
  onKeyUpdated: (updated: ApiKeyItem) => void;
}

export default function EditKeyModal({
  keyItem,
  isOpen,
  onClose,
  onKeyUpdated,
}: EditKeyModalProps) {
  const [ipAllowlist, setIpAllowlist] = useState<string[]>([]);
  const [ipDraft, setIpDraft] = useState('');
  const [ipError, setIpError] = useState<string | null>(null);

  // Reload the editor whenever a different key is opened.
  useEffect(() => {
    if (isOpen && keyItem) {
      setIpAllowlist(keyItem.ipAllowlist ?? []);
      setIpDraft('');
      setIpError(null);
    }
  }, [isOpen, keyItem]);

  if (!isOpen || !keyItem) return null;

  const handleAddIp = () => {
    const { entries, error } = addIpAllowlistEntry(ipAllowlist, ipDraft);
    if (error) {
      setIpError(error);
      return;
    }
    setIpAllowlist(entries);
    setIpDraft('');
    setIpError(null);
  };

  const handleRemoveIp = (entry: string) => {
    setIpAllowlist((prev) => prev.filter((existing) => existing !== entry));
    setIpError(null);
  };

  const handleSave = () => {
    // Fold any un-committed input into the allowlist, then validate it.
    const withDraft = addIpAllowlistEntry(ipAllowlist, ipDraft);
    if (withDraft.error) {
      setIpError(withDraft.error);
      return;
    }
    const { entries, errors } = parseIpAllowlistInput(withDraft.entries);
    if (errors.length > 0) {
      setIpError(errors[0]);
      return;
    }

    onKeyUpdated({ ...keyItem, ipAllowlist: entries });
    setIpDraft('');
    setIpError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white">
              Edit Secret API Key
            </h2>
            <p className="font-mono text-xs text-zinc-500">
              {keyItem.name} ({keyItem.keyPrefix})
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-zinc-600 dark:text-zinc-300">
            Requests signed with this key are only accepted from the IP addresses and CIDR ranges
            listed below. Removing every rule allows requests from any IP address.
          </p>

          <IpAllowlistEditor
            entries={ipAllowlist}
            draft={ipDraft}
            onDraftChange={(value) => {
              setIpDraft(value);
              if (ipError) setIpError(null);
            }}
            onAdd={handleAddIp}
            onRemove={handleRemoveIp}
            error={ipError}
          />

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-zinc-200 px-4 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-[#000F24] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
