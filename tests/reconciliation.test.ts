import {
  parseSettlementCsv,
  reconcileSettlement,
  type ReconciliationActivity,
  type SettlementEntry,
} from "@/lib/reconciliation";

const activity: ReconciliationActivity = {
  id: "pay-1",
  date: "2026-04-10T12:00:00.000Z",
  type: "Payment",
  reference: "tx-001",
  asset: "USDC",
  amount: 125.5,
};

describe("settlement CSV parsing", () => {
  test("parses quoted fields, signed amounts, and debit/credit direction", () => {
    const entries = parseSettlementCsv(
      'Posted Date,Net Amount,Currency,Transaction Hash,Direction\r\n"2026-04-10T12:00:00Z",125.50,USDC,"tx,001",Credit\r\n2026-04-11,-10,EURC,tx-002,Debit',
    );

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ reference: "tx,001", asset: "USDC", amount: 125.5 });
    expect(entries[1]).toMatchObject({ asset: "EURC", amount: -10 });
  });

  test("supports accounting negatives and rejects missing required columns", () => {
    expect(parseSettlementCsv("Date,Amount,Asset\n2026-04-10,(25.00),XLM")[0].amount).toBe(-25);
    expect(() => parseSettlementCsv("Date,Amount\n2026-04-10,25")).toThrow("Required columns");
  });

  test("reports the source row for invalid amounts", () => {
    expect(() => parseSettlementCsv("Date,Amount,Asset\n2026-04-10,nope,USDC")).toThrow("Row 2");
  });
});

describe("settlement reconciliation", () => {
  test("matches by reference and reports amount mismatches", () => {
    const statement: SettlementEntry[] = [{
      id: "statement-1",
      date: activity.date,
      reference: "TX-001",
      asset: "USDC",
      amount: 120,
    }];

    expect(reconcileSettlement([activity], statement)[0]).toMatchObject({
      status: "Mismatch",
      difference: -5.5,
    });
  });

  test("matches by asset, signed amount, and nearby date when no reference is provided", () => {
    const statement: SettlementEntry[] = [{
      id: "statement-1",
      date: "2026-04-11T12:00:00.000Z",
      reference: "",
      asset: "usdc",
      amount: 125.5,
    }];

    expect(reconcileSettlement([activity], statement)[0].status).toBe("Matched");
  });

  test("keeps missing FacilPay activity and unmatched statement entries visible", () => {
    const statement: SettlementEntry[] = [{
      id: "statement-1",
      date: activity.date,
      reference: "other-tx",
      asset: "USDC",
      amount: 999,
    }];

    expect(reconcileSettlement([activity], statement).map((row) => row.status)).toEqual([
      "Missing statement",
      "Unmatched statement",
    ]);
  });
});