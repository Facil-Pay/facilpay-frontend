"use client";

import { useTransition, type ChangeEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Languages, Loader2 } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { locales } from "@/i18n/routing";
import { LOCALE_LABELS, isLocale, persistLocale } from "@/lib/i18n/preferences";

interface LanguageSwitcherProps {
  /** "compact" renders an icon-only trigger for the top bar */
  variant?: "default" | "compact";
  id?: string;
  /** Set false when the caller renders its own <label htmlFor={id}> */
  withLabel?: boolean;
  className?: string;
}

/**
 * Persists the chosen language in the locale cookie, then re-renders. Routes
 * under `/[locale]/…` are rewritten to the new prefix; un-prefixed dashboard
 * routes simply refresh and pick the cookie up in i18n/request.ts.
 */
export function LanguageSwitcher({
  variant = "default",
  id = "language-switcher",
  withLabel = true,
  className,
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const compact = variant === "compact";

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (!isLocale(next) || next === locale) return;

    persistLocale(next);
    const segments = pathname.split("/");
    startTransition(() => {
      if (isLocale(segments[1])) {
        segments[1] = next;
        router.replace(`${segments.join("/")}${window.location.search}`);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className={cn("relative inline-flex items-center", className)}>
      {withLabel && (
        <label htmlFor={id} className={compact ? "sr-only" : "mr-2 text-sm font-medium text-zinc-800"}>
          {t("language")}
        </label>
      )}
      {compact && (
        <span className="pointer-events-none absolute left-2 text-zinc-500" aria-hidden="true">
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Languages className="h-3.5 w-3.5" />}
        </span>
      )}
      <select
        id={id}
        value={locale}
        onChange={handleChange}
        disabled={isPending}
        aria-busy={isPending || undefined}
        className={cn(
          "rounded-lg border border-zinc-200 bg-white text-zinc-800 hover:bg-zinc-50 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:opacity-60",
          compact ? "h-8 py-0 pl-7 pr-2 text-xs font-medium uppercase" : "w-full px-3 py-2 text-sm",
        )}
      >
        {locales.map((code) => (
          <option key={code} value={code} lang={code}>
            {compact ? code.toUpperCase() : LOCALE_LABELS[code]}
          </option>
        ))}
      </select>
    </div>
  );
}
