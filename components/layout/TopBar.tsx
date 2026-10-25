"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Menu, FlaskConical, Zap } from "lucide-react";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/components/ui/utils";
import { DASHBOARD_NAV_ITEMS } from "./nav-items";
import { useNetworkMode } from "@/lib/network-mode-context";

type StellarNetwork = "mainnet" | "testnet" | "futurenet";

function getConfiguredNetwork(): StellarNetwork {
  const value = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  return value === "mainnet" || value === "futurenet" ? value : "testnet";
}

function humanize(segment: string, translate: (key: string) => string): string {
  const navMatch = DASHBOARD_NAV_ITEMS.find((item) => item.href === `/${segment}`);
  if (navMatch) return translate(navMatch.label);
  return decodeURIComponent(segment)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function useBreadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    label: humanize(segment, t),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
}

export function NetworkBadge() {
  const t = useTranslations("shell");
  const network = getConfiguredNetwork();
  const isMainnet = network === "mainnet";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        isMainnet
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-amber-200 bg-amber-50 text-amber-800",
      )}
      title={t("connectedTo", { network })}
    >
      <span className={cn("h-2 w-2 rounded-full", isMainnet ? "bg-emerald-500" : "bg-amber-500")} aria-hidden="true" />
      {network.charAt(0).toUpperCase() + network.slice(1)}
    </span>
  );
}

export function NetworkModeToggle() {
  const { mode, toggleMode } = useNetworkMode();
  const t = useTranslations("shell");
  const isTestnet = mode === "testnet";
  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={isTestnet ? t("switchToLive") : t("switchToTest")}
      title={isTestnet ? t("switchToLive") : t("switchToTest")}
      className={cn(
        "hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        isTestnet
          ? "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100"
          : "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
      )}
    >
      {isTestnet ? (
        <FlaskConical className="h-3.5 w-3.5" aria-hidden="true" />
      ) : (
        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {isTestnet ? t("test") : t("live")}
    </button>
  );
}

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const crumbs = useBreadcrumbs();
  const tNavigation = useTranslations("navigation");
  const tShell = useTranslations("shell");
  const title = crumbs.at(-1)?.label ?? tShell("dashboard");

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label={tNavigation("open")}
        aria-controls="dashboard-sidebar"
        className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <nav aria-label={tNavigation("breadcrumb")} className="hidden sm:block">
          <ol className="flex items-center gap-1 text-xs text-zinc-500">
            {crumbs.map((crumb, index) => (
              <li key={crumb.href} className="flex min-w-0 items-center gap-1">
                {index > 0 && <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />}
                {index === crumbs.length - 1 ? (
                  <span aria-current="page" className="truncate">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="truncate hover:text-zinc-900">{crumb.label}</Link>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <h1 className="truncate text-base font-semibold text-zinc-900">{title}</h1>
      </div>

      <NetworkModeToggle />

      <NetworkBadge />

      <LanguageSwitcher variant="compact" id="topbar-language" className="hidden sm:inline-flex" />

      <NotificationBell />

      {/* Account menu — placeholder slot */}
      <button
        type="button"
        aria-label={tNavigation("account")}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#55C2FF]/40 bg-[#55C2FF]/20 text-xs font-bold text-[#000F24]"
      >
        M
      </button>
    </header>
  );
}
