/**
 * lib/i18n/format.ts
 *
 * Locale-aware formatting for amounts, numbers and dates.
 *
 * Every function is pure and takes the locale (and, for dates, the time zone)
 * explicitly so it can be used from server components, client components,
 * tests and plain modules alike. Components should normally go through
 * `useFormat()` (lib/i18n/use-format.ts), which binds the active locale and
 * the time zone chosen in Preferences.
 *
 * Intl formatters are relatively expensive to construct, so they are cached
 * per (locale, options) pair.
 */

// ─── Formatter cache ──────────────────────────────────────────────────────────

const numberFormatters = new Map<string, Intl.NumberFormat>();
const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const relativeFormatters = new Map<string, Intl.RelativeTimeFormat>();

function cached<T, O>(cache: Map<string, T>, locale: string, options: O, create: () => T): T {
  const key = `${locale}|${JSON.stringify(options)}`;
  let formatter = cache.get(key);
  if (!formatter) {
    formatter = create();
    cache.set(key, formatter);
  }
  return formatter;
}

function numberFormat(locale: string, options: Intl.NumberFormatOptions): Intl.NumberFormat {
  return cached(numberFormatters, locale, options, () => new Intl.NumberFormat(locale, options));
}

function dateFormat(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  return cached(dateFormatters, locale, options, () => new Intl.DateTimeFormat(locale, options));
}

function relativeFormat(locale: string, options: Intl.RelativeTimeFormatOptions): Intl.RelativeTimeFormat {
  return cached(relativeFormatters, locale, options, () => new Intl.RelativeTimeFormat(locale, options));
}

function toNumber(value: number | string): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ─── Assets ───────────────────────────────────────────────────────────────────

export interface AssetDecimals {
  minimumFractionDigits: number;
  maximumFractionDigits: number;
}

/**
 * Display precision per Stellar asset. XLM keeps its full 7-decimal ledger
 * precision (trailing zeros trimmed down to 2); fiat-backed stablecoins are
 * shown like cash.
 */
export const ASSET_DISPLAY_DECIMALS: Record<string, AssetDecimals> = {
  XLM: { minimumFractionDigits: 2, maximumFractionDigits: 7 },
  USDC: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  EURC: { minimumFractionDigits: 2, maximumFractionDigits: 2 },
};

/** Stellar amounts carry at most 7 decimal places. */
export const STELLAR_MAX_DECIMALS = 7;

const DEFAULT_ASSET_DECIMALS: AssetDecimals = { minimumFractionDigits: 2, maximumFractionDigits: STELLAR_MAX_DECIMALS };

export function assetDecimals(asset: string): AssetDecimals {
  return ASSET_DISPLAY_DECIMALS[asset.toUpperCase()] ?? DEFAULT_ASSET_DECIMALS;
}

export interface FormatAmountOptions {
  /** Append the asset code, e.g. "1,250.00 USDC". Default: true */
  withCode?: boolean;
  /** Use "+" for positive values, e.g. for credits in an activity feed */
  signDisplay?: Intl.NumberFormatOptions["signDisplay"];
}

/**
 * Formats a Stellar asset amount for display, respecting the asset's
 * display precision and the locale's grouping and decimal separators.
 *
 *   formatAmount(1250, "USDC", "en")    → "1,250.00 USDC"
 *   formatAmount(1250, "USDC", "fr")    → "1 250,00 USDC"
 *   formatAmount("0.1234567", "XLM", "es") → "0,1234567 XLM"
 */
export function formatAmount(
  value: number | string,
  asset: string,
  locale: string,
  { withCode = true, signDisplay }: FormatAmountOptions = {},
): string {
  const formatted = numberFormat(locale, { ...assetDecimals(asset), signDisplay }).format(toNumber(value));
  return withCode ? `${formatted} ${asset}` : formatted;
}

/**
 * Locale-independent decimal string for form inputs, query strings and
 * protocol payloads (SEP-7, Horizon). Never use this for display.
 *
 *   toDecimalString(12.5, 2) → "12.50"
 */
export function toDecimalString(value: number | string, decimals: number): string {
  return numberFormat("en-US", {
    useGrouping: false,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(toNumber(value));
}

/** Rounds to the given number of decimal places without going through a string. */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

// ─── Numbers, currency, percentages ───────────────────────────────────────────

export function formatNumber(value: number | string, locale: string, options: Intl.NumberFormatOptions = {}): string {
  return numberFormat(locale, options).format(toNumber(value));
}

export interface FormatFiatOptions {
  /** Use compact notation ("$1.2K", "1,2 k $") */
  compact?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/** Formats an ISO 4217 fiat value, e.g. a USD estimate. */
export function formatFiat(
  value: number | string,
  currency: string,
  locale: string,
  { compact = false, ...digits }: FormatFiatOptions = {},
): string {
  return numberFormat(locale, {
    style: "currency",
    currency,
    ...(compact ? { notation: "compact", maximumFractionDigits: 1 } : {}),
    ...digits,
  }).format(toNumber(value));
}

export interface FormatPercentOptions {
  /** Fraction digits; default 1 */
  digits?: number;
  signDisplay?: Intl.NumberFormatOptions["signDisplay"];
}

/**
 * Formats a ratio as a percentage: `formatPercent(0.123, "en")` → "12.3%".
 * Pass values already in 0–100 through `/ 100` first.
 */
export function formatPercent(ratio: number, locale: string, { digits = 1, signDisplay }: FormatPercentOptions = {}): string {
  return numberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    signDisplay,
  }).format(Number.isFinite(ratio) ? ratio : 0);
}

const BYTE_UNITS = ["byte", "kilobyte", "megabyte", "gigabyte"] as const;

/** Formats a byte count with the largest sensible unit: "1.25 MB". */
export function formatFileSize(bytes: number, locale: string): string {
  let value = Math.max(0, bytes);
  let unit = 0;
  while (value >= 1024 && unit < BYTE_UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return numberFormat(locale, {
    style: "unit",
    unit: BYTE_UNITS[unit],
    unitDisplay: "short",
    maximumFractionDigits: unit === 0 ? 0 : 2,
  }).format(value);
}

// ─── Dates ────────────────────────────────────────────────────────────────────

export type DateInput = Date | string | number;

export interface DateContext {
  locale: string;
  /** IANA time zone, e.g. "Africa/Lagos". Falls back to the runtime zone. */
  timeZone?: string;
}

function toDate(value: DateInput): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Formats a date with arbitrary Intl options in the user's time zone.
 * Returns an em dash for missing or invalid input rather than "Invalid Date".
 */
export function formatDateWith(
  value: DateInput | null | undefined,
  { locale, timeZone }: DateContext,
  options: Intl.DateTimeFormatOptions,
): string {
  if (value == null || value === "") return "—";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormat(locale, { ...options, timeZone }).format(date);
}

/** "Oct 20, 2026" */
export function formatDate(value: DateInput | null | undefined, ctx: DateContext): string {
  return formatDateWith(value, ctx, { dateStyle: "medium" });
}

/** "Oct 20, 2026, 2:45 PM" */
export function formatDateTime(value: DateInput | null | undefined, ctx: DateContext): string {
  return formatDateWith(value, ctx, { dateStyle: "medium", timeStyle: "short" });
}

/** "2:45 PM" */
export function formatTime(value: DateInput | null | undefined, ctx: DateContext, withSeconds = false): string {
  return formatDateWith(value, ctx, { timeStyle: withSeconds ? "medium" : "short" });
}

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 365 * 24 * 3600],
  ["month", 30 * 24 * 3600],
  ["week", 7 * 24 * 3600],
  ["day", 24 * 3600],
  ["hour", 3600],
  ["minute", 60],
  ["second", 1],
];

/**
 * "3 minutes ago", "in 2 days", "yesterday" — picks the largest whole unit.
 * Relative phrases do not depend on the time zone, only on the locale.
 */
export function formatRelativeTime(
  value: DateInput | null | undefined,
  locale: string,
  now: DateInput = Date.now(),
): string {
  if (value == null || value === "") return "—";
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "—";

  const diffSeconds = (date.getTime() - toDate(now).getTime()) / 1000;
  const formatter = relativeFormat(locale, { numeric: "auto" });
  for (const [unit, seconds] of RELATIVE_UNITS) {
    if (Math.abs(diffSeconds) >= seconds || unit === "second") {
      return formatter.format(Math.round(diffSeconds / seconds), unit);
    }
  }
  return formatter.format(0, "second");
}
