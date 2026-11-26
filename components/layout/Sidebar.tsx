"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import logoHorizontal from "@/app/branding/logo/horizontal/facilpay-horizontal-logo-white.svg";
import logoIcon from "@/app/branding/logo/icon/facilpay-icon.svg";
import { DASHBOARD_NAV_ITEMS, isNavItemActive } from "./nav-items";
import { useUnmatchedPayments, pendingCount } from "@/lib/unmatched-payments";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("navigation");
  const unmatchedItems = useUnmatchedPayments();
  const unmatchedBadge = pendingCount(unmatchedItems);

  return (
    <>
      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        onClick={onCloseMobile}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      <aside
        id="dashboard-sidebar"
        aria-label={t("sidebar")}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#000F24] text-white transition-[transform,width] duration-200",
          // Mobile: slide-over drawer
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          // Desktop: always visible, collapsible to icons
          "md:sticky md:top-0 md:h-screen md:translate-x-0",
          collapsed ? "md:w-[72px]" : "md:w-64",
        )}
      >
        <div className={cn("flex h-16 shrink-0 items-center border-b border-white/10 px-4", collapsed ? "md:justify-center md:px-0" : "justify-between")}>
          <Link href="/overview" onClick={onCloseMobile} aria-label={`FacilPay ${t("overview")}`} className="flex items-center">
            <Image
              src={logoHorizontal}
              alt="FacilPay"
              priority
              unoptimized
              className={cn("h-8 w-auto", collapsed && "md:hidden")}
            />
            <Image
              src={logoIcon}
              alt=""
              unoptimized
              aria-hidden="true"
              className={cn("hidden h-8 w-8", collapsed && "md:block")}
            />
          </Link>
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label={t("close")}
            className="rounded-md p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label={t("dashboard")} className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {DASHBOARD_NAV_ITEMS.map(({ label, href, icon: Icon, badge }) => {
              const active = isNavItemActive(pathname, href);
              const translatedLabel = t(label);
              const badgeCount = badge === "unmatched_count" ? unmatchedBadge : 0;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onCloseMobile}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? translatedLabel : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "md:justify-center md:px-0",
                      active
                        ? "bg-[#55C2FF]/15 text-[#55C2FF]"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <span className="relative shrink-0">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {badgeCount > 0 && collapsed && (
                        <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-amber-500 px-0.5 text-[9px] font-bold text-white">
                          {badgeCount > 9 ? "9+" : badgeCount}
                        </span>
                      )}
                    </span>
                    <span className={cn("truncate flex-1", collapsed && "md:sr-only")}>{translatedLabel}</span>
                    {badgeCount > 0 && !collapsed && (
                      <span
                        className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white"
                        aria-label={`${badgeCount} unmatched payments`}
                      >
                        {badgeCount > 9 ? "9+" : badgeCount}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden shrink-0 border-t border-white/10 p-3 md:block">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={collapsed ? t("expand") : t("collapse")}
            aria-expanded={!collapsed}
            aria-controls="dashboard-sidebar"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            {!collapsed && <span>{t("collapse")}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
