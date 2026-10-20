'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { KeyRound, Webhook, BookOpen } from 'lucide-react';

export default function DevelopersNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'API Keys',
      href: '/developers/api-keys',
      icon: KeyRound,
      description: 'Publishable & Secret Keys',
    },
    {
      label: 'Webhook Event Catalog',
      href: '/developers/events',
      icon: Webhook,
      description: 'Event Specs & Signatures',
    },
  ];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 sm:gap-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/developers' && pathname?.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 border-b-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-[#0066FF] text-[#0066FF] dark:border-[#55C2FF] dark:text-[#55C2FF]'
                    : 'border-transparent text-zinc-500 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <BookOpen className="h-3.5 w-3.5" />
          <span>Developer Documentation</span>
        </div>
      </div>
    </div>
  );
}
