'use client';

import React, { useState, useEffect } from 'react';
import { ExportColumn, ExportProgress } from '@/lib/types';
import {
  generateCsv,
  generateExportFileName,
  triggerCsvDownload,
  exportWithProgress,
} from '@/lib/csvExport';
import { useFormat } from '@/lib/i18n/use-format';

interface ExportModalProps<T extends Record<string, any>> {
  isOpen: boolean;
  onClose: () => void;
  type: 'payments' | 'refunds' | 'payouts';
  title: string;
  data: T[];
  columns: ExportColumn<T>[];
  filterStartDate?: string | null;
  filterEndDate?: string | null;
  filterSummary?: string;
  onBackendExport?: (selectedColumns: ExportColumn<T>[]) => Promise<void>;
}

export default function ExportModal<T extends Record<string, any>>({
  isOpen,
  onClose,
  type,
  title,
  data,
  columns: initialColumns,
  filterStartDate,
  filterEndDate,
  filterSummary,
  onBackendExport,
}: ExportModalProps<T>) {
  const f = useFormat();
  const [columns, setColumns] = useState<ExportColumn<T>[]>(initialColumns);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportMode, setExportMode] = useState<'client' | 'backend'>('client');
  const [cancelled, setCancelled] = useState(false);

  // Sync columns when modal opens or initialColumns change
  useEffect(() => {
    setColumns(initialColumns);
    setIsExporting(false);
    setProgress(null);
    setCancelled(false);
  }, [isOpen, initialColumns]);

  if (!isOpen) return null;

  const totalRows = data.length;
  const isLargeExport = totalRows > 1000;
  const selectedCount = columns.filter((c) => c.selected).length;
  const generatedFileName = generateExportFileName(
    type,
    filterStartDate,
    filterEndDate,
    data
  );

  const handleToggleColumn = (key: string | keyof T) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.key === key ? { ...col, selected: !col.selected } : col
      )
    );
  };

  const handleSelectAll = (selectAll: boolean) => {
    setColumns((prev) => prev.map((col) => ({ ...col, selected: selectAll })));
  };

  const handleStartExport = async () => {
    if (selectedCount === 0) return;

    setIsExporting(true);
    setCancelled(false);

    try {
      if (exportMode === 'backend' && onBackendExport) {
        setProgress({
          current: 0,
          total: totalRows,
          percentage: 20,
          batchIndex: 1,
          totalBatches: 1,
          status: 'fetching',
          message: 'Submitting backend export job...',
        });
        await onBackendExport(columns.filter((c) => c.selected));
        setProgress({
          current: totalRows,
          total: totalRows,
          percentage: 100,
          batchIndex: 1,
          totalBatches: 1,
          status: 'completed',
          message: `Backend export job completed successfully!`,
        });
        setTimeout(() => {
          setIsExporting(false);
          onClose();
        }, 1500);
        return;
      }

      // If dataset is > 1000 rows, use chunked progress export
      if (isLargeExport) {
        await exportWithProgress({
          type,
          data,
          columns,
          totalRows,
          filterStartDate,
          filterEndDate,
          batchSize: 500,
          onProgress: (p) => setProgress(p),
          isCancelled: () => cancelled,
        });

        setTimeout(() => {
          setIsExporting(false);
          onClose();
        }, 1200);
      } else {
        // Standard fast export for < 1000 rows
        setProgress({
          current: totalRows,
          total: totalRows,
          percentage: 100,
          batchIndex: 1,
          totalBatches: 1,
          status: 'generating',
          message: 'Generating CSV file...',
        });

        const csvContent = generateCsv(data, columns);
        triggerCsvDownload(csvContent, generatedFileName);

        setProgress({
          current: totalRows,
          total: totalRows,
          percentage: 100,
          batchIndex: 1,
          totalBatches: 1,
          status: 'completed',
          message: `Exported ${f.number(totalRows)} rows to ${generatedFileName}`,
        });

        setTimeout(() => {
          setIsExporting(false);
          onClose();
        }, 800);
      }
    } catch (err: any) {
      setProgress({
        current: 0,
        total: totalRows,
        percentage: 0,
        batchIndex: 0,
        totalBatches: 0,
        status: 'error',
        message: err?.message || 'Export failed. Please try again.',
      });
      setIsExporting(false);
    }
  };

  const handleCancel = () => {
    setCancelled(true);
    setIsExporting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
          <div>
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white">
              Export {title} to CSV
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              Filter-aware CSV export with column selection & RFC 4180 escaping
            </p>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Close"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Active Dataset Summary Banner */}
          <div className="rounded-xl bg-zinc-50 border border-zinc-200/80 p-4 dark:bg-zinc-800/50 dark:border-zinc-800">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <span className="text-xs font-semibold tracking-wider text-zinc-500 uppercase">
                  Filtered Dataset Scope
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-zinc-900 dark:text-white">
                    {f.number(totalRows)} rows
                  </span>
                  {filterSummary && (
                    <span className="rounded-full bg-zinc-200/70 px-2.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300">
                      {filterSummary}
                    </span>
                  )}
                  {isLargeExport && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-950/40 dark:border-amber-900/60 dark:text-amber-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                      Large Export (&gt;1,000 rows)
                    </span>
                  )}
                </div>
              </div>

              {/* Target File Name Preview */}
              <div className="text-right">
                <span className="block text-[11px] font-medium text-zinc-400">
                  Target File Name
                </span>
                <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 break-all">
                  {generatedFileName}
                </span>
              </div>
            </div>
          </div>

          {/* Export Mode Selection for Large Exports */}
          {isLargeExport && (
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4 dark:border-sky-950 dark:bg-sky-950/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-sky-950 dark:text-sky-200 uppercase tracking-wider">
                    Large Dataset Processing Engine
                  </h4>
                  <p className="text-xs text-sky-800/80 dark:text-sky-300/80 mt-0.5">
                    For datasets over 1,000 records, progress indicator monitors paginated chunk streaming.
                  </p>
                </div>
                <div className="flex rounded-lg border border-sky-200 bg-white p-0.5 text-xs dark:border-sky-900 dark:bg-zinc-900">
                  <button
                    type="button"
                    onClick={() => setExportMode('client')}
                    className={`rounded-md px-3 py-1 font-medium transition-colors ${
                      exportMode === 'client'
                        ? 'bg-sky-500 text-white shadow-sm'
                        : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                    }`}
                  >
                    Paginated Stream
                  </button>
                  {onBackendExport && (
                    <button
                      type="button"
                      onClick={() => setExportMode('backend')}
                      className={`rounded-md px-3 py-1 font-medium transition-colors ${
                        exportMode === 'backend'
                          ? 'bg-sky-500 text-white shadow-sm'
                          : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400'
                      }`}
                    >
                      Backend Export Job
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Column Selection Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                  Pick Columns to Export
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Select which transaction fields to include in your CSV
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-zinc-500 mr-1">
                  {selectedCount} of {columns.length} selected
                </span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  disabled={isExporting}
                  className="rounded px-2 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400 dark:hover:bg-sky-950/40"
                >
                  Select All
                </button>
                <span className="text-zinc-300 dark:text-zinc-700">|</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  disabled={isExporting}
                  className="rounded px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {/* Column Checkboxes Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1 border border-zinc-200 rounded-xl dark:border-zinc-800">
              {columns.map((col) => (
                <label
                  key={String(col.key)}
                  className={`flex items-center gap-3 rounded-lg border p-2.5 cursor-pointer text-xs font-medium transition-all ${
                    col.selected
                      ? 'border-sky-500/40 bg-sky-50/50 text-zinc-900 dark:bg-sky-950/20 dark:border-sky-800/60 dark:text-white'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-400'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={col.selected}
                    disabled={isExporting}
                    onChange={() => handleToggleColumn(col.key)}
                    className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 dark:border-zinc-700"
                  />
                  <span className="truncate">{col.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Progress Indicator for Export Process */}
          {isExporting && progress && (
            <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-4 dark:border-sky-900/50 dark:bg-sky-950/30 space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="flex items-center gap-2 text-sky-950 dark:text-sky-200">
                  <svg
                    className="h-4 w-4 animate-spin text-sky-600 dark:text-sky-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {progress.message || 'Export in progress...'}
                </span>
                <span className="font-mono text-sky-700 dark:text-sky-300">
                  {progress.percentage}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 w-full overflow-hidden rounded-full bg-sky-200/60 dark:bg-sky-950">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#55C2FF] to-sky-600 transition-all duration-300"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>

              {/* Row Stats */}
              <div className="flex items-center justify-between text-[11px] text-sky-800/80 dark:text-sky-400">
                <span>
                  Processed {f.number(progress.current)} /{' '}
                  {f.number(progress.total)} rows
                </span>
                {progress.totalBatches > 1 && (
                  <span>
                    Batch {progress.batchIndex} of {progress.totalBatches}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 border-t border-zinc-200 px-6 py-4 bg-zinc-50/50 rounded-b-2xl dark:border-zinc-800 dark:bg-zinc-900/50">
          {isExporting ? (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
            >
              Cancel Export
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleStartExport}
                disabled={selectedCount === 0 || totalRows === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-[#000F24] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[#55C2FF] dark:text-black dark:hover:bg-[#A5D4FF]"
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
                Export {selectedCount > 0 ? `(${selectedCount} columns)` : ''}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
