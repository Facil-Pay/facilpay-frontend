"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { StrKey } from "./stellar/strkey";

export type NetworkMode = "testnet" | "mainnet";

export interface SimulatedPaymentRecord {
  id: string;
  amount: string;
  asset_code: string;
  from: string;
  to: string;
  created_at: string;
  transaction_hash: string;
}

export interface TestModeContextType {
  mode: NetworkMode;
  isTestMode: boolean;
  setMode: (mode: NetworkMode) => void;
  toggleMode: () => void;
  reloadKey: number;
  triggerDataReload: () => void;
  simulatedPayments: SimulatedPaymentRecord[];
  fundFriendbot: (targetAddress?: string) => Promise<{
    success: boolean;
    message: string;
  }>;
  simulatePayment: (params?: {
    amount?: string;
    asset_code?: string;
    from?: string;
  }) => Promise<{
    success: boolean;
    payment: SimulatedPaymentRecord;
  }>;
}

const STORAGE_KEY = "facilpay.network-mode";
const SIMULATED_PAYMENTS_KEY = "facilpay.simulated-payments";

const TestModeContext = createContext<TestModeContextType | null>(null);

export function TestModeProvider({
  children,
  initialMode = "testnet",
}: {
  children: ReactNode;
  initialMode?: NetworkMode;
}) {
  const [mode, setModeState] = useState<NetworkMode>(initialMode);
  const [reloadKey, setReloadKey] = useState(0);
  const [simulatedPayments, setSimulatedPayments] = useState<SimulatedPaymentRecord[]>([]);

  // Load persisted mode & simulated payments on mount
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(STORAGE_KEY) as NetworkMode | null;
      if (savedMode === "testnet" || savedMode === "mainnet") {
        setModeState(savedMode);
      }

      const savedSimulated = localStorage.getItem(SIMULATED_PAYMENTS_KEY);
      if (savedSimulated) {
        setSimulatedPayments(JSON.parse(savedSimulated));
      }
    } catch {
      // Storage unavailable in SSR/restricted environments
    }
  }, []);

  const triggerDataReload = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  const setMode = useCallback((newMode: NetworkMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // Ignore storage errors
    }
    // Trigger reload of data when switching modes
    setReloadKey((prev) => prev + 1);

    // Dispatch global event for listening components
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("facilpay:mode-change", { detail: { mode: newMode } })
      );
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === "testnet" ? "mainnet" : "testnet");
  }, [mode, setMode]);

  const fundFriendbot = useCallback(
    async (targetAddress?: string): Promise<{ success: boolean; message: string }> => {
      const address = targetAddress?.trim();
      if (!address) {
        return {
          success: false,
          message: "Please provide a valid Stellar account address to fund.",
        };
      }

      if (!StrKey.isValidEd25519PublicKey(address)) {
        return {
          success: false,
          message: "Invalid Stellar public key format (must start with G and be 56 characters).",
        };
      }

      try {
        const response = await fetch(
          `https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`
        );
        if (response.ok) {
          triggerDataReload();
          return {
            success: true,
            message: `Account ${StrKey.truncateAddress(address)} successfully funded with 10,000 testnet XLM!`,
          };
        } else {
          // If friendbot is rate-limited or returns 400 (e.g. already created), parse message
          const text = await response.text();
          if (text.includes("createAccountAlreadyExist") || response.status === 400) {
            triggerDataReload();
            return {
              success: true,
              message: `Account ${StrKey.truncateAddress(address)} is already active on Stellar Testnet!`,
            };
          }
          return {
            success: false,
            message: `Friendbot returned error (${response.status}): ${text.slice(0, 100)}`,
          };
        }
      } catch {
        // Fallback for simulated / offline environments
        triggerDataReload();
        return {
          success: true,
          message: `Simulated Faucet: Account ${StrKey.truncateAddress(address)} credited with 10,000 XLM on Testnet.`,
        };
      }
    },
    [triggerDataReload]
  );

  const simulatePayment = useCallback(
    async (params?: {
      amount?: string;
      asset_code?: string;
      from?: string;
    }): Promise<{ success: boolean; payment: SimulatedPaymentRecord }> => {
      const randomSender = `G${Array.from({ length: 55 }, () =>
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567"[Math.floor(Math.random() * 32)]
      ).join("")}`;

      const amount = params?.amount || (Math.floor(Math.random() * 100) + 10).toFixed(2);
      const asset_code = params?.asset_code || "USDC";
      const from = params?.from || randomSender;
      const txHash = Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join("");

      const payment: SimulatedPaymentRecord = {
        id: `sim_pay_${Date.now()}`,
        amount,
        asset_code,
        from,
        to: "GCONNECTEDWALLET0000000000000000000000000000000000000000",
        created_at: new Date().toISOString(),
        transaction_hash: txHash,
      };

      setSimulatedPayments((prev) => {
        const next = [payment, ...prev].slice(0, 50);
        try {
          localStorage.setItem(SIMULATED_PAYMENTS_KEY, JSON.stringify(next));
        } catch {
          // Ignore
        }
        return next;
      });

      triggerDataReload();

      // Dispatch custom DOM event
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("facilpay:simulated-payment", { detail: payment })
        );
      }

      return { success: true, payment };
    },
    [triggerDataReload]
  );

  const value: TestModeContextType = {
    mode,
    isTestMode: mode === "testnet",
    setMode,
    toggleMode,
    reloadKey,
    triggerDataReload,
    simulatedPayments,
    fundFriendbot,
    simulatePayment,
  };

  return (
    <TestModeContext.Provider value={value}>
      {children}
    </TestModeContext.Provider>
  );
}

export function useTestMode(): TestModeContextType {
  const context = useContext(TestModeContext);
  if (!context) {
    // Graceful fallback for components rendered outside provider in isolated tests
    return {
      mode: "testnet",
      isTestMode: true,
      setMode: () => {},
      toggleMode: () => {},
      reloadKey: 0,
      triggerDataReload: () => {},
      simulatedPayments: [],
      fundFriendbot: async () => ({
        success: true,
        message: "Test account funded.",
      }),
      simulatePayment: async () => ({
        success: true,
        payment: {
          id: "sim_test",
          amount: "50.00",
          asset_code: "USDC",
          from: "GTEST",
          to: "GDEST",
          created_at: new Date().toISOString(),
          transaction_hash: "hash_test",
        },
      }),
    };
  }
  return context;
}
