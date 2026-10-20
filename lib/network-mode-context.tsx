"use client";

/**
 * lib/network-mode-context.tsx
 *
 * Context that exposes the current network mode (testnet / mainnet) and a
 * toggle function.  The value is persisted in localStorage so it survives
 * page reloads.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  type NetworkMode,
  getStoredNetworkMode,
  storeNetworkMode,
} from "@/lib/network-mode";

interface NetworkModeContextValue {
  mode: NetworkMode;
  isTestnet: boolean;
  setMode: (mode: NetworkMode) => void;
  toggleMode: () => void;
}

const NetworkModeContext = createContext<NetworkModeContextValue | undefined>(
  undefined,
);

export function NetworkModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialise to "testnet" on the server to avoid hydration mismatches;
  // the real stored value is read inside useEffect (client only).
  const [mode, setModeState] = useState<NetworkMode>("testnet");

  useEffect(() => {
    setModeState(getStoredNetworkMode());
  }, []);

  const setMode = useCallback((next: NetworkMode) => {
    storeNetworkMode(next);
    setModeState(next);
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "testnet" ? "mainnet" : "testnet");
  }, [mode, setMode]);

  return (
    <NetworkModeContext.Provider
      value={{ mode, isTestnet: mode === "testnet", setMode, toggleMode }}
    >
      {children}
    </NetworkModeContext.Provider>
  );
}

export function useNetworkMode(): NetworkModeContextValue {
  const ctx = useContext(NetworkModeContext);
  if (!ctx) {
    throw new Error("useNetworkMode must be used within NetworkModeProvider");
  }
  return ctx;
}
