"use client";

import { useState } from "react";
import {
  useBlocklist,
  useRiskRules,
  addToBlocklist,
  removeFromBlocklist,
  updateRiskRules,
  validateStellarAddress,
} from "@/lib/risk";
import { StrKey } from "@/lib/stellar/strkey";
import { Can } from "@/components/auth/Can";

// ─── Blocklist editor ─────────────────────────────────────────────────────────

function BlocklistEditor() {
  const entries = useBlocklist();
  const [input, setInput] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");

  const handleAdd = () => {
    setError("");
    const result = addToBlocklist(input, note || undefined);
    if (result) {
      setError(result);
    } else {
      setInput("");
      setNote("");
      setFlash("Address added.");
      setTimeout(() => setFlash(""), 2000);
    }
  };

  const handleRemove = (address: string) => {
    removeFromBlocklist(address);
  };

  // Live inline validation
  const liveValidation = input
    ? validateStellarAddress(input)
    : { valid: true as const };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">Address blocklist</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Payments from blocklisted Stellar addresses are automatically flagged for review.
      </p>

      {/* Input */}
      <div className="mt-5 space-y-3">
        <div>
          <label htmlFor="blocklist-address" className="block text-xs font-semibold text-zinc-600 mb-1.5">
            Stellar address
          </label>
          <input
            id="blocklist-address"
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            placeholder="GABC…"
            className={`w-full rounded-xl border px-3.5 py-2 font-mono text-xs focus:outline-none ${
              input && !liveValidation.valid
                ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                : "border-zinc-200 bg-zinc-50/50 focus:border-sky-500 focus:bg-white"
            }`}
            aria-label="Stellar address to blocklist"
            aria-describedby={error ? "blocklist-error" : undefined}
          />
          {/* Inline validation error */}
          {input && !liveValidation.valid && (
            <p id="blocklist-inline-error" className="mt-1 text-xs text-rose-600" role="alert">
              {liveValidation.error}
            </p>
          )}
          {error && (
            <p id="blocklist-error" className="mt-1 text-xs text-rose-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="blocklist-note" className="block text-xs font-semibold text-zinc-600 mb-1.5">
            Note (optional)
          </label>
          <input
            id="blocklist-note"
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Known fraud address"
            className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs focus:border-sky-500 focus:bg-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!input || (input.length > 0 && !liveValidation.valid)}
            className="rounded-xl bg-[#000F24] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40 hover:bg-zinc-800"
          >
            Add to blocklist
          </button>
          {flash && <span className="text-xs text-emerald-600">{flash}</span>}
        </div>
      </div>

      {/* Current blocklist */}
      <div className="mt-6">
        <p className="text-xs font-semibold text-zinc-500 mb-2">
          {entries.length === 0 ? "No addresses on blocklist." : `${entries.length} blocked address${entries.length !== 1 ? "es" : ""}`}
        </p>
        {entries.length > 0 && (
          <ul className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {entries.map((entry) => (
              <li key={entry.address} className="flex items-center gap-3 px-4 py-3">
                <code className="flex-1 font-mono text-xs text-zinc-700 truncate" title={entry.address}>
                  {entry.address.slice(0, 10)}…{entry.address.slice(-8)}
                </code>
                {entry.note && (
                  <span className="text-xs text-zinc-400 truncate max-w-[180px]">{entry.note}</span>
                )}
                <span className="text-[10px] text-zinc-400">
                  {new Date(entry.addedAt).toLocaleDateString()}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(entry.address)}
                  className="ml-2 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-100"
                  aria-label={`Remove ${StrKey.truncateAddress(entry.address)} from blocklist`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

// ─── Risk rules ───────────────────────────────────────────────────────────────

function RiskRulesEditor() {
  const rules = useRiskRules();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Values already updated inline via updateRiskRules calls
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">Risk rules</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Configure automatic flagging thresholds. Flagged payments appear in the payments list with a
        reason badge and can be filtered separately.
      </p>

      <div className="mt-5 space-y-5">
        {/* Rule 1: flag above amount */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <input
              type="checkbox"
              id="rule-flag-amount"
              checked={rules.flagAboveAmountEnabled}
              onChange={(e) =>
                updateRiskRules({ flagAboveAmountEnabled: e.target.checked })
              }
              className="h-4 w-4 accent-[#20a7ee]"
            />
            <label htmlFor="rule-flag-amount" className="text-sm font-medium text-zinc-700">
              Flag payments above amount (USD)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={rules.flagAboveAmount}
              disabled={!rules.flagAboveAmountEnabled}
              onChange={(e) =>
                updateRiskRules({ flagAboveAmount: Math.max(0, Number(e.target.value)) })
              }
              className="w-28 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm tabular-nums disabled:opacity-40 focus:outline-none focus:border-sky-500"
              aria-label="Amount threshold in USD"
            />
          </div>
        </div>

        {/* Rule 2: flag first-time payer above amount */}
        <div className="flex flex-col gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 items-center gap-3">
            <input
              type="checkbox"
              id="rule-first-time"
              checked={rules.flagFirstTimePayerEnabled}
              onChange={(e) =>
                updateRiskRules({ flagFirstTimePayerEnabled: e.target.checked })
              }
              className="h-4 w-4 accent-[#20a7ee]"
            />
            <label htmlFor="rule-first-time" className="text-sm font-medium text-zinc-700">
              Flag first-time payer above amount (USD)
            </label>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">$</span>
            <input
              type="number"
              min={0}
              step={1}
              value={rules.flagFirstTimePayerAbove}
              disabled={!rules.flagFirstTimePayerEnabled}
              onChange={(e) =>
                updateRiskRules({ flagFirstTimePayerAbove: Math.max(0, Number(e.target.value)) })
              }
              className="w-28 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm tabular-nums disabled:opacity-40 focus:outline-none focus:border-sky-500"
              aria-label="First-time payer amount threshold in USD"
            />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="rounded-xl bg-[#000F24] px-4 py-2 text-xs font-semibold text-white hover:bg-zinc-800"
        >
          Save risk rules
        </button>
        {saved && <span className="text-xs text-emerald-600">Saved.</span>}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiskSettingsPage() {
  return (
    <Can
      permission="team:manage"
      fallback={
        <div className="rounded-xl border border-zinc-200 bg-white p-6 text-sm text-zinc-600">
          Risk settings are available to account owners and admins.
        </div>
      }
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Risk settings</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage the address blocklist and automatic payment flag thresholds.
          </p>
        </div>
        <BlocklistEditor />
        <RiskRulesEditor />
      </div>
    </Can>
  );
}
