"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, ChevronRight, Menu } from "lucide-react";
import { cn } from "@/components/ui/utils";
import { DASHBOARD_NAV_ITEMS } from "./nav-items";

type StellarNetwork = "mainnet" | "testnet" | "futurenet";

function getConfiguredNetwork(): StellarNetwork {
  const value = process.env.NEXT_PUBLIC_STELLAR_NETWORK;
  return value === "mainnet" || value === "futurenet" ? value : "testnet";
}

function humanize(segment: string): string {
  const navMatch = DASHBOARD_NAV_ITEMS.find((item) => item.href === `/${segment}`);
  if (navMatch) return navMatch.label;
  return decodeURIComponent(segment)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function useBreadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  return segments.map((segment, index) => ({
    label: humanize(segment),
    href: `/${segments.slice(0, index + 1).join("/")}`,
  }));
}

export function NetworkBadge() {
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
      title={`Connected to Stellar ${network}`}
    >
      <span className={cn("h-2 w-2 rounded-full", isMainnet ? "bg-emerald-500" : "bg-amber-500")} aria-hidden="true" />
      {network.charAt(0).toUpperCase() + network.slice(1)}
    </span>
  );
}

export function TopBar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const crumbs = useBreadcrumbs();
  const title = crumbs.at(-1)?.label ?? "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        aria-controls="dashboard-sidebar"
        className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="hidden sm:block">
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

      <NetworkBadge />

      {/* Notifications bell — placeholder slot */}
      <button
        type="button"
        aria-label="Notifications"
        className="rounded-full p-2 text-zinc-600 hover:bg-zinc-100"
      >
        <Bell className="h-5 w-5" />
      </button>

      {/* Account menu — placeholder slot */}
      <button
        type="button"
        aria-label="Account menu"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#55C2FF]/40 bg-[#55C2FF]/20 text-xs font-bold text-[#000F24]"
      >
        M
      </button>
    </header>
  );
}
