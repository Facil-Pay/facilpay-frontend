/**
 * tests/components/test-mode-banner.test.tsx
 *
 * Tests for the TestModeBanner and NetworkModeProvider (issue #80).
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NetworkModeProvider } from "@/lib/network-mode-context";
import { TestModeBanner } from "@/components/layout/TestModeBanner";

function renderWithProvider(defaultMode?: "testnet" | "mainnet") {
  // Override stored value before rendering
  if (defaultMode) {
    try {
      localStorage.setItem("facilpay.network_mode", defaultMode);
    } catch {
      // jsdom storage may be unavailable in some environments
    }
  }
  return render(
    <NetworkModeProvider>
      <TestModeBanner />
    </NetworkModeProvider>,
  );
}

describe("TestModeBanner", () => {
  it("shows the banner in testnet mode", async () => {
    renderWithProvider("testnet");
    // Banner is rendered after the useEffect hydration; check it appears
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/testnet/i)).toBeInTheDocument();
  });

  it("hides the banner in mainnet mode", () => {
    renderWithProvider("mainnet");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("switches to mainnet when Switch to Live is clicked", async () => {
    renderWithProvider("testnet");
    const btn = await screen.findByRole("button", { name: /switch to live/i });
    await userEvent.click(btn);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
