/**
 * lib/analytics/comparison.ts
 *
 * Comparison mode types and date-range calculation helpers for
 * period-over-period analytics comparisons.
 */

export type CompareMode = "none" | "previous_period" | "previous_year";

export interface DateRange {
  from: Date;
  to: Date;
}

export type RangePreset = "7d" | "30d" | "90d" | "1y";

/** Map a preset to its current-period DateRange (ending today). */
export function presetToDateRange(preset: RangePreset): DateRange {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date(to);
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case "7d":
      from.setDate(from.getDate() - 6);
      break;
    case "30d":
      from.setDate(from.getDate() - 29);
      break;
    case "90d":
      from.setDate(from.getDate() - 89);
      break;
    case "1y":
      from.setFullYear(from.getFullYear() - 1);
      from.setDate(from.getDate() + 1);
      break;
  }

  return { from, to };
}

/**
 * Given a current date range and a comparison mode, return the
 * comparison date range.
 *
 * - `previous_period`: same number of days, ending the day before `range.from`.
 * - `previous_year`: same day-of-year span, one year earlier (handles leap years).
 */
export function getComparisonDateRange(
  range: DateRange,
  mode: CompareMode,
): DateRange | null {
  if (mode === "none") return null;

  const spanMs = range.to.getTime() - range.from.getTime();

  if (mode === "previous_period") {
    const toMs = range.from.getTime() - 1; // 1 ms before current start
    const fromMs = toMs - spanMs;
    return {
      from: new Date(fromMs),
      to: new Date(toMs),
    };
  }

  // previous_year: shift both endpoints back exactly one year
  const shiftYear = (d: Date): Date => {
    const shifted = new Date(d);
    shifted.setFullYear(shifted.getFullYear() - 1);
    return shifted;
  };

  return {
    from: shiftYear(range.from),
    to: shiftYear(range.to),
  };
}

/**
 * Calculate the percentage delta between current and comparison values.
 * Returns null when comparison is 0 (division by zero).
 */
export function calcDelta(current: number, compare: number): number | null {
  if (compare === 0) return null;
  return (current - compare) / compare;
}

/**
 * Format a delta as a signed percentage string (e.g. "+12.3%" / "-4.5%").
 * Returns "—" when delta is null.
 */
export function formatDelta(delta: number | null, fractionDigits = 1): string {
  if (delta === null) return "—";
  const pct = (delta * 100).toFixed(fractionDigits);
  return delta >= 0 ? `+${pct}%` : `${pct}%`;
}

/** Human-readable label for a CompareMode value. */
export const COMPARE_LABELS: Record<CompareMode, string> = {
  none: "None",
  previous_period: "Previous period",
  previous_year: "Previous year",
};

/** URL param value → CompareMode (defaults to "none" for unknown values). */
export function parseCompareParam(value: string | null): CompareMode {
  if (value === "previous_period" || value === "previous_year") return value;
  return "none";
}
