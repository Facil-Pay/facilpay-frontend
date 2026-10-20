'use client';

import React, { useState, useMemo } from 'react';
import DevelopersNav from '@/components/developers/DevelopersNav';
import SendTestEventModal from '@/components/developers/SendTestEventModal';
import SyntaxHighlightedJson from '@/components/webhooks/SyntaxHighlightedJson';
import {
  WEBHOOK_CATALOG,
  SIGNATURE_VERIFICATION_SNIPPETS,
  WebhookEventCatalogItem,
} from '@/lib/webhook-catalog';
import { WebhookEventType } from '@/types/webhooks';
import {
  Search,
  Send,
  Code2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';

type LanguageTab = 'nodejs' | 'python' | 'go';

export default function WebhookEventCatalogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedEvents, setExpandedEvents] = useState<Record<string, boolean>>({
    'payment.created': true,
    'payment.completed': true,
  });
  const [activeLangTab, setActiveLangTab] = useState<LanguageTab>('nodejs');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null);

  // Test modal state
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testModalInitialEvent, setTestModalInitialEvent] = useState<WebhookEventType>('payment.completed');

  // Categories count
  const categories = useMemo(() => {
    return [
      { id: 'all', label: 'All Events', count: WEBHOOK_CATALOG.length },
      { id: 'payment', label: 'Payments', count: WEBHOOK_CATALOG.filter((e) => e.category === 'payment').length },
      { id: 'refund', label: 'Refunds', count: WEBHOOK_CATALOG.filter((e) => e.category === 'refund').length },
      { id: 'escrow', label: 'Smart Escrows', count: WEBHOOK_CATALOG.filter((e) => e.category === 'escrow').length },
      { id: 'payout', label: 'Payouts', count: WEBHOOK_CATALOG.filter((e) => e.category === 'payout').length },
      { id: 'account', label: 'Stellar & Accounts', count: WEBHOOK_CATALOG.filter((e) => e.category === 'account').length },
    ];
  }, []);

  // Filtered events
  const filteredEvents = useMemo(() => {
    return WEBHOOK_CATALOG.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesSearch =
        item.name.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.whenFires.toLowerCase().includes(q) ||
        item.fields.some((f) => f.field.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedEvents((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyEventId = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopiedEventId(id);
      setTimeout(() => setCopiedEventId(null), 1800);
    } catch {
      // ignore
    }
  };

  const handleCopySnippet = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch {
      // ignore
    }
  };

  const openTestModal = (eventType: WebhookEventType) => {
    setTestModalInitialEvent(eventType);
    setIsTestModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <DevelopersNav />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Webhook Event Catalog
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Reference guide and payload specifications for all events delivered to merchant webhook listeners.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#signatures"
            className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ShieldCheck className="h-4 w-4 text-[#0066FF] dark:text-[#55C2FF]" />
            <span>Signature Verification</span>
          </a>
          <button
            type="button"
            onClick={() => openTestModal('payment.completed')}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-blue-600 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Test Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events (e.g. payment.completed, hash, escrow)..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2 text-xs text-zinc-900 placeholder-zinc-400 focus:border-[#0066FF] focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder-zinc-500 shadow-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
              }`}
            >
              {cat.label} ({cat.count})
            </button>
          ))}
        </div>
      </div>

      {/* Events Listing */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-800">
            <Info className="h-8 w-8 text-zinc-400 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">No matching events</h3>
            <p className="text-xs text-zinc-500 mt-1">
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          filteredEvents.map((eventItem) => {
            const isExpanded = expandedEvents[eventItem.id] ?? false;

            return (
              <div
                key={eventItem.id}
                className="rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm dark:border-zinc-800 dark:bg-zinc-950 transition-all"
              >
                {/* Event Card Header */}
                <div
                  onClick={() => toggleExpand(eventItem.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 cursor-pointer hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 gap-3 border-b border-zinc-100 dark:border-zinc-850"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="rounded-lg bg-sky-100 px-2.5 py-1 font-mono text-xs font-bold text-sky-800 dark:bg-sky-950/70 dark:text-sky-300">
                      {eventItem.categoryLabel}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-zinc-900 dark:text-white">
                          {eventItem.name}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleCopyEventId(eventItem.id, e)}
                          title="Copy Event ID"
                          className="rounded p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
                        >
                          {copiedEventId === eventItem.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {eventItem.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTestModal(eventItem.id);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-500" />
                      <span>Test Event</span>
                    </button>
                    <div className="text-zinc-400 pl-1">
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 space-y-5 bg-zinc-50/30 dark:bg-zinc-900/10">
                    {/* When this event fires */}
                    <div className="rounded-xl border border-sky-100 bg-sky-50/50 p-3.5 text-xs dark:border-sky-900/30 dark:bg-sky-950/20">
                      <div className="flex items-center gap-1.5 font-semibold text-sky-900 dark:text-sky-300 mb-1">
                        <Zap className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                        <span>When this event fires</span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {eventItem.whenFires}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      {/* JSON Payload Spec */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                            <Code2 className="h-3.5 w-3.5 text-[#0066FF] dark:text-[#55C2FF]" />
                            <span>Example JSON Payload</span>
                          </h4>
                          <span className="text-[11px] font-mono text-zinc-400">application/json</span>
                        </div>
                        <SyntaxHighlightedJson data={eventItem.samplePayload} maxHeight="max-h-80" />
                      </div>

                      {/* Fields Documentation Table */}
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-2">
                          Payload Properties
                        </h4>
                        <div className="rounded-xl border border-zinc-200 bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900">
                          <table className="w-full text-left text-xs">
                            <thead className="border-b border-zinc-200 bg-zinc-50 text-[11px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                              <tr>
                                <th className="px-3 py-2">Field</th>
                                <th className="px-2 py-2">Type</th>
                                <th className="px-3 py-2">Description</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono text-[11px]">
                              {eventItem.fields.map((f) => (
                                <tr key={f.field} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                                  <td className="px-3 py-2 font-bold text-zinc-900 dark:text-zinc-100">
                                    {f.field}
                                    {f.required && <span className="text-rose-500 ml-0.5">*</span>}
                                  </td>
                                  <td className="px-2 py-2 text-zinc-500 dark:text-zinc-400">{f.type}</td>
                                  <td className="px-3 py-2 font-sans text-zinc-600 dark:text-zinc-300">{f.description}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Signature Verification Guide Section */}
      <div id="signatures" className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-[#0066FF] dark:text-[#55C2FF] uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4" />
            <span>Security & Integrity</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mt-1">
            Verifying Webhook Signatures
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 max-w-3xl">
            FacilPay signs all outbound webhook event payloads using an HMAC-SHA256 signature scheme with your endpoint secret. Always verify signatures in your handler to ensure requests originate from FacilPay and have not been tampered with or replayed.
          </p>
        </div>

        {/* Verification Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="font-mono text-xs font-bold text-[#0066FF] dark:text-[#55C2FF]">1. Header Format</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
              Every request includes header <code className="font-mono font-bold text-zinc-900 dark:text-zinc-100">X-FacilPay-Signature</code> formatted as <code className="font-mono">t=&lt;timestamp&gt;,v1=&lt;signature&gt;</code>.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="font-mono text-xs font-bold text-[#0066FF] dark:text-[#55C2FF]">2. Replay Protection</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
              The <code className="font-mono">t=</code> timestamp indicates Unix epoch seconds when the request was dispatched. Reject requests older than 300 seconds (5 minutes) to protect against replay attacks.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <span className="font-mono text-xs font-bold text-[#0066FF] dark:text-[#55C2FF]">3. Timing-Safe Comparison</span>
            <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
              Compute HMAC-SHA256 over <code className="font-mono">&lt;timestamp&gt;.&lt;rawBody&gt;</code> using your endpoint secret and compare using a constant-time equality check.
            </p>
          </div>
        </div>

        {/* Code Snippets Container */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-950 overflow-hidden shadow-lg dark:border-zinc-800">
          {/* Language Tabs */}
          <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5 bg-zinc-900/70">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveLangTab('nodejs')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  activeLangTab === 'nodejs'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Node.js
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab('python')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  activeLangTab === 'python'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Python 3
              </button>
              <button
                type="button"
                onClick={() => setActiveLangTab('go')}
                className={`rounded-lg px-3 py-1 text-xs font-semibold transition-colors ${
                  activeLangTab === 'go'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Go
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleCopySnippet(SIGNATURE_VERIFICATION_SNIPPETS[activeLangTab])}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
            >
              {copiedSnippet ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Snippet Code View */}
          <pre className="p-4 text-xs font-mono text-zinc-200 overflow-x-auto leading-relaxed max-h-96">
            <code>{SIGNATURE_VERIFICATION_SNIPPETS[activeLangTab]}</code>
          </pre>
        </div>
      </div>

      {/* Send Test Event Modal */}
      <SendTestEventModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        initialEventType={testModalInitialEvent}
      />
    </div>
  );
}
