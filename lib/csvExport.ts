import { ExportColumn, ExportProgress } from '@/lib/types';

/**
 * Escapes a single CSV value according to RFC 4180 specifications:
 * - If the value contains commas, double quotes, or newlines, it must be enclosed in double quotes.
 * - Any double quote character inside the value must be escaped by preceding it with another double quote.
 * - Null or undefined values are represented as empty strings.
 * - Dates are converted to ISO 8601 format.
 */
export function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  // Handle Dates
  if (value instanceof Date) {
    return value.toISOString();
  }

  // Check if string is already an ISO date or date-like string
  if (typeof value === 'string' && isIsoDateString(value)) {
    return value;
  }

  const str = String(value);

  // Check if escaping is required
  const requiresQuotes =
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (requiresQuotes) {
    // Escape all double quotes by doubling them
    const escapedStr = str.replace(/"/g, '""');
    return `"${escapedStr}"`;
  }

  return str;
}

/**
 * Helper to test if a string represents an ISO 8601 date.
 */
export function isIsoDateString(str: string): boolean {
  // Matches standard ISO 8601 formats like 2026-01-15T14:32:00.000Z or 2026-01-15
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/.test(str);
}

/**
 * Formats any date input into a clean ISO 8601 string.
 */
export function formatToIso8601(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toISOString();
  } catch {
    return String(dateInput);
  }
}

/**
 * Generates a standard CSV string from a dataset and selected columns.
 * Prepends UTF-8 BOM so spreadsheet editors (Excel, Numbers) open UTF-8 correctly.
 */
export function generateCsv<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  const selectedColumns = columns.filter((col) => col.selected);

  if (selectedColumns.length === 0) {
    return '';
  }

  // Generate Header Row
  const headerRow = selectedColumns
    .map((col) => escapeCsvField(col.label))
    .join(',');

  // Generate Data Rows
  const dataRows = data.map((item) => {
    return selectedColumns
      .map((col) => {
        const rawValue = item[col.key as keyof T];
        const formattedValue = col.formatter
          ? col.formatter(rawValue, item)
          : rawValue;
        return escapeCsvField(formattedValue);
      })
      .join(',');
  });

  // RFC 4180 standard CRLF row delimiters
  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Formats a date into YYYY-MM-DD
 */
export function formatDateYmd(date: Date | string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'unknown';
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return 'unknown';
  }
}

/**
 * Generates the standardized export file name:
 * Format: facilpay-<type>-<startDate>_<endDate>.csv
 * Example: facilpay-payments-2026-01-01_2026-01-31.csv
 */
export function generateExportFileName<T extends { date?: string }>(
  type: 'payments' | 'refunds' | 'payouts',
  filterStartDate?: string | null,
  filterEndDate?: string | null,
  data?: T[]
): string {
  let startStr = filterStartDate ? formatDateYmd(filterStartDate) : '';
  let endStr = filterEndDate ? formatDateYmd(filterEndDate) : '';

  // If no date range filter was explicitly selected, derive min and max from dataset
  if ((!startStr || !endStr) && data && data.length > 0) {
    const dates = data
      .map((d) => (d.date ? new Date(d.date).getTime() : NaN))
      .filter((t) => !isNaN(t));

    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      if (!startStr) startStr = formatDateYmd(minDate);
      if (!endStr) endStr = formatDateYmd(maxDate);
    }
  }

  // Fallback to today if still empty
  if (!startStr) {
    startStr = formatDateYmd(new Date());
  }
  if (!endStr) {
    endStr = startStr;
  }

  return `facilpay-${type}-${startStr}_${endStr}.csv`;
}

/**
 * Initiates a browser file download of CSV content with UTF-8 BOM.
 */
export function triggerCsvDownload(csvContent: string, fileName: string): void {
  // Prepend UTF-8 BOM (\uFEFF) so Excel and text editors properly identify UTF-8
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Handles large exports (>1,000 rows) with batching and progress reporting.
 * Can paginate through client-side data or an async data-fetching function.
 */
export async function exportWithProgress<T extends Record<string, any>>({
  type,
  data,
  columns,
  fetchBatch,
  totalRows,
  filterStartDate,
  filterEndDate,
  batchSize = 500,
  onProgress,
  isCancelled,
}: {
  type: 'payments' | 'refunds' | 'payouts';
  data?: T[];
  columns: ExportColumn<T>[];
  fetchBatch?: (page: number, limit: number) => Promise<{ items: T[]; total: number }>;
  totalRows?: number;
  filterStartDate?: string | null;
  filterEndDate?: string | null;
  batchSize?: number;
  onProgress: (progress: ExportProgress) => void;
  isCancelled?: () => boolean;
}): Promise<boolean> {
  const total = totalRows ?? (data ? data.length : 0);
  const totalBatches = Math.max(1, Math.ceil(total / batchSize));

  let accumulatedData: T[] = [];

  onProgress({
    current: 0,
    total,
    percentage: 0,
    batchIndex: 0,
    totalBatches,
    status: 'fetching',
    message: `Starting export for ${total.toLocaleString()} rows...`,
  });

  // Client-side batching
  if (data && data.length > 0) {
    for (let i = 0; i < totalBatches; i++) {
      if (isCancelled && isCancelled()) {
        onProgress({
          current: accumulatedData.length,
          total,
          percentage: Math.round((accumulatedData.length / total) * 100),
          batchIndex: i,
          totalBatches,
          status: 'cancelled',
          message: 'Export cancelled by user.',
        });
        return false;
      }

      const start = i * batchSize;
      const end = Math.min(start + batchSize, data.length);
      const chunk = data.slice(start, end);
      accumulatedData.push(...chunk);

      const current = accumulatedData.length;
      const percentage = Math.round((current / total) * 100);

      onProgress({
        current,
        total,
        percentage,
        batchIndex: i + 1,
        totalBatches,
        status: current === total ? 'generating' : 'processing',
        message:
          current === total
            ? 'Generating CSV file...'
            : `Processing batch ${i + 1} of ${totalBatches} (${current.toLocaleString()} / ${total.toLocaleString()} rows)...`,
      });

      // Small async delay to allow UI to update and render progress bar smoothly
      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  } else if (fetchBatch) {
    // Paginated async API loader
    for (let page = 1; page <= totalBatches; page++) {
      if (isCancelled && isCancelled()) {
        onProgress({
          current: accumulatedData.length,
          total,
          percentage: Math.round((accumulatedData.length / total) * 100),
          batchIndex: page - 1,
          totalBatches,
          status: 'cancelled',
          message: 'Export cancelled by user.',
        });
        return false;
      }

      const response = await fetchBatch(page, batchSize);
      accumulatedData.push(...response.items);

      const current = accumulatedData.length;
      const actualTotal = response.total || total;
      const percentage = Math.round((current / actualTotal) * 100);

      onProgress({
        current,
        total: actualTotal,
        percentage,
        batchIndex: page,
        totalBatches,
        status: current >= actualTotal ? 'generating' : 'fetching',
        message: `Fetched batch ${page} of ${totalBatches} (${current.toLocaleString()} / ${actualTotal.toLocaleString()} rows)...`,
      });

      await new Promise((resolve) => setTimeout(resolve, 60));
    }
  }

  // Generate CSV
  onProgress({
    current: accumulatedData.length,
    total,
    percentage: 100,
    batchIndex: totalBatches,
    totalBatches,
    status: 'generating',
    message: 'Compiling CSV and preparing download...',
  });

  await new Promise((resolve) => setTimeout(resolve, 100));

  const csvContent = generateCsv(accumulatedData, columns);
  const fileName = generateExportFileName(type, filterStartDate, filterEndDate, accumulatedData);

  triggerCsvDownload(csvContent, fileName);

  onProgress({
    current: accumulatedData.length,
    total,
    percentage: 100,
    batchIndex: totalBatches,
    totalBatches,
    status: 'completed',
    message: `Export successful! Downloaded ${fileName}`,
  });

  return true;
}
