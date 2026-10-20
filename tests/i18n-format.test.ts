import { describe, expect, it } from "vitest";
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatFiat,
  formatPercent,
  formatRelativeTime,
  roundTo,
  toDecimalString,
} from "../lib/i18n/format";

// Intl uses narrow/regular no-break spaces in some locales; normalise for readable assertions.
const plain = (value: string) => value.replace(/[  ]/g, " ");

describe("formatAmount", () => {
  it("formats USDC with two decimals in each locale", () => {
    expect(formatAmount(1250, "USDC", "en")).toBe("1,250.00 USDC");
    expect(formatAmount(1250, "USDC", "es")).toBe("1250,00 USDC");
    expect(formatAmount(12500, "USDC", "pt")).toBe("12.500,00 USDC");
    expect(plain(formatAmount(1250, "USDC", "fr"))).toBe("1 250,00 USDC");
  });

  it("keeps up to seven decimals for XLM", () => {
    expect(formatAmount("0.1234567", "XLM", "en")).toBe("0.1234567 XLM");
    expect(formatAmount(5, "XLM", "en")).toBe("5.00 XLM");
  });

  it("rounds USDC to cents", () => {
    expect(formatAmount(0.125, "USDC", "en", { withCode: false })).toBe("0.13");
  });

  it("can omit the code and force a sign", () => {
    expect(formatAmount(10, "USDC", "en", { withCode: false, signDisplay: "always" })).toBe("+10.00");
  });

  it("treats unparseable input as zero instead of NaN", () => {
    expect(formatAmount("not a number", "USDC", "en")).toBe("0.00 USDC");
  });
});

describe("toDecimalString", () => {
  it("is locale independent and ungrouped", () => {
    expect(toDecimalString(12345.5, 2)).toBe("12345.50");
    expect(toDecimalString("1.23456789", 7)).toBe("1.2345679");
  });
});

describe("roundTo", () => {
  it("rounds half away from zero at the given precision", () => {
    expect(roundTo(1.005, 2)).toBe(1.01);
    expect(roundTo(2.5000001, 7)).toBe(2.5000001);
  });
});

describe("formatFiat / formatPercent", () => {
  it("uses the locale's currency layout", () => {
    expect(formatFiat(1250, "USD", "en")).toBe("$1,250.00");
    expect(plain(formatFiat(1250, "USD", "fr"))).toBe("1 250,00 $US");
  });

  it("formats ratios as percentages", () => {
    expect(formatPercent(0.1234, "en")).toBe("12.3%");
    expect(plain(formatPercent(0.1234, "fr"))).toBe("12,3 %");
    expect(formatPercent(0.05, "en", { signDisplay: "exceptZero" })).toBe("+5.0%");
  });
});

describe("dates", () => {
  const iso = "2026-10-20T23:30:00Z";

  it("respects the selected time zone", () => {
    expect(formatDate(iso, { locale: "en", timeZone: "UTC" })).toBe("Oct 20, 2026");
    expect(formatDate(iso, { locale: "en", timeZone: "Africa/Lagos" })).toBe("Oct 21, 2026");
  });

  it("follows the locale", () => {
    expect(plain(formatDateTime(iso, { locale: "fr", timeZone: "UTC" }))).toBe("20 oct. 2026, 23:30");
  });

  it("returns an em dash for missing or invalid input", () => {
    expect(formatDate(undefined, { locale: "en" })).toBe("—");
    expect(formatDate("garbage", { locale: "en" })).toBe("—");
  });
});

describe("formatRelativeTime", () => {
  const now = new Date("2026-10-20T12:00:00Z");

  it("picks the largest whole unit", () => {
    expect(formatRelativeTime("2026-10-20T11:57:00Z", "en", now)).toBe("3 minutes ago");
    expect(formatRelativeTime("2026-10-22T12:00:00Z", "en", now)).toBe("in 2 days");
    expect(formatRelativeTime("2026-10-19T12:00:00Z", "es", now)).toBe("ayer");
  });
});
