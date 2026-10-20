/**
 * lib/i18n/use-format.ts
 *
 * Binds the formatters in ./format to the active locale and the time zone
 * chosen in Preferences. Works in client components and in non-async server
 * components (next-intl resolves both from the request config).
 *
 *   const f = useFormat();
 *   f.amount(1250, "USDC")       → "1.250,00 USDC" (es)
 *   f.dateTime(payment.createdAt) → "20 oct 2026, 14:45" (es, Europe/Madrid)
 */

import { useLocale, useTimeZone } from "next-intl";
import {
  formatAmount,
  formatDate,
  formatDateTime,
  formatDateWith,
  formatFiat,
  formatFileSize,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTime,
  type DateContext,
  type DateInput,
  type FormatAmountOptions,
  type FormatFiatOptions,
  type FormatPercentOptions,
} from "./format";

export interface Formatters {
  locale: string;
  timeZone: string | undefined;
  amount: (value: number | string, asset: string, options?: FormatAmountOptions) => string;
  fiat: (value: number | string, currency?: string, options?: FormatFiatOptions) => string;
  number: (value: number | string, options?: Intl.NumberFormatOptions) => string;
  percent: (ratio: number, options?: FormatPercentOptions) => string;
  fileSize: (bytes: number) => string;
  date: (value: DateInput | null | undefined) => string;
  dateTime: (value: DateInput | null | undefined) => string;
  time: (value: DateInput | null | undefined, withSeconds?: boolean) => string;
  dateWith: (value: DateInput | null | undefined, options: Intl.DateTimeFormatOptions) => string;
  relative: (value: DateInput | null | undefined, now?: DateInput) => string;
}

export function createFormatters(ctx: DateContext): Formatters {
  const { locale, timeZone } = ctx;
  return {
    locale,
    timeZone,
    amount: (value, asset, options) => formatAmount(value, asset, locale, options),
    fiat: (value, currency = "USD", options) => formatFiat(value, currency, locale, options),
    number: (value, options) => formatNumber(value, locale, options),
    percent: (ratio, options) => formatPercent(ratio, locale, options),
    fileSize: (bytes) => formatFileSize(bytes, locale),
    date: (value) => formatDate(value, ctx),
    dateTime: (value) => formatDateTime(value, ctx),
    time: (value, withSeconds) => formatTime(value, ctx, withSeconds),
    dateWith: (value, options) => formatDateWith(value, ctx, options),
    relative: (value, now) => formatRelativeTime(value, locale, now),
  };
}

export function useFormat(): Formatters {
  const locale = useLocale();
  const timeZone = useTimeZone();
  return createFormatters({ locale, timeZone });
}
