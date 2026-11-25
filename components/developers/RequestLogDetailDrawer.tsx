"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditCard, ExternalLink, RotateCcw, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import SyntaxHighlightedJson from "@/components/webhooks/SyntaxHighlightedJson";
import { useFormat } from "@/lib/i18n/use-format";
import {
  REDACTED,
  redactHeaders,
  redactValue,
  statusClass,
  statusText,
  type ApiRequestLog,
} from "@/lib/api-request-logs";

interface RequestLogDetailDrawerProps {
  log: ApiRequestLog | null;
  onClose: () => void;
}

type DrawerTab = "request" | "response";

const STATUS_CLASS_STYLES: Record<string, string> = {
  "2xx": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-800",
  "4xx": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-400 dark:border-amber-800",
  "5xx": "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-400 dark:border-rose-800",
};

export default function RequestLogDetailDrawer({ log, onClose }: RequestLogDetailDrawerProps) {
  const f = useFormat();
  const [activeTab, setActiveTab] = useState<DrawerTab>("request");

  useEffect(() => {
    if (!log) return;
    setActiveTab("request");
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [log, onClose]);

  if (!log) return null;

  const cls = statusClass(log.status);
  const requestHeaders = redactHeaders(log.requestHeaders);
  const responseHeaders = redactHeaders(log.responseHeaders);
  const requestBody = log.requestBody === undefined ? undefined : redactValue(log.requestBody);
  const responseBody = log.responseBody === undefined ? undefined : redactValue(log.responseBody);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Request ${log.requestId}`}
        onClick={(event) => event.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden border-l border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
      >
        {/* Header */}
        <div className="border-b border-zinc-200 bg-zinc-50/70 p-5 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-zinc-900 px-2 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                  {log.method}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    STATUS_CLASS_STYLES[cls]
                  )}
                >
                  {log.status} {statusText(log.status)}
                </span>
              </div>
              <p className="mt-2 break-all font-mono text-xs font-semibold text-zinc-900 dark:text-white">
                {log.path}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close request details"
              className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs sm:grid-cols-3">
            <Meta label="Timestamp" value={f.time(log.timestamp, true)} />
            <Meta label="Latency" value={`${log.latencyMs} ms`} />
            <Meta label="Request ID" value={log.requestId} mono />
            <Meta label="Key" value={`${log.keyName} · ${log.keyPrefix}`} />
            <Meta label="Environment" value={log.environment} />
          </dl>
        </div>

        {/* Related resources */}
        {(log.relatedPaymentId || log.relatedRefundId) && (
          <div className="flex flex-wrap items-center gap-2 border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Created / touched
            </span>
            {log.relatedPaymentId && (
              <Link
                href={`/payments/${log.relatedPaymentId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-sky-700 hover:bg-sky-100 dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300"
              >
                <CreditCard className="h-3 w-3" />
                {log.relatedPaymentId}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
            {log.relatedRefundId && (
              <Link
                href={`/refunds?refund=${log.relatedRefundId}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-violet-700 hover:bg-violet-100 dark:border-violet-900/60 dark:bg-violet-950/40 dark:text-violet-300"
              >
                <RotateCcw className="h-3 w-3" />
                {log.relatedRefundId}
                <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 px-5 text-xs font-semibold dark:border-zinc-800">
          {(
            [
              { id: "request", label: `Request (${log.method})` },
              { id: "response", label: `Response (${log.status})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "border-b-2 px-3 py-3 transition-colors",
                activeTab === tab.id
                  ? "border-sky-500 font-bold text-sky-600 dark:text-sky-400"
                  : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">Redacted</span>
            <span>
              Sensitive headers, key secrets and card fields are replaced with{" "}
              <code className="font-mono text-zinc-700 dark:text-zinc-300">{REDACTED}</code>.
            </span>
          </div>

          {activeTab === "request" ? (
            <div className="space-y-4">
              <HeaderTable title="Request headers" headers={requestHeaders} />
              <BodyBlock
                title="Request body"
                data={requestBody}
                emptyLabel="This request had no body."
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="block text-[11px] text-zinc-500">HTTP status</span>
                  <span
                    className={cn(
                      "mt-1 block font-mono text-base font-bold",
                      cls === "2xx"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : cls === "4xx"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-rose-600 dark:text-rose-400"
                    )}
                  >
                    {log.status} {statusText(log.status)}
                  </span>
                </div>
                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900">
                  <span className="block text-[11px] text-zinc-500">Roundtrip latency</span>
                  <span className="mt-1 block font-mono text-base font-bold text-zinc-900 dark:text-white">
                    {log.latencyMs} ms
                  </span>
                </div>
              </div>
              <HeaderTable title="Response headers" headers={responseHeaders} />
              <BodyBlock
                title="Response body"
                data={responseBody}
                emptyLabel="This response had no body."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-zinc-800 dark:text-zinc-200",
          mono && "font-mono text-[11px]"
        )}
        title={value}
      >
        {value}
      </dd>
    </div>
  );
}

function HeaderTable({ title, headers }: { title: string; headers: Record<string, string> }) {
  const entries = Object.entries(headers);
  return (
    <section>
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {entries.length === 0 ? (
        <p className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          No headers captured.
        </p>
      ) : (
        <div className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 text-xs dark:divide-zinc-800 dark:border-zinc-800">
          {entries.map(([key, value]) => (
            <div key={key} className="flex flex-col gap-1 p-2.5 sm:flex-row sm:gap-3">
              <span className="shrink-0 font-mono font-semibold text-zinc-500 sm:w-52 dark:text-zinc-400">
                {key}
              </span>
              <span
                className={cn(
                  "break-all font-mono",
                  value === REDACTED
                    ? "italic text-zinc-400 dark:text-zinc-500"
                    : "text-zinc-700 dark:text-zinc-300"
                )}
              >
                {value}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function BodyBlock({
  title,
  data,
  emptyLabel,
}: {
  title: string;
  data: unknown;
  emptyLabel: string;
}) {
  const hasBody = data !== undefined && data !== null && data !== "";
  return (
    <section>
      <h3 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </h3>
      {hasBody ? (
        <SyntaxHighlightedJson data={data} maxHeight="max-h-[360px]" />
      ) : (
        <p className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          {emptyLabel}
        </p>
      )}
    </section>
  );
}
