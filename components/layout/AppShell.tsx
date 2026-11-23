"use client";

import { useState, type ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { TestModeBanner } from "./TestModeBanner";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";
import { NetworkModeProvider } from "@/lib/network-mode-context";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPalette";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <NetworkModeProvider>
      <CommandPaletteProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-[#000F24] focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#55C2FF]"
      >
        Skip to content
      </a>
      <div className="flex min-h-screen w-full overflow-x-clip bg-zinc-50 text-zinc-900">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed(!collapsed)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onOpenMobileNav={() => setMobileOpen(true)} />
          <TestModeBanner />
          <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
      </CommandPaletteProvider>
    </NetworkModeProvider>
  );
}
