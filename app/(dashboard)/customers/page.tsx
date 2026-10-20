'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { getPaymentFixtures } from '@/lib/mocks/fixtures';

interface Customer {
  identifier: string;
  email?: string;
  name?: string;
  paymentCount: number;
  totalAmount: number;
  lastPaymentAt: string;
}

export default function CustomersPage() {
  const payments = getPaymentFixtures();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'amount' | 'count' | 'recent'>('amount');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Aggregate customers from payments
  const customers = useMemo(() => {
    const customerMap = new Map<string, Customer>();

    payments.forEach((payment: any) => {
      const identifier = payment.customerEmail || payment.customerWallet;
      if (!identifier) return;

      if (!customerMap.has(identifier)) {
        customerMap.set(identifier, {
          identifier,
          email: payment.customerEmail,
          name: payment.customerEmail?.split('@')[0] || 'Unknown',
          paymentCount: 0,
          totalAmount: 0,
          lastPaymentAt: payment.date,
        });
      }

      const customer = customerMap.get(identifier)!;
      customer.paymentCount += 1;
      customer.totalAmount += payment.amount || 0;
      if (new Date(payment.date) > new Date(customer.lastPaymentAt)) {
        customer.lastPaymentAt = payment.date;
      }
    });

    return Array.from(customerMap.values());
  }, [payments]);

  // Filter customers
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      if (!searchTerm.trim()) return true;
      const query = searchTerm.toLowerCase();
      return (
        customer.identifier.toLowerCase().includes(query) ||
        (customer.email && customer.email.toLowerCase().includes(query)) ||
        (customer.name && customer.name.toLowerCase().includes(query))
      );
    });
  }, [customers, searchTerm]);

  // Sort customers
  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers];
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'amount':
        return sorted.sort((a, b) => b.totalAmount - a.totalAmount);
      case 'count':
        return sorted.sort((a, b) => b.paymentCount - a.paymentCount);
      case 'recent':
        return sorted.sort((a, b) =>
          new Date(b.lastPaymentAt).getTime() - new Date(a.lastPaymentAt).getTime()
        );
      default:
        return sorted;
    }
  }, [filteredCustomers, sortBy]);

  // Paginate
  const totalPages = Math.ceil(sortedCustomers.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const paginatedCustomers = sortedCustomers.slice(start, start + pageSize);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSortBy('amount');
    setCurrentPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              Customers
            </h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              View and manage customer payment history and profiles.
            </p>
          </div>
        </div>

        {/* Filters Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Search Customers
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Name, email, or wallet address..."
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3.5 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1.5">
                Sort By
              </label>
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value as any);
                  setCurrentPage(1);
                }}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-900 focus:border-sky-500 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
              >
                <option value="amount">Total Amount (High to Low)</option>
                <option value="count">Payment Count</option>
                <option value="recent">Most Recent</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            <div className="flex items-end">
              {(searchTerm || sortBy !== 'amount') && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full px-3 py-2 text-xs font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-950/60 rounded-xl transition-colors"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <span>
              Showing <strong className="text-zinc-900 dark:text-white">{paginatedCustomers.length}</strong> of{' '}
              <strong className="text-zinc-900 dark:text-white">{sortedCustomers.length}</strong> customers
            </span>
          </div>
        </div>

        {/* Customers Table */}
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-zinc-200 bg-zinc-50/80 uppercase tracking-wider text-[11px] font-semibold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                <tr>
                  <th className="px-5 py-3.5">Name / Email</th>
                  <th className="px-5 py-3.5">Address / Identifier</th>
                  <th className="px-5 py-3.5">Total Paid</th>
                  <th className="px-5 py-3.5">Payments</th>
                  <th className="px-5 py-3.5">Last Payment</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
                {paginatedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                      No customers found matching your search.
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <tr
                      key={customer.identifier}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-zinc-900 dark:text-white">
                          {customer.name || 'Unknown'}
                        </div>
                        {customer.email && (
                          <div className="text-[11px] text-zinc-500">{customer.email}</div>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-mono text-[11px] text-zinc-500 truncate max-w-[200px]">
                          {customer.identifier.substring(0, 24)}
                          {customer.identifier.length > 24 ? '...' : ''}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-zinc-900 dark:text-white">
                        ${customer.totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                        {customer.paymentCount}
                      </td>
                      <td className="px-5 py-4 text-zinc-600 dark:text-zinc-400">
                        {new Date(customer.lastPaymentAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/customers/${encodeURIComponent(customer.identifier)}`}
                          className="inline-flex items-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-300"
                        >
                          View
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Previous
            </button>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
