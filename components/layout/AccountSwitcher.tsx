"use client";

import { useEffect, useState } from "react";
import { Check, ChevronDown, Store } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  MERCHANT_ACCOUNTS,
  getActiveMerchantId,
  setActiveMerchantId,
} from "@/lib/merchant-accounts";

/**
 * Lists the merchant accounts this user can access and lets them switch
 * without logging out (Issue #133). Switching persists the choice and
 * invalidates every query so screens refetch under the new account's
 * scope instead of showing stale data from the previous one.
 */
export function AccountSwitcher() {
  const queryClient = useQueryClient();
  // Server-rendered default avoids a hydration mismatch; the real stored
  // value (if any) is applied once mounted in the browser.
  const [activeId, setActiveId] = useState(MERCHANT_ACCOUNTS[0].id);

  useEffect(() => {
    setActiveId(getActiveMerchantId());
  }, []);

  const active = MERCHANT_ACCOUNTS.find((a) => a.id === activeId) ?? MERCHANT_ACCOUNTS[0];

  function handleSelect(id: string) {
    if (id === activeId) return;
    setActiveMerchantId(id);
    setActiveId(id);
    // Every account-scoped query was fetched under the previous account's
    // header, so it must be refetched rather than reused.
    void queryClient.invalidateQueries();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Switch business"
          className="hidden items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50 sm:inline-flex"
        >
          <Store className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
          <span className="max-w-[140px] truncate">{active.name}</span>
          <ChevronDown className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {MERCHANT_ACCOUNTS.map((account) => (
          <DropdownMenuItem key={account.id} onSelect={() => handleSelect(account.id)}>
            <span className="flex w-4 items-center">
              {account.id === activeId && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
            </span>
            <span className="truncate">{account.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
