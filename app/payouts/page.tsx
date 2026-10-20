'use client';

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import ExportModal from '@/components/ExportModal';
import NewPayoutModal from '@/components/payouts/NewPayoutModal';
import SavedDestinationsModal from '@/components/payouts/SavedDestinationsModal';
import Sep24TrackerModal from '@/components/payouts/Sep24TrackerModal';
import { Payout, AssetType, MerchantBalance, SavedDestination } from '@/lib/types';
import {
  PAYOUT_FIXTURES,
  PAYOUT_EXPORT_COLUMNS,
} from '@/lib/mocks/fixtures';

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>(PAYOUT_FIXTURES);
  const [balances, setBalances] = useState<Record<AssetType, MerchantBalance>>({
    USDC: { asset: 'USDC', available: 42850.0, escrowLocked: 5000.0, total: 47850.0 },
    XLM: { asset: 'XLM', available: 18400.0, escrowLocked: 2000.0, total: 20400.0 },
    EURC: { asset: 'EURC', available: 12200.0, escrowLocked: 1500.0, total: 13700.0 },
  });
  const [savedDestinations, setSavedDestinations] = useState<SavedDestination[]>([
    {
      id: 'dest_binance_treasury',
      label: 'Binance Treasury Deposit',
      address: 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG',
      memo: '109283741',
      memoType: 'id',
      isExchange: true,
      exchangeName: 'Binance',
      createdAt: '2026-01-10T08:00:00.000Z',
    },
    {
      id: 'dest_coinbase_ops',
      label: 'Coinbase Operational Reserve',
      address: 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV',
      memo: 'CB-948201',
      memoType: 'text',
      isExchange: true,
      exchangeName: 'Coinbase',
      createdAt: '2026-01-12T14:20:00.000Z',
    },
    {
      id: 'dest_internal_cold',
      label: 'FacilPay Multi-sig Cold Storage',
      address: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
      createdAt: '2026-01-05T10:00:00.000Z',
    },
    {
      id: 'dest_fed_treasury',
      label: 'FacilPay Treasury (Federation)',
      address: 'treasury*facilpay.io',
      resolvedAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
      createdAt: '2026-01-15T09:30:00.000Z',
    },
  ]);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('2026-01-01');
  const [endDate, setEndDate] = useState<string>('2026-02-28');

  // Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewPayoutOpen, setIsNewPayoutOpen] = useState(false);
  const [isSavedDestinationsOpen, setIsSavedDestinationsOpen] = useState(false);
  const [trackingPayout, setTrackingPayout] = useState<Payout | null>(null);

  // Filtered Payouts (strictly respects search, status, asset, and date range)
  const filteredPayouts = useMemo(() => {
    return payouts.filter((item) => {
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesQuery =
          item.id.toLowerCase().includes(query) ||
          item.payoutMethod.toLowerCase().includes(query) ||
          item.destinationWallet.toLowerCase().includes(query) ||
          (item.destinationLabel && item.destinationLabel.toLowerCase().includes(query)) ||
          (item.anchorName && item.anchorName.toLowerCase().includes(query)) ||
          (item.memo && item.memo.toLowerCase().includes(query)) ||
          item.txHash.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      if (assetFilter !== 'ALL' && item.asset !== assetFilter) {
        return false;
      }

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
  }, [payouts, searchTerm, statusFilter, assetFilter, startDate, endDate]);

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

  // Payout Completion Handler (updates balance and prepends new payout)
  const handleCompletePayout = (
    newPayout: Payout,
    deductedAmount: number,
    asset: AssetType
  ) => {
    setPayouts((prev) => [newPayout, ...prev]);

    // Deduct available balance
    setBalances((prev) => {
      const current = prev[asset];
      const newAvail = Math.max(0, current.available - deductedAmount);
      return {
        ...prev,
        [asset]: {
          ...current,
          available: newAvail,
          total: newAvail + current.escrowLocked,
        },
      };
    });
  };

  const handleAddSavedDestination = (dest: SavedDestination) => {
    setSavedDestinations((prev) => [dest, ...prev]);
  };

  const handleDeleteSavedDestination = (id: string) => {
    setSavedDestinations((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header with Title and Primary Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Payouts & Withdrawals
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Move merchant funds to an external Stellar address or off-ramp to your bank account via SEP-24 anchors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Saved Destinations Button */}
            <button
              type="button"
              onClick={() => setIsSavedDestinationsOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <span>Saved Destinations</span>
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.2 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {savedDestinations.length}
              </span>
            </button>

            {/* Export CSV Button */}
            <button
              type="button"
              id="export-payouts-btn"
              onClick={() => setIsExportModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <svg className="h-4 w-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Export CSV</span>
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.2 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                {filteredPayouts.length.toLocaleString()}
              </span>
            </button>

            {/* New Payout Primary Button */}
            <button
              type="button"
              id="new-payout-btn"
              onClick={() => setIsNewPayoutOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 dark:bg-[#55C2FF] dark:text-black dark:hover:bg-[#A5D4FF]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Payout</span>
            </button>
          </div>
        </div>

        {/* Merchant Balances Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['USDC', 'XLM', 'EURC'] as AssetType[]).map((asset) => {
            const bal = balances[asset];
            return (
              <div
                key={asset}
                className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    {asset} Available Balance
                  </span>
                  <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                    Stellar
                  </span>
                </div>

                <div className="mt-2 flex items-baseline justify-between">
                  <div className="text-2xl font-extrabold text-zinc-900 dark:text-white">
                    {bal.available.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-sm font-bold text-sky-600 dark:text-sky-400">
                      {asset}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsNewPayoutOpen(true);
                    }}
                    className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400"
                  >
                    Withdraw →
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-2 text-[11px] text-zinc-400 dark:border-zinc-800">
                  <span>Escrow Locked: {bal.escrowLocked.toLocaleString()} {asset}</span>
                  <span>Total: {bal.total.toLocaleString()} {asset}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Filters Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Search Payouts
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ID, destination wallet, anchor, memo, tx hash..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

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
                <option value="PROCESSING">Processing</option>
                <option value="PENDING">Pending</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
            <span>
              Showing{' '}
              <strong className="text-zinc-900 dark:text-white">
                {filteredPayouts.length}
              </strong>{' '}
              of {payouts.length} payouts
            </span>
            {(searchTerm ||
              statusFilter !== 'ALL' ||
              assetFilter !== 'ALL' ||
              startDate !== '2026-01-01' ||
              endDate !== '2026-02-28') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Payouts History Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 uppercase tracking-wider text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-5 py-3.5">Payout ID</th>
                  <th className="px-5 py-3.5">Date (UTC)</th>
                  <th className="px-5 py-3.5">Destination</th>
                  <th className="px-5 py-3.5">Method</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {filteredPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      No payouts found matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  filteredPayouts.map((payout) => (
                    <tr
                      key={payout.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-5 py-4 font-mono font-semibold text-zinc-900 dark:text-white">
                        {payout.id}
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                        {payout.date.slice(0, 10)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-white">
                          {payout.destinationLabel || 'External Wallet'}
                        </div>
                        <div className="font-mono text-[11px] text-zinc-500 truncate max-w-[180px]">
                          {payout.destinationWallet}
                        </div>
                        {payout.memo && (
                          <div className="text-[10px] text-zinc-400 font-mono">
                            Memo: {payout.memo}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          {payout.payoutMethod}
                        </span>
                        {payout.anchorName && (
                          <span className="block text-[10px] text-sky-600 dark:text-sky-400">
                            Regulated SEP-24 Anchor
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">
                        {payout.amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{' '}
                        <span className="font-normal text-zinc-500">
                          {payout.asset}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                            payout.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : payout.status === 'PROCESSING'
                              ? 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                          }`}
                        >
                          {payout.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        {payout.payoutMethod.includes('SEP-24') ? (
                          <button
                            type="button"
                            onClick={() => setTrackingPayout(payout)}
                            className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
                          >
                            Track Off-Ramp
                          </button>
                        ) : (
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${payout.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                          >
                            <span>Ledger</span>
                            <svg className="h-3 w-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Payout Modal (Stellar Address & SEP-24 Bank Off-Ramp) */}
      <NewPayoutModal
        isOpen={isNewPayoutOpen}
        onClose={() => setIsNewPayoutOpen(false)}
        balances={balances}
        savedDestinations={savedDestinations}
        onAddSavedDestination={handleAddSavedDestination}
        onCompletePayout={handleCompletePayout}
      />

      {/* Saved Destinations Manager Modal */}
      <SavedDestinationsModal
        isOpen={isSavedDestinationsOpen}
        onClose={() => setIsSavedDestinationsOpen(false)}
        destinations={savedDestinations}
        onAddDestination={handleAddSavedDestination}
        onDeleteDestination={handleDeleteSavedDestination}
        onSelectDestination={() => {
          setIsNewPayoutOpen(true);
        }}
      />

      {/* SEP-24 Transaction Status Tracker Modal */}
      <Sep24TrackerModal
        payout={trackingPayout}
        isOpen={!!trackingPayout}
        onClose={() => setTrackingPayout(null)}
      />

      {/* CSV Export Modal (Strictly preserved RFC 4180 / Filter-aware) */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        type="payouts"
        title="Payouts"
        data={filteredPayouts}
        columns={PAYOUT_EXPORT_COLUMNS}
        filterStartDate={startDate}
        filterEndDate={endDate}
        filterSummary={filterSummary}
      />
    </DashboardLayout>
  );
}
