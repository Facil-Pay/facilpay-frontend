"use client";

import { useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Download, FileUp, Search, X } from "lucide-react";
import { INITIAL_PAYMENTS, INITIAL_PAYOUTS, INITIAL_REFUNDS } from "@/lib/mockData";
import {
  createReconciliationActivities,
  createSampleStatement,
  parseSettlementCsv,
  reconcileSettlement,
  type ReconciliationRow,
  type ReconciliationStatus,
  type SettlementEntry,
} from "@/lib/reconciliation";
import { generateCsv, triggerCsvDownload } from "@/lib/csvExport";
import type { ExportColumn } from "@/lib/types";

const activities = createReconciliationActivities(INITIAL_PAYMENTS, INITIAL_REFUNDS, INITIAL_PAYOUTS);
const initialStatement = createSampleStatement(activities);
const statuses: ReconciliationStatus[] = [
  "Matched",
  "Mismatch",
  "Missing statement",
  "Unmatched statement",
];

type AssetTotal = { expected: number; statement: number };
type ExportRow = {
  status: string;
  activityType: string;
  activityId: string;
  activityDate: string;
  statementDate: string;
  reference: string;
  asset: string;
  expectedAmount: string;
  statementAmount: string;
  difference: string;
};

const exportColumns: ExportColumn<ExportRow>[] = [
  { key: "status", label: "Reconciliation Status", selected: true },
  { key: "activityType", label: "Activity Type", selected: true },
  { key: "activityId", label: "FacilPay ID", selected: true },
  { key: "activityDate", label: "FacilPay Date", selected: true },
  { key: "statementDate", label: "Statement Date", selected: true },
  { key: "reference", label: "Transaction Reference", selected: true },
  { key: "asset", label: "Asset", selected: true },
  { key: "expectedAmount", label: "Expected Amount", selected: true },
  { key: "statementAmount", label: "Statement Amount", selected: true },
  { key: "difference", label: "Difference", selected: true },
];

function amountText(amount: number | undefined, asset: string | undefined) {
  if (amount === undefined || !asset) return "—";
  return `${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })} ${asset}`;
}

function signedAmount(amount: number | undefined, asset: string | undefined) {
  if (amount === undefined || !asset) return "—";
  const prefix = amount > 0 ? "+" : "";
  return `${prefix}${amountText(amount, asset)}`;
}

function referenceText(row: ReconciliationRow) {
  return row.activity?.reference || row.statement?.reference || "No reference";
}

function rowAsset(row: ReconciliationRow) {
  return row.activity?.asset ?? row.statement?.asset;
}

function statusClasses(status: ReconciliationStatus) {
  if (status === "Matched") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "Mismatch") return "border-amber-200 bg-amber-50 text-amber-800";
  return "border-rose-200 bg-rose-50 text-rose-800";
}

export default function ReconciliationPage() {
  const [statementEntries, setStatementEntries] = useState<SettlementEntry[]>(initialStatement);
  const [statementName, setStatementName] = useState("Sample settlement statement");
  const [importError, setImportError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assetFilter, setAssetFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  const allRows = useMemo(
    () => reconcileSettlement(activities, statementEntries),
    [statementEntries],
  );

  const visibleRows = useMemo(() => allRows.filter((row) => {
    const activity = row.activity;
    const statement = row.statement;
    const date = (activity?.date ?? statement?.date ?? "").slice(0, 10);
    const asset = rowAsset(row) ?? "";
    const query = search.trim().toLowerCase();

    if (statusFilter !== "ALL" && row.status !== statusFilter) return false;
    if (assetFilter !== "ALL" && asset !== assetFilter) return false;
    if (startDate && date < startDate) return false;
    if (endDate && date > endDate) return false;
    if (query && ![
      activity?.id,
      activity?.type,
      activity?.reference,
      statement?.reference,
      row.status,
    ].some((value) => value?.toLowerCase().includes(query))) return false;
    return true;
  }), [allRows, search, statusFilter, assetFilter, startDate, endDate]);

  const totalsByAsset = useMemo(() => visibleRows.reduce<Record<string, AssetTotal>>((totals, row) => {
    const asset = rowAsset(row);
    if (!asset) return totals;
    totals[asset] ??= { expected: 0, statement: 0 };
    if (row.activity) totals[asset].expected += row.activity.amount;
    if (row.statement) totals[asset].statement += row.statement.amount;
    return totals;
  }, {}), [visibleRows]);

  const matchedCount = visibleRows.filter((row) => row.status === "Matched").length;
  const exceptionCount = visibleRows.length - matchedCount;
  const statementAssets = [...new Set([...activities.map((activity) => activity.asset), ...statementEntries.map((entry) => entry.asset)])].sort();

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    try {
      const entries = parseSettlementCsv(await file.text());
      setStatementEntries(entries);
      setStatementName(file.name);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Could not read this statement file.");
    } finally {
      event.target.value = "";
    }
  };

  const handleResetSample = () => {
    setStatementEntries(initialStatement);
    setStatementName("Sample settlement statement");
    setImportError(null);
  };

  const handleExport = () => {
    const exportRows = visibleRows.map((row): ExportRow => ({
      status: row.status,
      activityType: row.activity?.type ?? "",
      activityId: row.activity?.id ?? "",
      activityDate: row.activity?.date ?? "",
      statementDate: row.statement?.date ?? "",
      reference: referenceText(row),
      asset: rowAsset(row) ?? "",
      expectedAmount: row.activity ? row.activity.amount.toFixed(7) : "",
      statementAmount: row.statement ? row.statement.amount.toFixed(7) : "",
      difference: row.difference === undefined ? "" : row.difference.toFixed(7),
    }));
    const dateLabel = new Date().toISOString().slice(0, 10);
    triggerCsvDownload(generateCsv(exportRows, exportColumns), `facilpay-reconciliation-${dateLabel}.csv`);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-700">Finance</p>
          <h1 className="mt-1 text-2xl font-semibold text-zinc-950">Settlement reconciliation</h1>
          <p className="mt-1 text-sm text-zinc-600">Compare completed FacilPay activity with settlement-account entries.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            onChange={handleImport}
            className="sr-only"
            aria-label="Import settlement statement CSV"
          />
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-[#000F24] px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-[#15304d]"
          >
            <FileUp className="h-4 w-4" aria-hidden="true" />
            Import statement
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={visibleRows.length === 0}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export report
          </button>
        </div>
      </header>

      <section aria-label="Statement source" className="flex flex-col gap-3 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500">Statement source</p>
          <p className="truncate text-sm font-semibold text-zinc-900" title={statementName}>{statementName}</p>
          <p className="text-xs text-zinc-500">{statementEntries.length.toLocaleString()} statement entries</p>
        </div>
        <button
          type="button"
          onClick={handleResetSample}
          className="self-start text-sm font-medium text-sky-800 underline decoration-sky-300 underline-offset-4 hover:text-sky-950 sm:self-auto"
        >
          Restore sample statement
        </button>
      </section>

      {importError && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3.5 py-3 text-sm text-rose-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{importError}</span>
        </div>
      )}

      <section className="grid grid-cols-2 gap-x-6 gap-y-4 border-b border-zinc-200 pb-5 sm:grid-cols-4" aria-label="Reconciliation summary">
        <SummaryValue label="Matched" value={`${matchedCount} / ${visibleRows.length}`} tone="emerald" />
        <SummaryValue label="Needs review" value={String(exceptionCount)} tone={exceptionCount ? "amber" : "emerald"} />
        <SummaryValue label="Statement rows" value={statementEntries.length.toLocaleString()} tone="sky" />
        <SummaryValue label="FacilPay activity" value={activities.length.toLocaleString()} tone="zinc" />
      </section>

      <section aria-label="Settlement totals by asset" className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">Net settlement by asset</h2>
          <span className="text-xs text-zinc-500">Statement minus expected shown as variance</span>
        </div>
        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <table className="w-full min-w-[600px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-2.5">Asset</th>
                <th className="px-4 py-2.5 text-right">Expected net</th>
                <th className="px-4 py-2.5 text-right">Statement net</th>
                <th className="px-4 py-2.5 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {Object.entries(totalsByAsset).map(([asset, totals]) => (
                <tr key={asset}>
                  <th scope="row" className="px-4 py-3 font-semibold text-zinc-900">{asset}</th>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-700">{amountText(totals.expected, asset)}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-zinc-700">{amountText(totals.statement, asset)}</td>
                  <td className={`px-4 py-3 text-right tabular-nums font-semibold ${Math.abs(totals.statement - totals.expected) > 0.01 ? "text-amber-800" : "text-emerald-800"}`}>
                    {signedAmount(totals.statement - totals.expected, asset)}
                  </td>
                </tr>
              ))}
              {Object.keys(totalsByAsset).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-sm text-zinc-500">No settlement totals match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section aria-label="Reconciliation records" className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_160px_140px_140px_140px]">
          <label className="relative block">
            <span className="sr-only">Search records</span>
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-zinc-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ID or reference"
              className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
            />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            <span className="sr-only">Filter by status</span>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800">
              <option value="ALL">All statuses</option>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-600">
            <span className="sr-only">Filter by asset</span>
            <select value={assetFilter} onChange={(event) => setAssetFilter(event.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800">
              <option value="ALL">All assets</option>
              {statementAssets.map((asset) => <option key={asset} value={asset}>{asset}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-zinc-600">
            <span className="sr-only">From date</span>
            <input aria-label="From date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800" />
          </label>
          <label className="text-xs font-medium text-zinc-600">
            <span className="sr-only">To date</span>
            <input aria-label="To date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800" />
          </label>
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500">
          <span>{visibleRows.length.toLocaleString()} records</span>
          <span>{statementName}</span>
        </div>

        <div className="overflow-x-auto rounded-md border border-zinc-200 bg-white">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs font-semibold uppercase text-zinc-500">
              <tr>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">FacilPay activity</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Activity date</th>
                <th className="px-4 py-3 text-right">Expected</th>
                <th className="px-4 py-3">Statement date</th>
                <th className="px-4 py-3 text-right">Landed</th>
                <th className="px-4 py-3 text-right">Difference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {visibleRows.map((row) => (
                <tr key={row.id} className="align-top hover:bg-zinc-50/70">
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-1 text-xs font-semibold ${statusClasses(row.status)}`}>
                      {row.status === "Matched" ? <Check className="h-3 w-3" aria-hidden="true" /> : <X className="h-3 w-3" aria-hidden="true" />}
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-zinc-900">{row.activity?.type ?? "Statement entry"}</span>
                    <span className="font-mono text-xs text-zinc-500">{row.activity?.id ?? "—"}</span>
                  </td>
                  <td className="max-w-[220px] px-4 py-3 font-mono text-xs text-zinc-600" title={referenceText(row)}>
                    <span className="block truncate">{referenceText(row)}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">{row.activity ? new Date(row.activity.date).toLocaleDateString() : "—"}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${row.activity && row.activity.amount < 0 ? "text-rose-700" : "text-zinc-800"}`}>
                    {row.activity ? amountText(row.activity.amount, row.activity.asset) : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600">{row.statement ? new Date(row.statement.date).toLocaleDateString() : "—"}</td>
                  <td className={`px-4 py-3 text-right tabular-nums ${row.statement && row.statement.amount < 0 ? "text-rose-700" : "text-zinc-800"}`}>
                    {row.statement ? amountText(row.statement.amount, row.statement.asset) : "—"}
                  </td>
                  <td className={`px-4 py-3 text-right tabular-nums font-medium ${row.difference !== undefined && Math.abs(row.difference) > 0.01 ? "text-amber-800" : "text-zinc-700"}`}>
                    {row.difference === undefined ? "—" : signedAmount(row.difference, rowAsset(row))}
                  </td>
                </tr>
              ))}
              {visibleRows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-sm text-zinc-500">No reconciliation records match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function SummaryValue({ label, value, tone }: { label: string; value: string; tone: "emerald" | "amber" | "sky" | "zinc" }) {
  const toneClass = {
    emerald: "text-emerald-800",
    amber: "text-amber-800",
    sky: "text-sky-800",
    zinc: "text-zinc-900",
  }[tone];

  return (
    <div>
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${toneClass}`}>{value}</p>
    </div>
  );
}