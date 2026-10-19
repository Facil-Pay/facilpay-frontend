import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateXlmReserve,
  mapHorizonBalance,
  mapHorizonOperation,
  fetchAccountBalances,
  fetchAccountOperations,
  STELLAR_BASE_RESERVE,
} from "./horizon";

describe("Horizon Service & Balance Helpers", () => {
  describe("calculateXlmReserve", () => {
    it("computes minimum reserve accurately based on subentry counts and base reserve", () => {
      // 0 subentries: (2 + 0) * 0.5 = 1.0 XLM minimum reserve
      const zeroSubentries = calculateXlmReserve(100, 0, 0);
      expect(zeroSubentries.minReserve).toBe(1.0);
      expect(zeroSubentries.available).toBe(99.0);
      expect(zeroSubentries.baseReserve).toBe(STELLAR_BASE_RESERVE);

      // 4 subentries (e.g. 4 trustlines): (2 + 4) * 0.5 = 3.0 XLM reserve
      const fourSubentries = calculateXlmReserve(10, 4, 0);
      expect(fourSubentries.minReserve).toBe(3.0);
      expect(fourSubentries.available).toBe(7.0);
    });

    it("subtracts selling liabilities from available balance", () => {
      // 100 total, 1 reserve, 5 selling liabilities -> 94 available
      const withLiabilities = calculateXlmReserve(100, 0, 5);
      expect(withLiabilities.available).toBe(94.0);
      expect(withLiabilities.sellingLiabilities).toBe(5);
    });

    it("prevents available balance from dropping below zero", () => {
      const underReserve = calculateXlmReserve(0.5, 2, 0); // minReserve = 2.0
      expect(underReserve.available).toBe(0);
    });
  });

  describe("mapHorizonBalance", () => {
    it("maps native XLM balance correctly with reserve details", () => {
      const nativeBalance = {
        asset_type: "native" as const,
        balance: "50.5000000",
        selling_liabilities: "0.0000000",
      };

      const mapped = mapHorizonBalance(nativeBalance, 2);
      expect(mapped.isNative).toBe(true);
      expect(mapped.assetCode).toBe("XLM");
      expect(mapped.totalBalance).toBe(50.5);
      expect(mapped.subentryCount).toBe(2);
      expect(mapped.reserveDetails).toBeDefined();
      expect(mapped.stellarExpertUrl).toContain("stellar.expert");
    });

    it("maps credit asset balance with code and issuer", () => {
      const creditBalance = {
        asset_type: "credit_alphanum4" as const,
        asset_code: "USDC",
        asset_issuer: "GA5XIGA5C7QTPTWXQHY6MCJRMTRZDOSHR6QVIBHSNDMS6NOSTIQS5KDU",
        balance: "1250.75",
        limit: "10000.00",
      };

      const mapped = mapHorizonBalance(creditBalance);
      expect(mapped.isNative).toBe(false);
      expect(mapped.assetCode).toBe("USDC");
      expect(mapped.assetIssuer).toBe(creditBalance.asset_issuer);
      expect(mapped.totalBalance).toBe(1250.75);
      expect(mapped.availableBalance).toBe(1250.75);
      expect(mapped.limit).toBe("10000.00");
    });
  });

  describe("mapHorizonOperation", () => {
    it("maps payment operation to human-readable label and URL", () => {
      const op = {
        id: "123456789",
        type: "payment",
        created_at: "2026-10-19T10:00:00Z",
        transaction_hash: "abcd1234efgh5678",
        amount: "100.00",
        asset_type: "native",
        from: "GFROM",
        to: "GTO",
      };

      const mapped = mapHorizonOperation(op);
      expect(mapped.id).toBe("123456789");
      expect(mapped.typeLabel).toBe("Payment Received / Sent");
      expect(mapped.transactionHash).toBe("abcd1234efgh5678");
      expect(mapped.details.amount).toBe("100.00");
    });

    it("maps change_trust operation", () => {
      const op = {
        id: "987654321",
        type: "change_trust",
        created_at: "2026-10-19T10:05:00Z",
        transaction_hash: "txhash123",
        asset_code: "USDC",
        asset_issuer: "GISSUER",
        limit: "5000",
      };

      const mapped = mapHorizonOperation(op);
      expect(mapped.typeLabel).toBe("Trustline Modified");
      expect(mapped.details.assetCode).toBe("USDC");
    });
  });

  describe("fetchAccountBalances & fetchAccountOperations error resilience", () => {
    beforeEach(() => {
      vi.stubGlobal("fetch", vi.fn());
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("returns empty array and null error if account not found (404 / inactive)", async () => {
      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 404,
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchAccountBalances("GNEWACCOUNT");
      expect(result.balances).toEqual([]);
      expect(result.error).toBeNull();
    });

    it("handles Horizon network failure gracefully", async () => {
      const fetchMock = vi.fn().mockRejectedValueOnce(new Error("Horizon timeout"));
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchAccountBalances("GFAILEDACCOUNT");
      expect(result.balances).toEqual([]);
      expect(result.error).toContain("Horizon timeout");
    });

    it("fetches and maps operations list", async () => {
      const mockOpsResponse = {
        _embedded: {
          records: [
            {
              id: "1",
              type: "create_account",
              created_at: "2026-10-19T00:00:00Z",
              transaction_hash: "tx1",
              starting_balance: "10.00",
              funder: "GFUNDER",
            },
          ],
        },
      };

      const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockOpsResponse,
      });
      vi.stubGlobal("fetch", fetchMock);

      const result = await fetchAccountOperations("GACCOUNT");
      expect(result.operations.length).toBe(1);
      expect(result.operations[0].typeLabel).toBe("Account Created");
    });
  });
});
