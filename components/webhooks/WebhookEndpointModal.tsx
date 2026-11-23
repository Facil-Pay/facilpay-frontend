'use client';

import React, { useState, useEffect } from 'react';
import {
  Webhook,
  WebhookEvent,
  WEBHOOK_EVENT_GROUPS,
  ALL_WEBHOOK_EVENT_IDS,
} from '@/lib/types';
import {
  createEndpoint,
  updateEndpoint,
  validateWebhookUrl,
} from '@/lib/webhook-data';

interface WebhookEndpointModalProps {
  isOpen: boolean;
  endpoint?: Webhook | null;
  onClose: () => void;
  onSuccess: (endpoint: Webhook, generatedSecret?: string) => void;
}

export default function WebhookEndpointModal({
  isOpen,
  endpoint,
  onClose,
  onSuccess,
}: WebhookEndpointModalProps) {
  const isEditing = Boolean(endpoint);

  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<WebhookEvent[]>([]);
  const [status, setStatus] = useState<'active' | 'disabled'>('active');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form on open or when target endpoint changes
  useEffect(() => {
    if (endpoint) {
      setUrl(endpoint.url || '');
      setDescription(endpoint.description || '');
      setSelectedEvents(endpoint.events || []);
      setStatus(endpoint.status === 'disabled' ? 'disabled' : 'active');
    } else {
      setUrl('');
      setDescription('');
      setSelectedEvents([
        'payment.created',
        'payment.completed',
        'payment.failed',
        'refund.completed',
      ]);
      setStatus('active');
    }
    setUrlError(null);
    setEventsError(null);
  }, [endpoint, isOpen]);

  if (!isOpen) return null;

  // Toggle individual event
  const toggleEvent = (eventId: WebhookEvent) => {
    setEventsError(null);
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  // Group Select All / Deselect All
  const toggleGroup = (groupEventIds: WebhookEvent[]) => {
    setEventsError(null);
    const allSelected = groupEventIds.every((id) => selectedEvents.includes(id));
    if (allSelected) {
      // Remove all events of this group
      setSelectedEvents((prev) => prev.filter((id) => !groupEventIds.includes(id)));
    } else {
      // Add missing events of this group
      const missing = groupEventIds.filter((id) => !selectedEvents.includes(id));
      setSelectedEvents((prev) => [...prev, ...missing]);
    }
  };

  // Global Select / Deselect All
  const handleToggleAllEvents = () => {
    setEventsError(null);
    if (selectedEvents.length === ALL_WEBHOOK_EVENT_IDS.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents([...ALL_WEBHOOK_EVENT_IDS]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate URL
    const urlValidation = validateWebhookUrl(url, true);
    if (!urlValidation.isValid) {
      setUrlError(urlValidation.error || 'Invalid URL');
      return;
    }

    // 2. Validate events
    if (selectedEvents.length === 0) {
      setEventsError('Please select at least one event subscription');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      if (isEditing && endpoint) {
        const updated = updateEndpoint(endpoint.id, {
          url: url.trim(),
          description: description.trim(),
          events: selectedEvents,
          status,
        });
        setIsSubmitting(false);
        if (updated) {
          onSuccess(updated);
        }
      } else {
        const result = createEndpoint({
          url: url.trim(),
          description: description.trim(),
          events: selectedEvents,
          status,
        });
        setIsSubmitting(false);
        onSuccess(result.endpoint, result.generatedSecret);
      }
      onClose();
    }, 400);
  };

  const isAllGlobalSelected = selectedEvents.length === ALL_WEBHOOK_EVENT_IDS.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-950 flex flex-col max-h-[92vh] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 font-bold text-sm">
              {isEditing ? '✎' : '+'}
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                {isEditing ? 'Edit Webhook Endpoint' : 'Create Webhook Endpoint'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Receive automated HTTP POST notifications for Stellar payment and escrow events
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Endpoint URL Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="webhook-endpoint-url" className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                Endpoint URL <span className="text-rose-600" aria-hidden="true">*</span>
              </label>
              <span id="webhook-endpoint-url-hint" className="text-[11px] text-zinc-600 dark:text-zinc-400">
                Must be <code className="font-mono text-zinc-600 dark:text-zinc-300">https://</code> (or <code className="font-mono text-zinc-600 dark:text-zinc-300">http://localhost</code> on Testnet)
              </span>
            </div>
            <input
              id="webhook-endpoint-url"
              type="url"
              inputMode="url"
              required
              aria-required="true"
              aria-invalid={urlError ? true : undefined}
              aria-describedby={urlError ? 'webhook-endpoint-url-error webhook-endpoint-url-hint' : 'webhook-endpoint-url-hint'}
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setUrlError(null);
              }}
              placeholder="https://api.yourdomain.com/webhooks"
              className={`w-full rounded-xl border px-3.5 py-2 font-mono text-xs text-zinc-900 dark:text-white dark:bg-zinc-900 focus:outline-none ${
                urlError
                  ? 'border-rose-500 focus:border-rose-500 focus:ring-1 focus:ring-rose-500'
                  : 'border-zinc-300 dark:border-zinc-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500'
              }`}
            />
            {urlError && (
              <p id="webhook-endpoint-url-error" role="alert" className="mt-1.5 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <span aria-hidden="true">⚠</span>
                <span>{urlError}</span>
              </p>
            )}
          </div>

          {/* Description Field */}
          <div>
            <label htmlFor="webhook-endpoint-description" className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1">
              Description / Friendly Label
            </label>
            <input
              id="webhook-endpoint-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Primary Production Order Processing Webhook"
              className="w-full rounded-xl border border-zinc-300 px-3.5 py-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white focus:border-sky-500 focus:outline-none"
            />
          </div>

          {/* Status Radio / Toggle */}
          <fieldset>
            <legend className="block text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 mb-1.5">
              Initial Status
            </legend>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                />
                <span className="inline-flex items-center gap-1.5 font-medium text-zinc-800 dark:text-zinc-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Active (Receiving Live Events)
                </span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs">
                <input
                  type="radio"
                  name="status"
                  value="disabled"
                  checked={status === 'disabled'}
                  onChange={() => setStatus('disabled')}
                  className="h-4 w-4 text-zinc-600 focus:ring-zinc-500"
                />
                <span className="inline-flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-zinc-400" />
                  Inactive (Disabled)
                </span>
              </label>
            </div>
          </fieldset>

          {/* Event Subscriptions Checkbox Groups */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2 dark:border-zinc-800">
              <div>
                <h3 id="webhook-events-label" className="text-xs font-semibold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                  Event Subscriptions <span className="text-rose-600" aria-hidden="true">*</span>
                </h3>
                <p id="webhook-events-count" className="text-[11px] text-zinc-600 dark:text-zinc-400" aria-live="polite">
                  {selectedEvents.length} of {ALL_WEBHOOK_EVENT_IDS.length} events subscribed
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAllEvents}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
              >
                {isAllGlobalSelected ? 'Deselect All' : 'Select All Events'}
              </button>
            </div>

            {eventsError && (
              <p id="webhook-events-error" role="alert" className="text-xs text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <span aria-hidden="true">⚠</span>
                <span>{eventsError}</span>
              </p>
            )}

            {/* Checkbox Groups */}
            <div
              role="group"
              aria-labelledby="webhook-events-label"
              aria-describedby={eventsError ? 'webhook-events-error webhook-events-count' : 'webhook-events-count'}
              className="space-y-4"
            >
              {WEBHOOK_EVENT_GROUPS.map((group) => {
                const groupEventIds = group.events.map((e) => e.id);
                const isGroupAllSelected = groupEventIds.every((id) =>
                  selectedEvents.includes(id)
                );
                const isGroupSomeSelected =
                  !isGroupAllSelected &&
                  groupEventIds.some((id) => selectedEvents.includes(id));

                return (
                  <div
                    key={group.id}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 p-3.5 space-y-2.5"
                  >
                    {/* Group Header with "Select all per group" */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {group.name}
                        </span>
                        <span className="text-[10px] text-zinc-600 dark:text-zinc-400">
                          ({group.events.length} events)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleGroup(groupEventIds)}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 dark:text-sky-400 cursor-pointer"
                      >
                        {isGroupAllSelected ? 'Deselect group' : 'Select all'}
                      </button>
                    </div>

                    {/* Group Checkbox Items */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {group.events.map((ev) => {
                        const isChecked = selectedEvents.includes(ev.id);
                        return (
                          <label
                            key={ev.id}
                            className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                              isChecked
                                ? 'border-sky-300 bg-sky-50/60 dark:border-sky-900/60 dark:bg-sky-950/30'
                                : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleEvent(ev.id)}
                              className="mt-0.5 h-4 w-4 rounded text-sky-600 focus:ring-sky-500"
                            />
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-200 block truncate">
                                {ev.id}
                              </span>
                              <span className="text-[10px] text-zinc-500 dark:text-zinc-400 block line-clamp-1">
                                {ev.description}
                              </span>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#55C2FF] to-[#0066FF] px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-opacity cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving Endpoint...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create & Generate Secret'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
