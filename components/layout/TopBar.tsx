"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight, Menu, FlaskConical, Search, Zap } from "lucide-react";
import { useCommandPalette } from "@/components/command-palette/CommandPalette";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { cn } from "@/components/ui/utils";
import { DASHBOARD_NAV_ITEMS } from "./nav-items";
import { useNetworkMode } from "@/lib/network-mode-context";
import { fetchHorizonStatus, type HorizonNetworkStatus } from "@/lib/stellar/horizon";

type StellarNetwork = "mainnet" | "testnet" | "futurenet";

const POLL_INTERVAL_MS = 30_000; // 30 seconds
const STELLAR_STATUS_PAGE = "https://status.stellar.org";

function getConfiguredNetwork(): StellarNetwork {
  const value = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  return value === "mainnet" || value === "futurenet" ? value : "testnet";
}

// ─── Horizon Status Hook (#123) ───────────────────────────────────────────────

function useHorizonStatus(): HorizonNetworkStatus | null {
  const [status, setStatus] = useState<HorizonNetworkStatus | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const poll = useCallback(async () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const result = await fetchHorizonStatus();
    setStatus(result);
  }, []);

  useEffect(() => {
    poll();
    intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        poll();
        if (!intervalRef.current) {
          intervalRef.current = setInterval(poll, POLL_INTERVAL_MS);
        }
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [poll]);

  return status;
}

// ─── Horizon Status Indicator (#123) ─────────────────────────────────────────

export function HorizonStatusIndicator() {
  const networkStatus = useHorizonStatus();
  const network = getConfiguredNetwork();

  if (!networkStatus) {
    // Show neutral dot while loading
    return (
      <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-500">
        <span className="h-2 w-2 rounded-full bg-zinc-300 animate-pulse" aria-hidden="true" />
        Horizon
      </span>
    );
  }

  const { status, latestLedger, baseFee } = networkStatus;
  const isDegraded = status === "degraded" || status === "down";

  const colorClass =
    status === "healthy"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : status === "degraded"
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-rose-200 bg-rose-50 text-rose-800";

  const dotClass =
    status === "healthy"
      ? "bg-emerald-500"
      : status === "degraded"
      ? "bg-amber-500 animate-pulse"
      : "bg-rose-500 animate-pulse";

  const tooltipParts: string[] = [`Network: ${network}`];
  if (latestLedger) tooltipParts.push(`Ledger: ${latestLedger.toLocaleString()}`);
  if (baseFee) tooltipParts.push(`Base fee: ${baseFee} stroops`);
  if (networkStatus.error) tooltipParts.push(`Error: ${networkStatus.error}`);
  const tooltip = tooltipParts.join(" · ");

  const indicator = (
    <span
      className={cn(
        "hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
        colorClass,
        isDegraded && "cursor-pointer hover:opacity-80",
      )}
      title={tooltip}
      aria-label={`Stellar Horizon: ${status}. ${tooltip}`}
    >
      <span className={cn("h-2 w-2 rounded-full", dotClass)} aria-hidden="true" />
      Horizon
    </span>
  );

  if (isDegraded) {
    return (
      <a
        href={STELLAR_STATUS_PAGE}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Stellar Horizon status: ${status}. Visit Stellar status page.`}
        title={tooltip}
        className={cn(
          "hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
          colorClass,
          "hover:opacity-80",
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", dotClass)} aria-hidden="true" />
        Horizon ↗
      </a>
    );
  }

  return indicator;
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

function CommandPaletteTrigger() {
  const { open } = useCommandPalette();
  const t = useTranslations("shell");
  return (
    <button
      type="button"
      onClick={open}
      aria-keyshortcuts="Meta+K Control+K"
      aria-label={t("searchHint")}
      className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 lg:w-56"
    >
      <Search className="h-4 w-4" aria-hidden="true" />
      <span className="hidden lg:inline">{t("search")}…</span>
      <kbd className="ml-auto hidden rounded border border-zinc-300 bg-white px-1.5 font-sans text-[10px] font-medium text-zinc-600 lg:inline" aria-hidden="true">
        ⌘K
      </kbd>
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

      <CommandPaletteTrigger />

      <NetworkModeToggle />

      <HorizonStatusIndicator />

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
