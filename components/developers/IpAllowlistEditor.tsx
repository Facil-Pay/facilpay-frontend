'use client';

import React from 'react';
import { validateIpAllowlistEntry } from '@/lib/apiKeys';

interface IpAllowlistEditorProps {
  /** Committed allowlist entries (validated, normalized). */
  entries: string[];
  /** Current text in the input, owned by the parent so it can be flushed on submit. */
  draft: string;
  onDraftChange: (value: string) => void;
  /** Commits the current draft as a new entry. */
  onAdd: () => void;
  onRemove: (entry: string) => void;
  /** Validation message for the most recent add attempt. */
  error?: string | null;
  disabled?: boolean;
}

/**
 * Editor for the IP allowlist of a secret API key. Accepts IPv4/IPv6 addresses
 * and CIDR ranges; entries are validated before they can be added.
 */
export default function IpAllowlistEditor({
  entries,
  draft,
  onDraftChange,
  onAdd,
  onRemove,
  error,
  disabled = false,
}: IpAllowlistEditorProps) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 space-y-2.5 dark:border-zinc-800 dark:bg-zinc-900/40">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            IP Allowlist (optional)
          </span>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
            Restrict this key to specific IP addresses or CIDR ranges.
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            entries.length === 0
              ? 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300'
              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300'
          }`}
        >
          {entries.length === 0 ? 'Unrestricted' : `${entries.length} rule${entries.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {entries.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {entries.map((entry) => {
            const validation = validateIpAllowlistEntry(entry);

            return (
              <li
                key={entry}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] ${
                  validation.valid
                    ? 'border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300'
                }`}
                title={validation.valid ? entry : validation.error}
              >
                <span>{entry}</span>
                <button
                  type="button"
                  onClick={() => onRemove(entry)}
                  disabled={disabled}
                  aria-label={`Remove ${entry}`}
                  className="rounded p-0.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 disabled:cursor-not-allowed dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              // Keep Enter from submitting the surrounding form.
              e.preventDefault();
              onAdd();
            }
          }}
          disabled={disabled}
          aria-invalid={!!error}
          aria-label="IP address or CIDR range"
          placeholder="e.g. 203.0.113.0/24 or 2001:db8::1"
          className={`w-full rounded-xl border bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 focus:outline-none dark:bg-zinc-800 dark:text-white ${
            error
              ? 'border-red-300 focus:border-red-500 dark:border-red-900'
              : 'border-zinc-200 focus:border-sky-500 dark:border-zinc-700'
          }`}
        />
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled || !draft.trim()}
          className="shrink-0 rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
        >
          Add
        </button>
      </div>

      {error && (
        <p role="alert" className="text-[11px] text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <p className="text-[10px] text-zinc-400 dark:text-zinc-500">
        Supports IPv4 (198.51.100.7), IPv4 CIDR (198.51.100.0/24), IPv6 (2001:db8::1) and IPv6 CIDR
        (2001:db8::/32). Leave empty to allow requests from any IP.
      </p>
    </div>
  );
}
