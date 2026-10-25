"use client";

import { useMemo, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useNow, useTimeZone, useTranslations } from "next-intl";
import { LocateFixed, Loader2 } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useToast } from "@/components/ui/toast";
import { detectTimeZone, persistTimeZone, supportedTimeZones } from "@/lib/i18n/preferences";
import { useFormat } from "@/lib/i18n/use-format";
import { Field, SettingsSection, fieldInputClass } from "./form-fields";

const subscribeNever = () => () => {};

/** Language and time zone. Applied immediately — there is nothing to "save". */
export function RegionalPreferencesForm() {
  const t = useTranslations("settings");
  const toast = useToast();
  const router = useRouter();
  const f = useFormat();
  const now = useNow();
  const timeZone = useTimeZone() ?? "UTC";
  const [isPending, startTransition] = useTransition();

  // The device zone is only knowable on the client; render nothing for it during SSR.
  const deviceTimeZone = useSyncExternalStore(subscribeNever, detectTimeZone, () => undefined);

  const zones = useMemo(() => {
    const all = supportedTimeZones();
    return all.includes(timeZone) ? all : [timeZone, ...all];
  }, [timeZone]);

  const applyTimeZone = (zone: string) => {
    if (zone === timeZone) return;
    persistTimeZone(zone);
    startTransition(() => router.refresh());
    toast(t("timeZoneSaved"), "success");
  };

  return (
    <SettingsSection title={t("regionalTitle")} description={t("regionalDescription")}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field id="preferences-language" label={t("languageTitle")} hint={t("languageDescription")}>
          <LanguageSwitcher id="preferences-language" withLabel={false} className="w-full" />
        </Field>

        <Field id="preferences-time-zone" label={t("timeZoneTitle")} hint={t("timeZoneDescription")}>
          <div className="flex gap-2">
            <select
              id="preferences-time-zone"
              value={timeZone}
              disabled={isPending}
              onChange={(event) => applyTimeZone(event.target.value)}
              className={fieldInputClass}
            >
              {zones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {isPending && <Loader2 className="h-4 w-4 shrink-0 animate-spin self-center text-zinc-400" aria-hidden="true" />}
          </div>
          {deviceTimeZone && deviceTimeZone !== timeZone && (
            <button
              type="button"
              onClick={() => applyTimeZone(deviceTimeZone)}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-sky-700 hover:text-sky-900"
            >
              <LocateFixed className="h-3.5 w-3.5" aria-hidden="true" />
              {t("useBrowserTimeZone", { zone: deviceTimeZone.replace(/_/g, " ") })}
            </button>
          )}
        </Field>
      </div>

      <div className="mt-5 rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">{t("preview")}</span>
        <span className="tabular-nums">
          {f.dateTime(now)} · {f.amount(1250, "USDC")} · {f.amount(0.5, "XLM")}
        </span>
      </div>
    </SettingsSection>
  );
}
