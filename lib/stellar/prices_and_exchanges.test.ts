import { describe, expect, it } from "vitest";
import { getFiatEstimate, getAssetFiatValue, formatFiatValue, DEFAULT_PRICE_FEEDS } from "./prices";
import { getExchangeInfo, isExchangeAddress, KNOWN_EXCHANGE_ADDRESSES } from "./exchanges";

describe("Prices & Fiat Conversions", () => {
  describe("getFiatEstimate", () => {
    it("computes accurate USD fiat total for standard assets", () => {
      const estimate = getFiatEstimate("USDC", 100);
      expect(estimate.isUnavailable).toBe(false);
      expect(estimate.unitPrice).toBe(1.0);
      expect(estimate.totalFiat).toBe(100);
      expect(estimate.currency).toBe("USD");
      expect(estimate.formatted).toContain("$100.00 USD");
    });

    it("applies accurate conversion for XLM with decimal rounding", () => {
      const estimate = getFiatEstimate("XLM", 1000);
      expect(estimate.isUnavailable).toBe(false);
      expect(estimate.totalFiat).toBeCloseTo(128.5, 2);
    });

    it("supports EUR currency formatting", () => {
      const estimate = getFiatEstimate("EURC", 50, "EUR");
      expect(estimate.currency).toBe("EUR");
      expect(estimate.totalFiat).toBeCloseTo(54.25, 2);
      expect(estimate.formatted).toContain("€54.25 EUR");
    });

    it("returns 'Price unavailable' for unknown assets", () => {
      const estimate = getFiatEstimate("UNKNOWN_TOKEN", 500);
      expect(estimate.isUnavailable).toBe(true);
      expect(estimate.unitPrice).toBeNull();
      expect(estimate.totalFiat).toBeNull();
      expect(estimate.formatted).toBe("Price unavailable");
    });

    it("handles zero and negative amounts correctly", () => {
      const zeroEstimate = getFiatEstimate("USDC", 0);
      expect(zeroEstimate.totalFiat).toBe(0);
      expect(zeroEstimate.formatted).toContain("$0.00 USD");
    });

    it("handles NaN amount gracefully", () => {
      const nanEstimate = getFiatEstimate("USDC", NaN);
      expect(nanEstimate.isUnavailable).toBe(true);
      expect(nanEstimate.formatted).toBe("Price unavailable");
    });
  });

  describe("getAssetFiatValue", () => {
    it("returns raw number or null for unknown asset", () => {
      expect(getAssetFiatValue("USDC", 250)).toBe(250);
      expect(getAssetFiatValue("UNKNOWN", 100)).toBeNull();
    });
  });

  describe("formatFiatValue", () => {
    it("formats null or undefined as dash", () => {
      expect(formatFiatValue(null)).toBe("—");
      expect(formatFiatValue(undefined)).toBe("—");
    });

    it("formats numeric values with currency symbols", () => {
      expect(formatFiatValue(1234.56, "USD")).toBe("$1,234.56");
      expect(formatFiatValue(99.9, "EUR")).toBe("€99.90");
    });
  });
});

describe("Exchanges & Memo Requirements", () => {
  const BINANCE_ADDR = "GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG";
  const COINBASE_ADDR = "GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV";
  const UNKNOWN_ADDR = "GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6QVIBHSNDMS6NOSTIQS5KDU";

  describe("getExchangeInfo", () => {
    it("identifies Binance and its memo requirements", () => {
      const info = getExchangeInfo(BINANCE_ADDR);
      expect(info).not.toBeNull();
      expect(info?.name).toBe("Binance");
      expect(info?.memoRequired).toBe(true);
      expect(info?.memoTypeDescription).toBe("Numeric Memo ID");
    });

    it("identifies Coinbase and its memo requirements", () => {
      const info = getExchangeInfo(COINBASE_ADDR);
      expect(info).not.toBeNull();
      expect(info?.name).toBe("Coinbase");
      expect(info?.memoRequired).toBe(true);
    });

    it("returns null for unknown addresses", () => {
      expect(getExchangeInfo(UNKNOWN_ADDR)).toBeNull();
      expect(getExchangeInfo("")).toBeNull();
    });
  });

  describe("isExchangeAddress", () => {
    it("returns true for known centralized exchanges", () => {
      expect(isExchangeAddress(BINANCE_ADDR)).toBe(true);
      expect(isExchangeAddress(COINBASE_ADDR)).toBe(true);
    });

    it("returns false for standard private addresses", () => {
      expect(isExchangeAddress(UNKNOWN_ADDR)).toBe(false);
    });
  });
});
