"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/components/ui/utils";
import {
  ALERT_CATEGORIES,
  ALERT_CATEGORY_LIST,
  PROVIDER_LABELS,
  alertStore,
  deliverAlert,
  maskWebhookUrl,
  newAlertIntegrationId,
  sampleAlertFor,
  useAlertIntegrations,
  validateAlertWebhookUrl,
  type AlertCategory,
  type AlertIntegration,
  type AlertProvider,
} from "@/lib/alerts";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee]";

function formatTimestamp(value: string | null): string {
  if (!value) return "Never";
  return value.slice(0, 16).replace("T", " ");
}

export default function AlertIntegrations() {
  const integrations = useAlertIntegrations();
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AlertIntegration | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<
    { id: string; ok: boolean; message: string; payload?: string } | null
  >(null);

  const closeForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (integration: AlertIntegration) => {
    setEditing(integration);
    setFormOpen(true);
  };

  const saveIntegration = (integration: AlertIntegration) => {
    alertStore.set((prev) =>
      prev.some((item) => item.id === integration.id)
        ? prev.map((item) => (item.id === integration.id ? integration : item))
        : [integration, ...prev]
    );
    toast(editing ? "Alert integration updated" : "Alert integration added", "success");
    closeForm();
  };

  const removeIntegration = (integration: AlertIntegration) => {
    if (!confirm(`Remove the ${PROVIDER_LABELS[integration.provider]} integration "${integration.label}"?`)) {
      return;
    }
    alertStore.set((prev) => prev.filter((item) => item.id !== integration.id));
    if (feedback?.id === integration.id) setFeedback(null);
    toast("Alert integration removed", "info");
  };

  const toggleEnabled = (integration: AlertIntegration) => {
    alertStore.set((prev) =>
      prev.map((item) => (item.id === integration.id ? { ...item, enabled: !item.enabled } : item))
    );
  };

  const sendTest = async (integration: AlertIntegration) => {
    setTestingId(integration.id);
    setFeedback(null);
    const category = integration.categories[0] ?? "payment";
    try {
      const result = await deliverAlert(integration, sampleAlertFor(category));
      alertStore.set((prev) =>
        prev.map((item) => (item.id === integration.id ? { ...item, lastDeliveryAt: result.sentAt } : item))
      );
      setFeedback({
        id: integration.id,
        ok: true,
        message: `Test ${PROVIDER_LABELS[integration.provider]} alert sent (${ALERT_CATEGORIES[category].label}).`,
        payload: JSON.stringify(result.payload, null, 2),
      });
      toast(`Test alert sent to ${integration.label}`, "success");
    } catch (error) {
      setFeedback({
        id: integration.id,
        ok: false,
        message: error instanceof Error ? error.message : "Could not send the test alert.",
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Slack &amp; Discord alerts</h2>
          <p className="mt-0.5 text-sm text-zinc-500">
            Send payment, refund and payout alerts to a channel using an incoming webhook URL.
          </p>
        </div>
        {!formOpen && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 self-start rounded-md bg-[#000F24] px-4 py-2 text-sm font-medium text-white"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add integration
          </button>
        )}
      </header>

      {formOpen && (
        <IntegrationForm
          key={editing?.id ?? "new"}
          initial={editing}
          onCancel={closeForm}
          onSave={saveIntegration}
        />
      )}

      {integrations.length === 0 && !formOpen && (
        <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50/60 p-6 text-center">
          <p className="text-sm font-medium text-zinc-700">No chat alerts configured</p>
          <p className="mt-1 text-xs text-zinc-500">
            Connect a Slack or Discord channel to be notified about payments, refunds and payouts.
          </p>
        </div>
      )}

      {integrations.length > 0 && (
        <ul className="space-y-3">
          {integrations.map((integration) => (
            <li key={integration.id} className="rounded-lg border border-zinc-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        integration.provider === "slack"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-indigo-50 text-indigo-700"
                      )}
                    >
                      {PROVIDER_LABELS[integration.provider]}
                    </span>
                    <span className="truncate text-sm font-semibold text-zinc-900">{integration.label}</span>
                    {!integration.enabled && (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-zinc-500" title={integration.webhookUrl}>
                    {maskWebhookUrl(integration.webhookUrl)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void sendTest(integration)}
                    disabled={testingId === integration.id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                  >
                    {testingId === integration.id && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    )}
                    Send test alert
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(integration)}
                    className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => removeIntegration(integration)}
                    aria-label={`Remove ${integration.label}`}
                    className="inline-flex items-center rounded-md border border-zinc-300 p-1.5 text-zinc-500 hover:bg-zinc-50 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {integration.categories.map((category) => (
                  <span
                    key={category}
                    className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-medium text-sky-700"
                  >
                    {ALERT_CATEGORIES[category].label}
                  </span>
                ))}
                <label className="ml-auto inline-flex items-center gap-1.5 text-xs text-zinc-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#20a7ee]"
                    checked={integration.enabled}
                    onChange={() => toggleEnabled(integration)}
                  />
                  {integration.enabled ? "Active" : "Paused"}
                </label>
              </div>

              <p className="mt-2 text-[11px] text-zinc-400">
                Last test: {formatTimestamp(integration.lastDeliveryAt)}
              </p>

              {feedback?.id === integration.id && (
                <div
                  role={feedback.ok ? "status" : "alert"}
                  className={cn(
                    "mt-2 rounded-md border px-3 py-2 text-xs",
                    feedback.ok
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700"
                  )}
                >
                  <p className="flex items-center gap-1.5 font-medium">
                    {!feedback.ok && <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                    {feedback.message}
                  </p>
                  {feedback.payload && (
                    <details className="mt-1.5">
                      <summary className="cursor-pointer text-[11px] text-zinc-500">View payload</summary>
                      <pre className="mt-1 overflow-x-auto rounded bg-white/70 p-2 font-mono text-[10px] leading-relaxed text-zinc-700">
                        {feedback.payload}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function IntegrationForm({
  initial,
  onCancel,
  onSave,
}: {
  initial: AlertIntegration | null;
  onCancel: () => void;
  onSave: (integration: AlertIntegration) => void;
}) {
  const [provider, setProvider] = useState<AlertProvider>(initial?.provider ?? "slack");
  const [webhookUrl, setWebhookUrl] = useState(initial?.webhookUrl ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [categories, setCategories] = useState<AlertCategory[]>(
    initial && initial.categories.length > 0 ? initial.categories : ["payment"]
  );
  const [enabled, setEnabled] = useState(initial?.enabled ?? true);
  const [error, setError] = useState<string | null>(null);

  const toggleCategory = (category: AlertCategory) =>
    setCategories((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );

  const handleSubmit = () => {
    const validation = validateAlertWebhookUrl(webhookUrl, provider);
    if (!validation.valid) {
      setError(validation.error ?? "Enter a valid webhook URL.");
      return;
    }
    if (categories.length === 0) {
      setError("Choose at least one alert type.");
      return;
    }
    onSave({
      id: initial?.id ?? newAlertIntegrationId(),
      provider,
      webhookUrl: validation.normalized,
      label: label.trim() || `${PROVIDER_LABELS[provider]} alerts`,
      enabled,
      categories,
      lastDeliveryAt: initial?.lastDeliveryAt ?? null,
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50/60 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Provider</span>
          <select
            className={inputClass}
            value={provider}
            onChange={(event) => {
              setProvider(event.target.value as AlertProvider);
              setError(null);
            }}
          >
            <option value="slack">Slack</option>
            <option value="discord">Discord</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-zinc-700">Label</span>
          <input
            className={inputClass}
            value={label}
            placeholder="e.g. #payments-ops"
            onChange={(event) => setLabel(event.target.value)}
          />
        </label>
      </div>

      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-zinc-700">Incoming webhook URL</span>
        <input
          className={cn(inputClass, "font-mono text-xs", error && "border-red-400")}
          value={webhookUrl}
          placeholder={
            provider === "slack"
              ? "https://hooks.slack.com/services/T000/B000/XXXX"
              : "https://discord.com/api/webhooks/0000/XXXX"
          }
          spellCheck={false}
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setWebhookUrl(event.target.value);
            if (error) setError(null);
          }}
        />
        <span className="text-xs text-zinc-500">
          Copy the webhook URL from your {PROVIDER_LABELS[provider]} app. It is stored locally and never
          shown in full again.
        </span>
      </label>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-zinc-700">Send alerts for</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {ALERT_CATEGORY_LIST.map((category) => (
            <label
              key={category}
              className={cn(
                "flex cursor-pointer flex-col gap-0.5 rounded-md border px-3 py-2 text-sm",
                categories.includes(category)
                  ? "border-[#20a7ee] bg-sky-50"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              )}
            >
              <span className="flex items-center gap-2 font-medium text-zinc-800">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-[#20a7ee]"
                  checked={categories.includes(category)}
                  onChange={() => {
                    toggleCategory(category);
                    if (error) setError(null);
                  }}
                />
                {ALERT_CATEGORIES[category].label}
              </span>
              <span className="pl-6 text-xs text-zinc-500">{ALERT_CATEGORIES[category].description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          className="h-4 w-4 accent-[#20a7ee]"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
        Start sending alerts immediately
      </label>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-zinc-200 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-md bg-[#000F24] px-4 py-2 text-sm font-medium text-white"
        >
          {initial ? "Save changes" : "Add integration"}
        </button>
      </div>
    </div>
  );
}
