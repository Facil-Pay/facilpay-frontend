"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { cn } from "@/components/ui/utils";
import logoHorizontal from "@/app/branding/logo/horizontal/facilpay-horizontal-logo-white.svg";
import logoIcon from "@/app/branding/logo/icon/facilpay-icon.svg";
import { DASHBOARD_NAV_ITEMS, isNavItemActive } from "./nav-items";

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();

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
        aria-label="Sidebar"
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
          <Link href="/overview" onClick={onCloseMobile} aria-label="FacilPay overview" className="flex items-center">
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
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-zinc-300 hover:bg-white/10 hover:text-white md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Dashboard navigation" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {DASHBOARD_NAV_ITEMS.map(({ label, href, icon: Icon }) => {
              const active = isNavItemActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onCloseMobile}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      collapsed && "md:justify-center md:px-0",
                      active
                        ? "bg-[#55C2FF]/15 text-[#55C2FF]"
                        : "text-zinc-300 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                    <span className={cn("truncate", collapsed && "md:sr-only")}>{label}</span>
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
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="dashboard-sidebar"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/10 hover:text-white",
              collapsed && "justify-center px-0",
            )}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
