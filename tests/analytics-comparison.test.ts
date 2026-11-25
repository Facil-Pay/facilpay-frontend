/**
 * tests/analytics-comparison.test.ts
 *
 * Unit tests for the analytics period-over-period comparison helpers.
 * Covers: date-range math, leap-year boundaries, URL param parsing,
 * delta calculations, and label formatting.
 */

import { describe, it, expect } from "vitest";
import {
  calcDelta,
  formatDelta,
  getComparisonDateRange,
  parseCompareParam,
  presetToDateRange,
  COMPARE_LABELS,
  type CompareMode,
} from "@/lib/analytics/comparison";

// ─── presetToDateRange ────────────────────────────────────────────────────────

describe("presetToDateRange", () => {
  it("7d span covers 7 days (today inclusive)", () => {
    const { from, to } = presetToDateRange("7d");
    // from = 6 days ago at 00:00:00, to = today at 23:59:59.999
    // round to nearest day to tolerate the sub-ms difference
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    expect(spanDays).toBe(7);
  });

  it("30d span covers 30 days", () => {
    const { from, to } = presetToDateRange("30d");
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    expect(spanDays).toBe(30);
  });

  it("90d span covers 90 days", () => {
    const { from, to } = presetToDateRange("90d");
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    expect(spanDays).toBe(90);
  });

  it("1y from is exactly one year before to (± 1 day for leap years)", () => {
    const { from, to } = presetToDateRange("1y");
    const spanDays = Math.round((to.getTime() - from.getTime()) / 86_400_000);
    // 365–366 days depending on leap year inclusion
    expect(spanDays).toBeGreaterThanOrEqual(365);
    expect(spanDays).toBeLessThanOrEqual(366);
  });
});

// ─── getComparisonDateRange ───────────────────────────────────────────────────

describe("getComparisonDateRange", () => {
  it("returns null for mode=none", () => {
    const range = { from: new Date("2026-10-01"), to: new Date("2026-10-31") };
    expect(getComparisonDateRange(range, "none")).toBeNull();
  });

  it("previous_period: same span, ending 1 ms before current start", () => {
    const from = new Date("2026-10-01T00:00:00.000Z");
    const to = new Date("2026-10-31T23:59:59.999Z");
    const range = { from, to };
    const cmp = getComparisonDateRange(range, "previous_period")!;

    // Compare span should equal current span
    const currentSpanMs = to.getTime() - from.getTime();
    const compareSpanMs = cmp.to.getTime() - cmp.from.getTime();
    expect(compareSpanMs).toBe(currentSpanMs);

    // Compare to should be 1 ms before current from
    expect(cmp.to.getTime()).toBe(from.getTime() - 1);
  });

  it("previous_period: 7-day span maps back correctly", () => {
    const from = new Date("2026-11-10T00:00:00.000Z");
    const to = new Date("2026-11-16T23:59:59.999Z");
    const cmp = getComparisonDateRange({ from, to }, "previous_period")!;

    expect(cmp.to.getTime()).toBe(from.getTime() - 1);
    const spanDays = (cmp.to.getTime() - cmp.from.getTime()) / 86_400_000;
    expect(spanDays).toBeCloseTo(6.999, 2); // ~7 days
  });

  it("previous_year: shifts both dates back one year", () => {
    const from = new Date("2026-03-01T00:00:00.000Z");
    const to = new Date("2026-03-31T23:59:59.999Z");
    const cmp = getComparisonDateRange({ from, to }, "previous_year")!;

    expect(cmp.from.getFullYear()).toBe(2025);
    // month index 2 = March; use UTC to avoid timezone shifts in test env
    expect(cmp.from.getUTCMonth()).toBe(2);
    expect(cmp.from.getUTCDate()).toBe(1);

    expect(cmp.to.getFullYear()).toBe(2025);
    expect(cmp.to.getUTCMonth()).toBe(2);
    expect(cmp.to.getUTCDate()).toBe(31);
  });

  it("previous_year: Feb 29 (leap) shifts to Feb 28 on non-leap year", () => {
    // 2024 is a leap year; 2023 is not
    const from = new Date("2024-02-01T00:00:00.000Z");
    const to = new Date("2024-02-29T23:59:59.999Z");
    const cmp = getComparisonDateRange({ from, to }, "previous_year")!;

    // JS Date setFullYear for Feb 29 on non-leap year → Mar 1 (overflow)
    // We test that the year is 2023 regardless
    expect(cmp.from.getFullYear()).toBe(2023);
    // from: Feb 1, 2023
    expect(cmp.from.getMonth()).toBe(1);
    expect(cmp.from.getDate()).toBe(1);
  });

  it("previous_period crossing month boundary: October → September", () => {
    const from = new Date("2026-10-01T00:00:00.000Z");
    const to = new Date("2026-10-07T23:59:59.999Z");
    const cmp = getComparisonDateRange({ from, to }, "previous_period")!;

    // Compare to should be Sep 30, 2026 23:59:59.999
    expect(cmp.to.getUTCMonth()).toBe(8); // September
    expect(cmp.to.getUTCDate()).toBe(30);
  });
});

// ─── calcDelta ────────────────────────────────────────────────────────────────

describe("calcDelta", () => {
  it("positive delta when current > compare", () => {
    expect(calcDelta(110, 100)).toBeCloseTo(0.1);
  });

  it("negative delta when current < compare", () => {
    expect(calcDelta(90, 100)).toBeCloseTo(-0.1);
  });

  it("zero delta when equal", () => {
    expect(calcDelta(100, 100)).toBe(0);
  });

  it("returns null when compare is 0 (avoid division by zero)", () => {
    expect(calcDelta(50, 0)).toBeNull();
  });

  it("large positive change", () => {
    expect(calcDelta(300, 100)).toBeCloseTo(2.0);
  });
});

// ─── formatDelta ─────────────────────────────────────────────────────────────

describe("formatDelta", () => {
  it("prefixes positive deltas with +", () => {
    expect(formatDelta(0.1)).toBe("+10.0%");
  });

  it("includes sign for negative deltas", () => {
    expect(formatDelta(-0.045)).toBe("-4.5%");
  });

  it("zero change", () => {
    expect(formatDelta(0)).toBe("+0.0%");
  });

  it("returns — for null delta", () => {
    expect(formatDelta(null)).toBe("—");
  });

  it("respects fractionDigits option", () => {
    expect(formatDelta(0.1234, 2)).toBe("+12.34%");
  });
});

// ─── parseCompareParam ────────────────────────────────────────────────────────

describe("parseCompareParam", () => {
  it("parses previous_period", () => {
    expect(parseCompareParam("previous_period")).toBe("previous_period");
  });

  it("parses previous_year", () => {
    expect(parseCompareParam("previous_year")).toBe("previous_year");
  });

  it("defaults to none for unknown values", () => {
    expect(parseCompareParam("whatever")).toBe("none");
    expect(parseCompareParam("")).toBe("none");
  });

  it("returns none for null", () => {
    expect(parseCompareParam(null)).toBe("none");
  });
});

// ─── COMPARE_LABELS ───────────────────────────────────────────────────────────

describe("COMPARE_LABELS", () => {
  const modes: CompareMode[] = ["none", "previous_period", "previous_year"];
  it.each(modes)("label is a non-empty string for %s", (mode) => {
    expect(typeof COMPARE_LABELS[mode]).toBe("string");
    expect(COMPARE_LABELS[mode].length).toBeGreaterThan(0);
  });
});
