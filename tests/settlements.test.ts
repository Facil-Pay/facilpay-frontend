import { describe, expect, it } from "vitest";
import {
  calculateBatchMetrics,
  generateSettlementBatchesCsv,
  generateSingleBatchCsv,
  generateSettlementPdf,
  INITIAL_SETTLEMENT_BATCHES,
  type SettlementBatch,
  type SettlementPayment,
} from "@/lib/settlements";
import { canAccessPath, requiredPermissionForPath } from "@/lib/permissions";

describe("settlement reconciliation math and mismatch detection", () => {
  it("calculates balanced metrics when on-chain matches expected net", () => {
    const payments: SettlementPayment[] = [
      { id: "p1", amount: 1000, asset: "USDC", fee: 10, status: "completed", customerEmail: "a@test.com", customerWallet: "GA...", createdAt: "2026-10-18T10:00:00Z" },
      { id: "p2", amount: 500, asset: "USDC", fee: 5, status: "completed", customerEmail: "b@test.com", customerWallet: "GB...", createdAt: "2026-10-18T11:00:00Z" },
      { id: "p3", amount: 100, asset: "USDC", fee: 0, status: "refunded", customerEmail: "c@test.com", customerWallet: "GC...", createdAt: "2026-10-18T12:00:00Z" },
    ];

    // Gross: 1500, Refunds: 100, Fees: 15. Expected Net: 1500 - 100 - 15 = 1385.
    const metrics = calculateBatchMetrics(payments, 1385.0);

    expect(metrics.gross).toBe(1500);
    expect(metrics.refunds).toBe(100);
    expect(metrics.fees).toBe(15);
    expect(metrics.net).toBe(1385);
    expect(metrics.variance).toBe(0);
    expect(metrics.status).toBe("balanced");
  });

  it("detects and flags discrepancies when on-chain settled differs from expected net", () => {
    const payments: SettlementPayment[] = [
      { id: "p1", amount: 2000, asset: "USDC", fee: 20, status: "completed", customerEmail: "a@test.com", customerWallet: "GA...", createdAt: "2026-10-18T10:00:00Z" },
    ];

    // Expected Net: 2000 - 20 = 1980. On-chain settled: 1950 (-30 variance)
    const metrics = calculateBatchMetrics(payments, 1950.0);

    expect(metrics.gross).toBe(2000);
    expect(metrics.fees).toBe(20);
    expect(metrics.net).toBe(1980);
    expect(metrics.variance).toBe(-30);
    expect(metrics.status).toBe("mismatch");
  });

  it("ensures all pre-configured batches satisfy mathematical integrity", () => {
    for (const batch of INITIAL_SETTLEMENT_BATCHES) {
      const calculated = calculateBatchMetrics(batch.payments, batch.onChainSettled);
      expect(calculated.gross).toBe(batch.gross);
      expect(calculated.refunds).toBe(batch.refunds);
      expect(calculated.fees).toBe(batch.fees);
      expect(calculated.net).toBe(batch.net);
      expect(calculated.variance).toBe(batch.variance);
      expect(calculated.status).toBe(batch.status);
    }
  });
});

describe("settlement CSV export generation", () => {
  it("generates valid batches summary CSV", () => {
    const csv = generateSettlementBatchesCsv(INITIAL_SETTLEMENT_BATCHES);
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe(
      "Batch ID,Cadence,Period,Asset,Gross Volume,Refunds,Fees,Expected Net,On-Chain Settled,Variance,Reconciliation Status,Settlement Account"
    );
    expect(lines.length).toBeGreaterThan(INITIAL_SETTLEMENT_BATCHES.length);
    expect(csv).toContain("batch_20261018_d01");
    expect(csv).toContain("BALANCED");
    expect(csv).toContain("MISMATCH");
  });

  it("generates comprehensive single batch breakdown CSV with payments and on-chain txs", () => {
    const batch = INITIAL_SETTLEMENT_BATCHES[0];
    const csv = generateSingleBatchCsv(batch);

    expect(csv).toContain("Settlement Batch Report");
    expect(csv).toContain(batch.id);
    expect(csv).toContain("PAYMENTS INCLUDED IN BATCH");
    expect(csv).toContain("ON-CHAIN SETTLEMENT TRANSACTIONS");
    expect(csv).toContain(batch.payments[0].id);
    expect(csv).toContain(batch.transactions[0].txHash);
  });
});

describe("settlement PDF statement generation", () => {
  it("generates valid PDF 1.4 blob with required headers and financial entries", async () => {
    const batch = INITIAL_SETTLEMENT_BATCHES[0];
    const pdfBlob = generateSettlementPdf(batch);

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe("application/pdf");
    expect(pdfBlob.size).toBeGreaterThan(500);

    const buffer = await pdfBlob.arrayBuffer();
    const decoder = new TextDecoder("latin1");
    const text = decoder.decode(buffer);

    expect(text).toContain("%PDF-1.4");
    expect(text).toContain("%%EOF");
    expect(text).toContain("FacilPay");
    expect(text).toContain("SETTLEMENT RECONCILIATION STATEMENT");
    expect(text).toContain("RECONCILIATION STATUS: 100% BALANCED");
  });

  it("generates mismatch alert in PDF statement when variance exists", async () => {
    const mismatchBatch = INITIAL_SETTLEMENT_BATCHES.find((b) => b.status === "mismatch")!;
    const pdfBlob = generateSettlementPdf(mismatchBatch);
    const buffer = await pdfBlob.arrayBuffer();
    const text = new TextDecoder("latin1").decode(buffer);

    expect(text).toContain("DISCREPANCY DETECTED");
  });
});

describe("settlement route permissions", () => {
  it("guards /reports/settlements requiring payments:view permission", () => {
    expect(requiredPermissionForPath("/reports/settlements")).toBe("payments:view");
    expect(canAccessPath("owner", "/reports/settlements")).toBe(true);
    expect(canAccessPath("admin", "/reports/settlements")).toBe(true);
    expect(canAccessPath("developer", "/reports/settlements")).toBe(true);
    expect(canAccessPath("support", "/reports/settlements")).toBe(true);
    expect(canAccessPath("viewer", "/reports/settlements")).toBe(true);
    expect(canAccessPath(null, "/reports/settlements")).toBe(false);
  });
});
