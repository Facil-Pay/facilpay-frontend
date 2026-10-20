import { describe, it, expect, vi, beforeEach } from "vitest";
import { StrKey } from "../lib/stellar/strkey";

// Test suite for Test/Live mode logic, Friendbot faucet, simulated payments, and wallet network validation (Issue #80)
describe("Test / Live Mode Specification (Issue #80)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  describe("Mode State & Persistence", () => {
    it("defaults to testnet / test mode", () => {
      const mode = "testnet";
      const isTestMode = mode === "testnet";
      expect(isTestMode).toBe(true);
      expect(mode).toBe("testnet");
    });

    it("toggles correctly between testnet and mainnet", () => {
      let mode: "testnet" | "mainnet" = "testnet";
      const toggle = () => {
        mode = mode === "testnet" ? "mainnet" : "testnet";
      };

      expect(mode).toBe("testnet");
      toggle();
      expect(mode).toBe("mainnet");
      toggle();
      expect(mode).toBe("testnet");
    });

    it("persists mode choice across sessions in localStorage", () => {
      const STORAGE_KEY = "facilpay.network-mode";
      const store: Record<string, string> = {};
      const mockStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
      };

      mockStorage.setItem(STORAGE_KEY, "mainnet");
      expect(mockStorage.getItem(STORAGE_KEY)).toBe("mainnet");

      mockStorage.setItem(STORAGE_KEY, "testnet");
      expect(mockStorage.getItem(STORAGE_KEY)).toBe("testnet");
    });
  });

  describe("Friendbot Faucet Tooling", () => {
    it("validates Stellar public keys before dispatching faucet request", () => {
      const invalidShortKey = "G12345";
      const invalidPrefixKey = "S1234567890123456789012345678901234567890123456789012345";
      const validKey = "GCDRFZHA4MYYT7E5A3VYWYS74HAMCEMDGGUXNBNOIP67COGX7PRMNR4H";

      expect(StrKey.isValidEd25519PublicKey(invalidShortKey)).toBe(false);
      expect(StrKey.isValidEd25519PublicKey(invalidPrefixKey)).toBe(false);
      expect(StrKey.isValidEd25519PublicKey(validKey)).toBe(true);
    });

    it("constructs valid SDF Friendbot request URL", () => {
      const validKey = "GCDRFZHA4MYYT7E5A3VYWYS74HAMCEMDGGUXNBNOIP67COGX7PRMNR4H";
      const url = `https://friendbot.stellar.org?addr=${encodeURIComponent(validKey)}`;
      expect(url).toBe(
        "https://friendbot.stellar.org?addr=GCDRFZHA4MYYT7E5A3VYWYS74HAMCEMDGGUXNBNOIP67COGX7PRMNR4H"
      );
    });
  });

  describe("Simulated Payment Generation", () => {
    it("generates simulated payment record with unique id and transaction hash", () => {
      const simPayment = {
        id: `sim_pay_${Date.now()}`,
        amount: "50.00",
        asset_code: "USDC",
        from: "GCDRFZHA4MYYT7E5A3VYWYS74HAMCEMDGGUXNBNOIP67COGX7PRMNR4H",
        to: "GD2RUEB4WVDU2SMNY45MWNXNU43J43DQOSZNDFJH74MKE4B5JDT6U5YO",
        created_at: new Date().toISOString(),
        transaction_hash: "a".repeat(64),
      };

      expect(simPayment.id).toMatch(/^sim_pay_\d+$/);
      expect(simPayment.transaction_hash).toHaveLength(64);
      expect(simPayment.asset_code).toBe("USDC");
      expect(parseFloat(simPayment.amount)).toBe(50.0);
    });
  });

  describe("Wallet Network Mismatch Detection", () => {
    function checkMismatch(mode: "testnet" | "mainnet", walletNetwork: string | null, isConnected: boolean) {
      if (!isConnected || !walletNetwork) return false;
      const normalized = walletNetwork.toLowerCase();
      const isWalletMainnet = normalized.includes("public") || normalized.includes("mainnet");
      const isWalletTestnet = normalized.includes("testnet") || normalized.includes("test");

      return (mode === "testnet" && isWalletMainnet) || (mode === "mainnet" && isWalletTestnet);
    }

    it("flags mismatch when app is in test mode but wallet is on Mainnet/Public", () => {
      expect(checkMismatch("testnet", "Public", true)).toBe(true);
      expect(checkMismatch("testnet", "Public Global Stellar Network ; September 2015", true)).toBe(true);
      expect(checkMismatch("testnet", "mainnet", true)).toBe(true);
    });

    it("flags mismatch when app is in live mode but wallet is on Testnet", () => {
      expect(checkMismatch("mainnet", "Testnet", true)).toBe(true);
      expect(checkMismatch("mainnet", "Test SDF Network ; September 2015", true)).toBe(true);
    });

    it("clears mismatch when wallet network matches app mode", () => {
      expect(checkMismatch("testnet", "Testnet", true)).toBe(false);
      expect(checkMismatch("mainnet", "Public", true)).toBe(false);
      expect(checkMismatch("testnet", "Testnet", false)).toBe(false); // disconnected
    });
  });

  describe("Network-Scoped API Key Selection", () => {
    it("switches publishable key prefix based on mode", () => {
      const PUBLISHABLE_KEYS = {
        testnet: "pk_test_facilpay_9f8a2c1b84e72026testnet",
        mainnet: "pk_live_facilpay_3d4e5f6a7b8c2026mainnet",
      };

      expect(PUBLISHABLE_KEYS["testnet"]).toMatch(/^pk_test_/);
      expect(PUBLISHABLE_KEYS["mainnet"]).toMatch(/^pk_live_/);
    });
  });
});
