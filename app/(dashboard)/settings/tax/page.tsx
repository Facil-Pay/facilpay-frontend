"use client";

import { useState, type FormEvent } from "react";
import { taxRatesStore, useTaxRates } from "@/lib/tax-store";
import { calculateTax, formatTaxLabel, validateTaxRate, type TaxRate } from "@/lib/tax";
import { useFormat } from "@/lib/i18n/use-format";

const EMPTY_DRAFT = { name: "", percentage: "", inclusive: false };

export default function TaxSettingsPage() {
  const f = useFormat();
  const rates = useTaxRates();
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const addRate = (e: FormEvent) => {
    e.preventDefault();
    const percentage = Number(draft.percentage);
    const validation = draft.percentage === "" ? "Percentage is required" : validateTaxRate({ name: draft.name, percentage });
    if (validation) {
      setError(validation);
      setStatus(null);
      return;
    }

    const rate: TaxRate = {
      id: `tax_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      name: draft.name.trim(),
      percentage,
      inclusive: draft.inclusive,
    };
    taxRatesStore.set((prev) => [...prev, rate]);
    setDraft(EMPTY_DRAFT);
    setError(null);
    setStatus(`${formatTaxLabel(rate)} added.`);
  };

  const toggleInclusive = (id: string) =>
    taxRatesStore.set((prev) => prev.map((r) => (r.id === id ? { ...r, inclusive: !r.inclusive } : r)));

  const removeRate = (id: string) => {
    taxRatesStore.set((prev) => prev.filter((r) => r.id !== id));
    setStatus("Tax rate removed.");
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">Tax rates</h3>
          <p className="mt-1 text-sm text-zinc-500">
            Apply a rate when creating payment links. Inclusive rates are already part of the price; exclusive rates are added on top. Links created without a tax rate are not affected.
          </p>
        </div>

        {rates.length === 0 ? (
          <p className="rounded-md border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">No tax rates yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-zinc-500">
              <tr>
                <th className="pb-2">Name</th>
                <th className="pb-2">Rate</th>
                <th className="pb-2">Pricing</th>
                <th className="pb-2">Example (100.00 USDC)</th>
                <th className="pb-2 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const example = calculateTax(100, rate, "USDC");
                return (
                  <tr key={rate.id} className="border-t border-zinc-100">
                    <td className="py-2.5 font-medium text-zinc-900">{rate.name}</td>
                    <td className="py-2.5">{f.number(rate.percentage)}%</td>
                    <td className="py-2.5">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={rate.inclusive}
                          onChange={() => toggleInclusive(rate.id)}
                          aria-label={`${rate.name} tax-inclusive pricing`}
                          className="h-4 w-4 accent-[#20a7ee]"
                        />
                        <span>{rate.inclusive ? "Inclusive" : "Exclusive"}</span>
                      </label>
                    </td>
                    <td className="py-2.5 text-zinc-600">
                      {f.amount(example.subtotal, "USDC")} + {f.amount(example.taxAmount, "USDC")} tax = {f.amount(example.total, "USDC")}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => removeRate(rate.id)}
                        className="rounded-md px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <form onSubmit={addRate} className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
        <h3 className="text-base font-semibold text-zinc-900">Add a tax rate</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Name</span>
            <input
              type="text"
              placeholder="e.g. VAT"
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-zinc-700">Percentage (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              placeholder="20"
              value={draft.percentage}
              onChange={(e) => setDraft((d) => ({ ...d, percentage: e.target.value }))}
              className="rounded-md border border-zinc-300 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm">
            <input
              type="checkbox"
              checked={draft.inclusive}
              onChange={(e) => setDraft((d) => ({ ...d, inclusive: e.target.checked }))}
              className="h-4 w-4 accent-[#20a7ee]"
            />
            <span className="font-medium text-zinc-700">Prices include tax</span>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button type="submit" className="rounded-md bg-[#000F24] px-4 py-2 text-sm font-medium text-white">Add tax rate</button>
          {error && <span role="alert" className="text-sm text-rose-600">{error}</span>}
          {status && !error && <span role="status" className="text-sm text-emerald-600">{status}</span>}
        </div>
      </form>
    </div>
  );
}
