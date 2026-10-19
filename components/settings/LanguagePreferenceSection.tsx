"use client";

import { useTranslations } from "next-intl";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export function LanguagePreferenceSection() {
  const tSettings = useTranslations("settings");

  return (
    <div className="mt-8 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="border-b border-zinc-100 pb-4">
        <h3 className="text-base font-semibold text-zinc-900">{tSettings("languageTitle")}</h3>
        <p className="mt-1 text-sm text-zinc-500">{tSettings("languageDescription")}</p>
      </div>

      <div className="mt-5">
        <LanguageSwitcher variant="buttons" />
      </div>
    </div>
  );
}
