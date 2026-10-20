"use client";

/**
 * lib/network-mode.ts
 *
 * Persistent test/live mode toggle backed by localStorage.
 * Defaults to "testnet" when the configured network is testnet/futurenet,
 * and to "mainnet" otherwise.
 */

import { loadFromStorage, saveToStorage } from "@/lib/storage";

export type NetworkMode = "testnet" | "mainnet";

const STORAGE_KEY = "facilpay.network_mode";

function defaultMode(): NetworkMode {
  const net = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
  return net === "mainnet" ? "mainnet" : "testnet";
}

export function getStoredNetworkMode(): NetworkMode {
  const stored = loadFromStorage<string | null>(STORAGE_KEY, null);
  return stored === "mainnet" || stored === "testnet" ? stored : defaultMode();
}

export function storeNetworkMode(mode: NetworkMode): void {
  saveToStorage(STORAGE_KEY, mode);
}
