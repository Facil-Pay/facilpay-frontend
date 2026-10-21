import { defineRouting } from "next-intl/routing";

export const locales = ["en", "es", "pt", "fr"] as const;
export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "never",
});