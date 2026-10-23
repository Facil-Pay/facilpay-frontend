import { cookies } from "next/headers";
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_TIME_ZONE, LOCALE_COOKIE, TIME_ZONE_COOKIE, isValidTimeZone } from "@/lib/i18n/preferences";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const cookieStore = await cookies();

  // A `[locale]` segment wins; un-prefixed routes (the dashboard) fall back to
  // the language the merchant picked in Preferences or the top bar.
  const requested = (await requestLocale) ?? cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const storedTimeZone = cookieStore.get(TIME_ZONE_COOKIE)?.value;
  const timeZone = isValidTimeZone(storedTimeZone) ? storedTimeZone : DEFAULT_TIME_ZONE;

  let messages;
  try {
    messages = (await import(`../messages/${locale}.json`)).default;
  } catch {
    messages = (await import("../messages/en.json")).default;
  }

  return { locale, timeZone, messages };
});
