"use client";

import { createLocalStore } from "./local-store";
import type { SavedDestination } from "./types";

/** New saved destinations can't be used for a payout until this cooldown elapses. */
export const ADDRESS_COOLDOWN_MS = 24 * 60 * 60 * 1000;

export interface PayoutSecuritySettings {
  /** When true, payouts may only go to a saved destination's address. */
  allowlistOnly: boolean;
}

export const payoutSettingsStore = createLocalStore<PayoutSecuritySettings>("facilpay_payout_settings", {
  allowlistOnly: false,
});

export const usePayoutSettings = payoutSettingsStore.useStore;

export function msUntilCooldownEnds(dest: SavedDestination): number {
  return Math.max(0, new Date(dest.createdAt).getTime() + ADDRESS_COOLDOWN_MS - Date.now());
}

export function isAddressInCooldown(dest: SavedDestination): boolean {
  return msUntilCooldownEnds(dest) > 0;
}

export function formatCooldownRemaining(dest: SavedDestination): string {
  const ms = msUntilCooldownEnds(dest);
  const hours = Math.ceil(ms / (60 * 60 * 1000));
  return hours <= 1 ? "less than 1 hour" : `${hours} hours`;
}

/** Finds a saved destination matching a raw or resolved address, for allowlist checks. */
export function findMatchingDestination(
  destinations: SavedDestination[],
  rawAddress: string,
  resolvedAddress?: string | null,
): SavedDestination | undefined {
  const clean = rawAddress.trim().toLowerCase();
  const resolved = resolvedAddress?.trim().toLowerCase();
  return destinations.find((d) => {
    if (d.address.trim().toLowerCase() === clean) return true;
    if (resolved && d.address.trim().toLowerCase() === resolved) return true;
    if (resolved && d.resolvedAddress?.trim().toLowerCase() === resolved) return true;
    if (d.resolvedAddress?.trim().toLowerCase() === clean) return true;
    return false;
  });
}
