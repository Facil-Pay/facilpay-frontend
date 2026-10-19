import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isFederationAddress, resolveFederationAddress } from "./federation";

describe("Federation Protocol Resolver (SEP-2)", () => {
  describe("isFederationAddress", () => {
    it("returns true for valid name*domain formats", () => {
      expect(isFederationAddress("merchant*facilpay.io")).toBe(true);
      expect(isFederationAddress("user.name*stellar.org")).toBe(true);
      expect(isFederationAddress("deposit*binance.com")).toBe(true);
    });

    it("returns false for inputs without asterisk or multiple asterisks", () => {
      expect(isFederationAddress("merchantfacilpay.io")).toBe(false);
      expect(isFederationAddress("user*domain*extra.com")).toBe(false);
    });

    it("returns false for empty usernames or domains", () => {
      expect(isFederationAddress("*facilpay.io")).toBe(false);
      expect(isFederationAddress("merchant*")).toBe(false);
      expect(isFederationAddress("")).toBe(false);
    });

    it("returns false for domains without dots or too short", () => {
      expect(isFederationAddress("merchant*localhost")).toBe(false);
      expect(isFederationAddress("merchant*a.b")).toBe(true);
      expect(isFederationAddress("merchant*a")).toBe(false);
    });

    it("handles non-string inputs safely", () => {
      expect(isFederationAddress(null as unknown as string)).toBe(false);
      expect(isFederationAddress(undefined as unknown as string)).toBe(false);
    });
  });

  describe("resolveFederationAddress", () => {
    it("returns null for non-federation strings immediately", async () => {
      expect(await resolveFederationAddress("GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6QVIBHSNDMS6NOSTIQS5KDU")).toBeNull();
      expect(await resolveFederationAddress("")).toBeNull();
    });

    it("resolves built-in mock registry records synchronously and accurately", async () => {
      const record = await resolveFederationAddress("merchant*facilpay.io");
      expect(record).not.toBeNull();
      expect(record?.account_id).toBe("GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A");
      expect(record?.memo).toBe("FP-MERCH-01");
      expect(record?.memo_type).toBe("text");
    });

    it("resolves exchange records with exchange flags", async () => {
      const record = await resolveFederationAddress("deposit*binance.com");
      expect(record?.isExchange).toBe(true);
      expect(record?.exchangeName).toBe("Binance");
      expect(record?.memo).toBe("109283741");
      expect(record?.memo_type).toBe("id");
    });

    describe("Online SEP-2 HTTP Lookup", () => {
      beforeEach(() => {
        vi.stubGlobal("fetch", vi.fn());
      });

      afterEach(() => {
        vi.unstubAllGlobals();
      });

      it("queries stellar.toml then federation endpoint successfully", async () => {
        const mockTomlText = `
          FEDERATION_SERVER="https://api.customdomain.org/federation"
        `;
        const mockFedResponse = {
          stellar_address: "alice*customdomain.org",
          account_id: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
          memo_type: "text",
          memo: "TEST-MEMO",
        };

        const fetchMock = vi.fn()
          // 1. stellar.toml fetch
          .mockResolvedValueOnce({
            ok: true,
            text: async () => mockTomlText,
          })
          // 2. federation endpoint fetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => mockFedResponse,
          });

        vi.stubGlobal("fetch", fetchMock);

        const result = await resolveFederationAddress("alice*customdomain.org");
        expect(result).not.toBeNull();
        expect(result?.account_id).toBe("GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5");
        expect(result?.memo).toBe("TEST-MEMO");
      });

      it("handles network error gracefully and returns fallback record", async () => {
        const fetchMock = vi.fn().mockRejectedValueOnce(new Error("Network timeout"));
        vi.stubGlobal("fetch", fetchMock);

        const result = await resolveFederationAddress("bob*unreachable.org");
        expect(result).not.toBeNull();
        expect(result?.stellar_address).toBe("bob*unreachable.org");
        expect(result?.domain).toBe("unreachable.org");
      });
    });
  });
});
