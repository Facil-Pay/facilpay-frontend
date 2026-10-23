"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Can } from "@/components/auth/Can";
import { cn } from "@/components/ui/utils";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations("settings");
  const tabs = [
    { href: "/settings/profile", label: t("businessProfile") },
    { href: "/settings/branding", label: t("branding") },
    { href: "/settings/preferences", label: t("paymentPreferences") },
    { href: "/settings/security", label: t("security") },
    { href: "/settings/team", label: t("team") },
    { href: "/settings/notifications", label: t("notifications") },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">{t("title")}</h2>
        <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
      </div>

      <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-zinc-200">
          {tabs.map((tab) => {
            const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
            return (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px inline-block border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-[#20a7ee] text-zinc-900"
                      : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800",
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
          <Can permission="team:manage">
            <li>
              <Link
                href="/settings/audit-log"
                aria-current={pathname === "/settings/audit-log" ? "page" : undefined}
                className={cn(
                  "-mb-px inline-block border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/settings/audit-log"
                    ? "border-[#20a7ee] text-zinc-900"
                    : "border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-800",
                )}
              >
                {t("auditLog")}
              </Link>
            </li>
          </Can>
        </ul>
      </nav>

      {children}
    </div>
  );
}
