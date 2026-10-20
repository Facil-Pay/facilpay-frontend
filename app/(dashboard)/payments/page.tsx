'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Payment, PaymentStatus, AssetType } from '@/lib/types';

const ExportModal = dynamic(() => import('@/components/ExportModal'), { ssr: false });
const PaymentDetailModal = dynamic(() => import('@/components/PaymentDetailModal'), { ssr: false });
import {
  getPaymentFixtures,
  PAYMENT_EXPORT_COLUMNS,
  generateLargePayments,
} from '@/lib/mocks/fixtures';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(getPaymentFixtures());
  const [isLargeDataSimulated, setIsLargeDataSimulated] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-31');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [bulkAction, setBulkAction] = useState<'export' | 'resend' | null>(null);

  // Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Toggle large dataset simulation (>1,000 rows)
  const toggleLargeData = () => {
    if (isLargeDataSimulated) {
      setPayments(getPaymentFixtures());
      setIsLargeDataSimulated(false);
    } else {
      const largeList = generateLargePayments(2500);
      setPayments(largeList);
      setIsLargeDataSimulated(true);
      // Expand date range to cover the generated range
      setStartDate('2026-01-01');
      setEndDate('2026-03-31');
    }
  };

  // Filtered Payments Calculation (Strictly respects all active filters and date range)
  const filteredPayments = useMemo(() => {
    return payments.filter((item) => {
      // 1. Search Query (ID, Customer email, Customer wallet, TxHash, Memo)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesQuery =
          item.id.toLowerCase().includes(query) ||
          item.customerEmail.toLowerCase().includes(query) ||
          item.customerWallet.toLowerCase().includes(query) ||
          item.txHash.toLowerCase().includes(query) ||
          item.memo.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // 2. Status Filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      // 3. Asset Filter
      if (assetFilter !== 'ALL' && item.asset !== assetFilter) {
        return false;
      }

      // 4. Date Range Filter
      if (startDate) {
        const itemDate = item.date.slice(0, 10);
        if (itemDate < startDate) return false;
      }
      if (endDate) {
        const itemDate = item.date.slice(0, 10);
        if (itemDate > endDate) return false;
      }

      return true;
    });
  }, [payments, searchTerm, statusFilter, assetFilter, startDate, endDate]);

  const filterSummary = useMemo(() => {
    const parts = [];
    if (statusFilter !== 'ALL') parts.push(`Status: ${statusFilter}`);
    if (assetFilter !== 'ALL') parts.push(`Asset: ${assetFilter}`);
    if (startDate && endDate) parts.push(`${startDate} to ${endDate}`);
    return parts.length > 0 ? parts.join(' • ') : 'All Dates & Assets';
  }, [statusFilter, assetFilter, startDate, endDate]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setAssetFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  // Bulk selection handlers
  const handleSelectPayment = (paymentId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(paymentId)) {
      newSelected.delete(paymentId);
    } else {
      newSelected.add(paymentId);
    }
    setSelectedIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredPayments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPayments.map((p) => p.id)));
    }
  };

  const selectedPayments = useMemo(() => {
    return filteredPayments.filter((p) => selectedIds.has(p.id));
  }, [filteredPayments, selectedIds]);

  const totalSelectedAmount = useMemo(() => {
    return selectedPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  }, [selectedPayments]);

  const handleBulkExport = () => {
    if (selectedIds.size === 0) return;
    setBulkAction('export');
    setShowBulkConfirm(true);
  };

  const handleBulkResend = () => {
    if (selectedIds.size === 0) return;
    setBulkAction('resend');
    setShowBulkConfirm(true);
  };

  const confirmBulkAction = () => {
    if (bulkAction === 'export') {
      setIsExportModalOpen(true);
      setShowBulkConfirm(false);
    } else if (bulkAction === 'resend') {
      alert(`Resending receipts for ${selectedIds.size} payment(s)...`);
      setSelectedIds(new Set());
      setShowBulkConfirm(false);
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Payments
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Monitor incoming transactions, export reports, and download payment receipts.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedIds.size > 0 && (
              <>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 font-medium">
                  {selectedIds.size} selected • ${totalSelectedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </div>

                <button
                  type="button"
                  onClick={handleBulkExport}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Bulk Export
                </button>

                <button
                  type="button"
                  onClick={handleBulkResend}
                  className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-3.5 py-2.5 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Resend Receipts
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  Clear Selection
                </button>
              </>
            )}

            {selectedIds.size === 0 && (
              <>
                {/* Simulation button for Large Export (>1,000 rows) */}
                <button
                  type="button"
                  onClick={toggleLargeData}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-medium transition-colors ${
                    isLargeDataSimulated
                      ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:border-amber-700 dark:text-amber-200'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300'
                  }`}
                  title="Toggle a 2,500-row dataset to test large export progress tracking"
                >
                  {isLargeDataSimulated
                    ? '⚡ Large Dataset Active (2,500 rows)'
                    : 'Simulate >1,000 Rows'}
                </button>

                {/* Export CSV Button */}
                <button
                  type="button"
                  id="export-payments-btn"
                  onClick={() => setIsExportModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black dark:hover:bg-[#A5D4FF]"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Export CSV</span>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-mono dark:bg-black/20">
                    {filteredPayments.length.toLocaleString()}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Search Transactions
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ID, customer, hash, or memo..."
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="COMPLETED">Completed</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
                <option value="REFUNDED">Refunded</option>
              </select>
            </div>

            {/* Asset Filter */}
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Asset
              </label>
              <select
                value={assetFilter}
                onChange={(e) => setAssetFilter(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="ALL">All Assets</option>
                <option value="USDC">USDC</option>
                <option value="XLM">XLM</option>
                <option value="EURC">EURC</option>
              </select>
            </div>

            {/* Date Range Start & End */}
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-2.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-2.5 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Active Filter Pills Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <span>
                Showing{' '}
                <strong className="text-zinc-900 dark:text-white">
                  {filteredPayments.length.toLocaleString()}
                </strong>{' '}
                of {payments.length.toLocaleString()} transactions
              </span>
              {(searchTerm ||
                statusFilter !== 'ALL' ||
                assetFilter !== 'ALL' ||
                startDate !== '2026-01-01' ||
                endDate !== '2026-01-31') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="ml-2 text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                >
                  Clear all filters
                </button>
              )}
            </div>

            <div className="text-[11px] text-zinc-400">
              CSV export will reflect these exact{' '}
              {filteredPayments.length.toLocaleString()} filtered records
            </div>
          </div>
        </div>

        {/* Payments Data Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 uppercase tracking-wider text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-5 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredPayments.length && filteredPayments.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500 dark:border-zinc-600"
                      title="Select all visible payments"
                    />
                  </th>
                  <th className="px-5 py-3.5">Payment ID</th>
                  <th className="px-5 py-3.5">Date (UTC)</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Stellar Tx</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <svg
                          className="h-8 w-8 text-zinc-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-sm font-medium">
                          No transactions found matching your filters.
                        </p>
                        <button
                          onClick={handleResetFilters}
                          className="text-xs text-sky-600 hover:underline"
                        >
                          Reset filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.slice(0, 50).map((payment) => (
                    <tr
                      key={payment.id}
                      onClick={() => setSelectedPayment(payment)}
                      className={`cursor-pointer transition-colors ${
                        selectedIds.has(payment.id)
                          ? 'bg-sky-50 dark:bg-sky-950/20 hover:bg-sky-100 dark:hover:bg-sky-950/30'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
                      }`}
                    >
                      <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(payment.id)}
                          onChange={() => handleSelectPayment(payment.id)}
                          className="rounded border-zinc-300 text-sky-600 focus:ring-sky-500 dark:border-zinc-600"
                        />
                      </td>
                      <td className="px-5 py-4 font-mono font-semibold text-zinc-900 dark:text-white">
                        {payment.id}
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                        {payment.date.slice(0, 10)}{' '}
                        <span className="text-[10px] text-zinc-400">
                          {payment.date.slice(11, 16)} UTC
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-medium text-zinc-900 dark:text-zinc-100">
                          {payment.customerEmail}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-400 truncate max-w-[120px]">
                          {payment.customerWallet}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">
                        {payment.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{' '}
                        <span className="font-normal text-zinc-500">
                          {payment.asset}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                            payment.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : payment.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                          }`}
                        >
                          {payment.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={payment.stellarExpertUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="font-mono text-[11px] text-sky-600 hover:underline dark:text-sky-400"
                          title="View on Stellar Expert"
                        >
                          {payment.txHash.slice(0, 8)}...{payment.txHash.slice(-6)}
                        </a>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPayment(payment);
                          }}
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                        >
                          Details & Receipt
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {filteredPayments.length > 50 && (
            <div className="border-t border-zinc-200 bg-zinc-50/50 px-5 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/40">
              Showing first 50 rows of {filteredPayments.length.toLocaleString()}{' '}
              matching records. Clicking <strong>Export CSV</strong> will export all{' '}
              {filteredPayments.length.toLocaleString()} records!
            </div>
          )}
        </div>
      </div>

      {/* Bulk Action Confirmation Dialog */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl dark:bg-zinc-900 max-w-md mx-4">
            <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {bulkAction === 'export' ? 'Bulk Export Payments' : 'Resend Receipt Emails'}
              </h2>
            </div>

            <div className="px-6 py-4 space-y-3">
              <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950/40">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  {bulkAction === 'export'
                    ? `Ready to export ${selectedIds.size} payment(s) with a total of $${totalSelectedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`
                    : `Ready to resend receipts for ${selectedIds.size} payment(s) with a total of $${totalSelectedAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`}
                </p>
              </div>

              {bulkAction === 'resend' && (
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Receipts will be sent to the customer email addresses on file. Verify they are current before proceeding.
                </div>
              )}

              <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
                <div className="text-xs font-semibold text-zinc-500 mb-2">Selected Payments:</div>
                <div className="bg-zinc-50 rounded-lg p-2.5 max-h-32 overflow-y-auto dark:bg-zinc-800">
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400 space-y-1">
                    {selectedPayments.slice(0, 5).map((p) => (
                      <div key={p.id} className="flex justify-between">
                        <span>{p.id}</span>
                        <span className="font-mono">${(p.amount || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    ))}
                    {selectedPayments.length > 5 && (
                      <div className="text-zinc-500 italic">
                        +{selectedPayments.length - 5} more...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-zinc-200 px-6 py-4 dark:border-zinc-800">
              <button
                onClick={() => setShowBulkConfirm(false)}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmBulkAction}
                className={`flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white ${
                  bulkAction === 'export'
                    ? 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700'
                    : 'bg-sky-600 hover:bg-sky-700 dark:bg-sky-700'
                }`}
              >
                {bulkAction === 'export' ? 'Export Now' : 'Resend Receipts'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV Column Picker & Export Modal (for bulk selected) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="payments"
        title={selectedIds.size > 0 ? `Bulk Export (${selectedIds.size} selected)` : 'Payments'}
        data={selectedIds.size > 0 ? selectedPayments : filteredPayments}
        columns={PAYMENT_EXPORT_COLUMNS}
        filterStartDate={startDate}
        filterEndDate={endDate}
        filterSummary={filterSummary}
      />

      {/* Payment Detail Modal with "Download Receipt" Button */}
      <PaymentDetailModal
        payment={selectedPayment}
        isOpen={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </>
  );
}
