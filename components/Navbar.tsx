'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function Navbar() {
  const pathname = usePathname();
  const tNavigation = useTranslations('navigation');
  const tShell = useTranslations('shell');

  const navItems = [
    { name: 'balances', href: '/balances' },
    { name: 'payments', href: '/payments' },
    { name: 'refunds', href: '/refunds' },
    { name: 'payouts', href: '/payouts' },
    { name: 'developers', href: '/developers/api-keys' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-zinc-800 dark:bg-black/95">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-8">
          <Link href="/payments" className="flex items-center gap-3 group">
            {/* FacilPay SVG Logo Mark */}
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-[#000F24] p-1.5 shadow-sm transition-transform group-hover:scale-105">
              <svg
                viewBox="0 0 128 128"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="h-full w-full"
              >
                <path
                  d="M90.6 46L94.7 38.9C95.1 38.2 94.6 37.4 93.8 37.4H53.7C53.4 37.4 53 37.5 52.9 37.9L31.5 74.9C31.3 75.2 31.3 75.6 31.5 75.9L35.7 83.1C36 83.8 37 83.8 37.4 83.1L58.2 47C58.4 46.7 58.7 46.5 59.1 46.5H89.7C90.1 46.5 90.4 46.3 90.6 46Z"
                  fill="#55C2FF"
                />
                <path
                  d="M62.4 54.1L58.3 61.2C57.9 61.8 58.4 62.7 59.1 62.7H76.9C77.6 62.8 78.1 63.6 77.7 64.3L73.5 71.4C73.4 71.7 73 71.9 72.7 71.9H52.7C52.3 71.9 52 72.1 51.8 72.4L41 91.1C40.8 91.4 40.8 91.7 41 92.1L45.2 99.3C45.5 100 46.5 100 46.9 99.3L57.1 81.6C57.3 81.3 57.6 81.1 58 81.1H78C78.4 81.1 78.7 80.9 78.9 80.6L93.6 55.1C94 54.4 93.5 53.6 92.8 53.6H63.3C62.9 53.6 62.6 53.7 62.4 54.1Z"
                  fill="#A5D4FF"
                />
              </svg>
            </div>

            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Facil<span className="text-[#55C2FF]">Pay</span>
              </span>
              <span className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
                {tNavigation('merchantPortal')}
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex md:gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center rounded-lg px-3.5 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 font-semibold dark:bg-zinc-800 dark:text-white'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {tNavigation(item.name)}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Info: Stellar Network & Merchant ID */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-800 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
            {tShell('networkTestnet')}
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {tShell('merchant')}
            </span>
            <span className="text-zinc-400">•</span>
            <span className="font-mono text-[11px] text-zinc-500">merch_01</span>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="flex border-t border-zinc-200 bg-zinc-50/80 px-4 py-2 md:hidden dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex w-full justify-around">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-sm font-semibold dark:bg-zinc-800 dark:text-white'
                    : 'text-zinc-600 hover:text-zinc-950 dark:text-zinc-400'
                }`}
              >
                {tNavigation(item.name)}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
