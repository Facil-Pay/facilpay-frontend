"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe, Check } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { locales, type Locale } from "@/i18n/routing";

export const LOCALE_LABELS: Record<Locale, { label: string; flag: string }> = {
  en: { label: "English", flag: "🇺🇸" },
  es: { label: "Español", flag: "🇪🇸" },
  pt: { label: "Português", flag: "🇧🇷" },
  fr: { label: "Français", flag: "🇫🇷" },
};

interface LanguageSwitcherProps {
  variant?: "dropdown" | "select" | "buttons";
  className?: string;
}

export function LanguageSwitcher({ variant = "dropdown", className = "" }: LanguageSwitcherProps) {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("common");

  const changeLocale = (nextLocale: Locale) => {
    if (nextLocale === currentLocale) {
      setIsOpen(false);
      return;
    }

    // Persist to NEXT_LOCALE cookie for next-intl request resolution
    document.cookie = `NEXT_LOCALE=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;

    startTransition(() => {
      router.refresh();
      setIsOpen(false);
    });
  };

  if (variant === "select") {
    return (
      <select
        aria-label={t("language")}
        value={currentLocale}
        onChange={(e) => changeLocale(e.target.value as Locale)}
        disabled={isPending}
        className={`rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#20a7ee] focus:outline-none focus:ring-1 focus:ring-[#20a7ee] ${className}`}
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {LOCALE_LABELS[loc].flag} {LOCALE_LABELS[loc].label}
          </option>
        ))}
      </select>
    );
  }

  if (variant === "buttons") {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {locales.map((loc) => {
          const active = loc === currentLocale;
          return (
            <button
              key={loc}
              type="button"
              onClick={() => changeLocale(loc)}
              disabled={isPending}
              className={`flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition ${
                active
                  ? "border-[#20a7ee] bg-[#55C2FF]/10 text-zinc-900"
                  : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
              }`}
            >
              <span>{LOCALE_LABELS[loc].flag}</span>
              <span>{LOCALE_LABELS[loc].label}</span>
              {active && <Check className="h-4 w-4 text-[#20a7ee]" />}
            </button>
          );
        })}
      </div>
    );
  }

  // Default dropdown variant for TopBar
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        aria-expanded={isOpen}
        aria-label="Switch language"
        className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
      >
        <Globe className="h-3.5 w-3.5 text-zinc-500" />
        <span>{LOCALE_LABELS[currentLocale]?.flag || "🌐"}</span>
        <span className="hidden sm:inline font-mono uppercase">{currentLocale}</span>
      </button>

      {isOpen && (
        <>
          <div
            aria-hidden="true"
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div className="absolute right-0 mt-2 z-50 w-40 rounded-xl border border-zinc-200 bg-white py-1.5 shadow-lg animate-in fade-in zoom-in-95">
            <div className="px-3 py-1 text-[11px] font-semibold uppercase text-zinc-400">
              {t("language")}
            </div>
            {locales.map((loc) => {
              const active = loc === currentLocale;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => changeLocale(loc)}
                  className={`flex w-full items-center justify-between px-3 py-1.5 text-xs transition ${
                    active ? "bg-zinc-50 font-semibold text-[#20a7ee]" : "text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{LOCALE_LABELS[loc].flag}</span>
                    <span>{LOCALE_LABELS[loc].label}</span>
                  </span>
                  {active && <Check className="h-3.5 w-3.5 text-[#20a7ee]" />}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
