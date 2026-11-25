/**
 * lib/types/export.ts
 *
 * CSV export column definitions and progress reporting.
 */

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  selected: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  formatter?: (value: any, item: T) => string;
}

export interface ExportProgress {
  current: number;
  total: number;
  percentage: number;
  batchIndex: number;
  totalBatches: number;
  status: "idle" | "fetching" | "processing" | "generating" | "completed" | "cancelled" | "error";
  message?: string;
}
