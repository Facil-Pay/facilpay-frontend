'use client';

import React, { useState, useMemo } from 'react';
import ExportModal from '@/components/ExportModal';
import PaymentDetailModal from '@/components/PaymentDetailModal';
import { Payment, PaymentStatus, AssetType } from '@/lib/types';
import {
  INITIAL_PAYMENTS,
  PAYMENT_EXPORT_COLUMNS,
  generateLargePayments,
} from '@/lib/mockData';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS);
  const [isLargeDataSimulated, setIsLargeDataSimulated] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-01-31');

  // Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Toggle large dataset simulation (>1,000 rows)
  const toggleLargeData = () => {
    if (isLargeDataSimulated) {
      setPayments(INITIAL_PAYMENTS);
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
                      className="cursor-pointer transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    >
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

      {/* CSV Column Picker & Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="payments"
        title="Payments"
        data={filteredPayments}
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
