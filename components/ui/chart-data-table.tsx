"use client";

import { useId, type ReactNode } from "react";
import { cn } from "./utils";

export interface ChartColumn<Row> {
  key: string;
  header: string;
  /** Renders a cell; defaults to String(row[key]) */
  cell?: (row: Row) => ReactNode;
  align?: "left" | "right";
}

interface ChartDataTableProps<Row> {
  /** Table caption, e.g. "Monthly revenue" */
  caption: string;
  columns: ChartColumn<Row>[];
  rows: Row[];
  /** Stable key for each row */
  rowKey: (row: Row, index: number) => string;
  className?: string;
}

/**
 * Text alternative for a chart: a disclosure that reveals the plotted data as
 * a real table. Screen-reader and keyboard users get the exact values, and
 * sighted users can check numbers without hovering.
 */
export function ChartDataTable<Row>({ caption, columns, rows, rowKey, className }: ChartDataTableProps<Row>) {
  if (rows.length === 0) return null;
  return (
    <details className={cn("group mt-3 text-xs", className)}>
      <summary className="inline-flex cursor-pointer select-none items-center gap-1 rounded font-medium text-sky-700 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 dark:text-sky-300">
        <span className="group-open:hidden">Show data table</span>
        <span className="hidden group-open:inline">Hide data table</span>
      </summary>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn("px-2 py-1.5 font-semibold", column.align === "right" && "text-right")}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={rowKey(row, index)} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
                {columns.map((column, colIndex) => {
                  const content = column.cell
                    ? column.cell(row)
                    : String((row as Record<string, unknown>)[column.key] ?? "");
                  const Cell = colIndex === 0 ? "th" : "td";
                  return (
                    <Cell
                      key={column.key}
                      scope={colIndex === 0 ? "row" : undefined}
                      className={cn(
                        "px-2 py-1.5 tabular-nums text-zinc-800 dark:text-zinc-200",
                        colIndex === 0 && "font-medium",
                        column.align === "right" && "text-right",
                      )}
                    >
                      {content}
                    </Cell>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/** Generates an id pair so a chart can point at its text summary. */
export function useChartSummaryId(): string {
  return `chart-summary-${useId().replace(/:/g, "")}`;
}
