'use client';

import React, { use, useState, useMemo } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { getPaymentFixtures } from '@/lib/mocks/fixtures';

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const resolvedParams = params && typeof (params as any).then === 'function' ? use(params) : (params as any);
  const customerId = resolvedParams?.id ? decodeURIComponent(resolvedParams.id) : '';

  const payments = getPaymentFixtures();
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Find customer payments
  const customerPayments = useMemo(() => {
    return payments.filter(
      (p: any) => p.customerEmail === customerId || p.customerWallet === customerId
    );
  }, [payments, customerId]);

  if (customerPayments.length === 0) {
    notFound();
  }

  const totalPaid = customerPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const paymentCount = customerPayments.length;
  const firstPaymentAt = customerPayments[customerPayments.length - 1]?.date;
  const lastPaymentAt = customerPayments[0]?.date;
  const assets = [...new Set(customerPayments.map((p: any) => p.asset))];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/customers" className="hover:text-zinc-700 dark:hover:text-zinc-300">
            Customers
          </Link>
          <span>/</span>
          <span className="text-zinc-900 dark:text-white truncate">{customerId}</span>
        </div>

        {/* Header */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-100 dark:border-zinc-800">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
                {customerId.includes('@') ? customerId.split('@')[0] : 'Customer'}
              </h1>
              <p className="text-xs text-zinc-500 mt-1 font-mono break-all">{customerId}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                {paymentCount} Payments
              </span>
              <span className="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 dark:bg-sky-950/50 dark:text-sky-300">
                ${totalPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Lifetime Value</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                ${totalPaid.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Total Payments</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-white mt-1">{paymentCount}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">First Payment</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {new Date(firstPaymentAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase text-zinc-500">Last Payment</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                {new Date(lastPaymentAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Assets Used */}
          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <p className="text-xs font-semibold uppercase text-zinc-500 mb-3">Assets Used</p>
            <div className="flex flex-wrap gap-2">
              {assets.map((asset) => (
                <span
                  key={asset}
                  className="inline-flex items-center rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {asset}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Notes & Tags */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white mb-4">Notes & Tags</h2>

          {/* Notes Field */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-2">
              Internal Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this customer..."
              className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white resize-none"
              rows={4}
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-2">
              Tags
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag and press Enter..."
                className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
              <button
                onClick={handleAddTag}
                className="rounded-xl bg-sky-50 px-3.5 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950 dark:text-sky-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700 dark:bg-sky-950/40 dark:text-sky-300"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-sky-700 hover:text-sky-900 dark:text-sky-300"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="border-b border-zinc-200 bg-zinc-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Payment History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/40 uppercase tracking-wider text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/50">
                <tr>
                  <th className="px-6 py-3">ID</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Asset</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {customerPayments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-6 py-3 font-mono text-[11px] text-zinc-500">
                      {payment.id}
                    </td>
                    <td className="px-6 py-3 text-zinc-600 dark:text-zinc-400">
                      {new Date(payment.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-3 font-semibold text-zinc-900 dark:text-white">
                      ${payment.amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-3">{payment.asset}</td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                          payment.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : payment.status === 'PENDING'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                            : payment.status === 'REFUNDED'
                            ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                            : 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-300'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-right text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
                      {payment.description || payment.memo || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Refunds Section */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="border-b border-zinc-200 bg-zinc-50/80 px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white">Refunds</h2>
          </div>
          <div className="px-6 py-12 text-center text-zinc-500">
            No refunds recorded for this customer.
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
