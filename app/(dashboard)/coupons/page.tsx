'use client';

import React, { useState } from 'react';
import { Plus, Tag, Archive, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  currency?: string;
  expiresAt: string | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  status: 'active' | 'archived';
  createdAt: string;
}

type FormErrors = Record<string, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'coup_01',
    code: 'LAUNCH20',
    type: 'percentage',
    value: 20,
    expiresAt: '2026-12-31T23:59:59Z',
    maxRedemptions: 100,
    redemptionCount: 14,
    status: 'active',
    createdAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'coup_02',
    code: 'SAVE5',
    type: 'fixed',
    value: 5,
    currency: 'USDC',
    expiresAt: null,
    maxRedemptions: null,
    redemptionCount: 42,
    status: 'active',
    createdAt: '2026-10-15T00:00:00Z',
  },
  {
    id: 'coup_03',
    code: 'OLDPROMO',
    type: 'percentage',
    value: 15,
    expiresAt: '2026-10-01T00:00:00Z',
    maxRedemptions: 50,
    redemptionCount: 50,
    status: 'archived',
    createdAt: '2026-09-01T00:00:00Z',
  },
];

function couponStatusInfo(coupon: Coupon): { label: string; color: string } {
  if (coupon.status === 'archived') return { label: 'Archived', color: 'text-zinc-500 bg-zinc-100' };
  if (coupon.expiresAt && new Date(coupon.expiresAt).getTime() <= Date.now())
    return { label: 'Expired', color: 'text-amber-700 bg-amber-50' };
  if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions)
    return { label: 'Exhausted', color: 'text-rose-700 bg-rose-50' };
  return { label: 'Active', color: 'text-emerald-700 bg-emerald-50' };
}

function formatDiscount(c: Coupon): string {
  return c.type === 'percentage' ? `${c.value}% off` : `${c.value} ${c.currency ?? 'USDC'} off`;
}

// ─── Create Coupon Form ───────────────────────────────────────────────────────

interface CreateCouponFormProps {
  onCreated: (c: Coupon) => void;
  onCancel: () => void;
  existingCodes: string[];
}

function CreateCouponForm({ onCreated, onCancel, existingCodes }: CreateCouponFormProps) {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('USDC');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!code.trim()) errs.code = 'Coupon code is required';
    else if (existingCodes.includes(code.trim().toUpperCase())) errs.code = 'This code already exists';
    const numVal = parseFloat(value);
    if (!value || isNaN(numVal) || numVal <= 0) errs.value = 'Enter a positive discount value';
    if (type === 'percentage' && numVal > 100) errs.value = 'Percentage cannot exceed 100';
    if (expiresAt) {
      const d = new Date(expiresAt);
      if (isNaN(d.getTime())) errs.expiresAt = 'Enter a valid date';
      else if (d.getTime() <= Date.now()) errs.expiresAt = 'Expiry must be in the future';
    }
    if (maxRedemptions) {
      const n = parseInt(maxRedemptions, 10);
      if (isNaN(n) || n < 1) errs.maxRedemptions = 'Must be a positive whole number';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const newCoupon: Coupon = {
      id: `coup_${Date.now().toString(36)}`,
      code: code.trim().toUpperCase(),
      type,
      value: parseFloat(value),
      currency: type === 'fixed' ? currency : undefined,
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      maxRedemptions: maxRedemptions ? parseInt(maxRedemptions, 10) : null,
      redemptionCount: 0,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    onCreated(newCoupon);
  };

  const inputClass = (field: string) =>
    `w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all focus:outline-none dark:bg-zinc-900 dark:text-white ${
      errors[field]
        ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
        : 'border-zinc-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:border-zinc-700'
    }`;

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 space-y-5"
    >
      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">New Coupon</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Code */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Code <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. SUMMER10"
            value={code}
            onChange={(e) => { setCode(e.target.value.toUpperCase()); if (errors.code) setErrors((p) => ({ ...p, code: '' })); }}
            className={inputClass('code')}
          />
          {errors.code && <p className="mt-1 text-xs text-rose-500">{errors.code}</p>}
        </div>

        {/* Type */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Discount Type <span className="text-rose-500">*</span>
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as 'percentage' | 'fixed')}
            className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
          >
            <option value="percentage">Percentage (%)</option>
            <option value="fixed">Fixed amount</option>
          </select>
        </div>

        {/* Value */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            {type === 'percentage' ? 'Percentage Off (%)' : 'Amount Off'} <span className="text-rose-500">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder={type === 'percentage' ? '10' : '5.00'}
            value={value}
            onChange={(e) => { setValue(e.target.value); if (errors.value) setErrors((p) => ({ ...p, value: '' })); }}
            className={inputClass('value')}
          />
          {errors.value && <p className="mt-1 text-xs text-rose-500">{errors.value}</p>}
        </div>

        {/* Currency (fixed only) */}
        {type === 'fixed' && (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2.5 text-sm focus:border-sky-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            >
              <option value="USDC">USDC</option>
              <option value="EURC">EURC</option>
              <option value="XLM">XLM</option>
            </select>
          </div>
        )}

        {/* Expiry */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Expiry (Optional)
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => { setExpiresAt(e.target.value); if (errors.expiresAt) setErrors((p) => ({ ...p, expiresAt: '' })); }}
            className={inputClass('expiresAt')}
          />
          {errors.expiresAt && <p className="mt-1 text-xs text-rose-500">{errors.expiresAt}</p>}
        </div>

        {/* Max redemptions */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
            Redemption Cap (Optional)
          </label>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="Unlimited"
            value={maxRedemptions}
            onChange={(e) => { setMaxRedemptions(e.target.value); if (errors.maxRedemptions) setErrors((p) => ({ ...p, maxRedemptions: '' })); }}
            className={inputClass('maxRedemptions')}
          />
          {errors.maxRedemptions && <p className="mt-1 text-xs text-rose-500">{errors.maxRedemptions}</p>}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95"
        >
          Create Coupon
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');

  const handleCreated = (c: Coupon) => {
    setCoupons((prev) => [c, ...prev]);
    setShowCreate(false);
  };

  const handleArchive = (id: string) => {
    setCoupons((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: 'archived' as const } : c))
    );
  };

  const visible = filter === 'all' ? coupons : coupons.filter((c) => c.status === filter);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">Coupons</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Create discount codes that customers can apply at checkout.
          </p>
        </div>
        {!showCreate && (
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            New Coupon
          </button>
        )}
      </div>

      {/* Create form */}
      {showCreate && (
        <CreateCouponForm
          onCreated={handleCreated}
          onCancel={() => setShowCreate(false)}
          existingCodes={coupons.map((c) => c.code)}
        />
      )}

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'active', 'archived'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
              filter === f
                ? 'border-sky-300 bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300'
                : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-zinc-400">
            <Tag className="h-8 w-8" />
            <p className="text-sm">No coupons found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
              <tr>
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3 hidden sm:table-cell">Redemptions</th>
                <th className="px-5 py-3 hidden md:table-cell">Expiry</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {visible.map((c) => {
                const { label, color } = couponStatusInfo(c);
                return (
                  <tr key={c.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <code className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-mono font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                        {c.code}
                      </code>
                    </td>
                    <td className="px-5 py-4 font-medium text-zinc-900 dark:text-white">
                      {formatDiscount(c)}
                    </td>
                    <td className="px-5 py-4 hidden sm:table-cell text-zinc-500">
                      {c.redemptionCount}
                      {c.maxRedemptions !== null && (
                        <span className="text-zinc-400"> / {c.maxRedemptions}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell text-zinc-500">
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
                        {label === 'Active' && <CheckCircle2 className="h-3 w-3" />}
                        {label === 'Archived' && <Archive className="h-3 w-3" />}
                        {label === 'Expired' && <AlertCircle className="h-3 w-3" />}
                        {label === 'Exhausted' && <XCircle className="h-3 w-3" />}
                        {label}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {c.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => handleArchive(c.id)}
                          className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 underline"
                        >
                          Archive
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
