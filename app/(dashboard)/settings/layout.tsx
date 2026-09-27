"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/components/ui/utils";

const TABS = [
  { href: "/settings/profile", label: "Business Profile" },
  { href: "/settings/branding", label: "Branding" },
  { href: "/settings/preferences", label: "Payment Preferences" },
  { href: "/settings/security", label: "Security" },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Settings</h2>
        <p className="mt-1 text-sm text-zinc-500">Manage your business profile, checkout branding, payment preferences and security.</p>
      </div>

      <nav aria-label="Settings sections" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <ul className="flex min-w-max gap-1 border-b border-zinc-200">
          {TABS.map((tab) => {
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
        </ul>
      </nav>

      {children}
    </div>
  );
}
