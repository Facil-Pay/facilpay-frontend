/**
 * lib/i18n/preferences.ts
 *
 * Display preferences (language and time zone) shared by the server request
 * config and the client-side switchers.
 *
 * Both values live in cookies rather than localStorage so server components
 * format dates and pick messages exactly like the client does, with no
 * hydration mismatch. The locale cookie name matches next-intl's default, so
 * the middleware and the switcher agree on the persisted choice.
 */

import { locales, type Locale } from "@/i18n/routing";

export const LOCALE_COOKIE = "NEXT_LOCALE";
export const TIME_ZONE_COOKIE = "FACILPAY_TZ";
export const DEFAULT_TIME_ZONE = "UTC";

/** One year — preferences should outlive the session. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Native names, so a user can always find their own language. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
  pt: "Português",
  fr: "Français",
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value);
}

export function isValidTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value === "") return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/** The browser's zone, or undefined during SSR / when the runtime hides it. */
export function detectTimeZone(): string | undefined {
  if (typeof Intl === "undefined") return undefined;
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(zone) ? zone : undefined;
}

/** All IANA zones the runtime knows, falling back to a short list on old engines. */
export function supportedTimeZones(): string[] {
  const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "timeZone") => string[] };
  if (typeof intl.supportedValuesOf === "function") return intl.supportedValuesOf("timeZone");
  return [
    "UTC",
    "Africa/Lagos",
    "Africa/Nairobi",
    "America/Bogota",
    "America/Buenos_Aires",
    "America/Mexico_City",
    "America/New_York",
    "America/Sao_Paulo",
    "Asia/Singapore",
    "Europe/Lisbon",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Paris",
  ];
}

function writeCookie(name: string, value: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
}

export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.split("; ").find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

export function persistLocale(locale: Locale): void {
  writeCookie(LOCALE_COOKIE, locale);
}

export function persistTimeZone(timeZone: string): void {
  if (isValidTimeZone(timeZone)) writeCookie(TIME_ZONE_COOKIE, timeZone);
}
