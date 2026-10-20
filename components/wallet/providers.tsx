"use client";

import type { ReactNode } from "react";
import { ToastProvider } from "@/components/ui";
import { WalletProvider } from "./wallet-provider";
import { TestModeProvider } from "@/lib/test-mode-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <TestModeProvider>
        <WalletProvider>{children}</WalletProvider>
      </TestModeProvider>
    </ToastProvider>
  );
}
