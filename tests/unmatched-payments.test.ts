/**
 * tests/unmatched-payments.test.ts
 *
 * Unit/integration tests for the Unmatched Payments Reconciliation Inbox:
 * - Inbox filtering (pending vs resolved)
 * - Manual match action
 * - Refund to sender action
 * - Audit log recording
 * - Sidebar badge count calculation
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  unmatchedStore,
  auditLogStore,
  manualMatch,
  refundToSender,
  pendingCount,
  type UnmatchedPayment,
} from "@/lib/unmatched-payments";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SAMPLE: UnmatchedPayment[] = [
  {
    id: "u_001",
    senderAddress: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF",
    amount: 100,
    asset: "USDC",
    txHash: "aabbccdd",
    rawMemo: "ORDER-X",
    timestamp: "2026-11-01T10:00:00.000Z",
    status: "pending",
  },
  {
    id: "u_002",
    senderAddress: "GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A",
    amount: 50,
    asset: "XLM",
    txHash: "eeff0011",
    rawMemo: undefined,
    timestamp: "2026-11-02T12:00:00.000Z",
    status: "pending",
  },
  {
    id: "u_003",
    senderAddress: "GBT5PBINLNRI5RJPJBOPSMODBGIHALJQJ2ISTANRF54BGM2WVIBECCNB",
    amount: 200,
    asset: "USDC",
    txHash: "22334455",
    timestamp: "2026-11-03T08:00:00.000Z",
    status: "matched",
    matchedTo: { type: "invoice", id: "inv_x", label: "INV-X" },
  },
];

function resetStores() {
  unmatchedStore.set(SAMPLE.map((p) => ({ ...p })));
  auditLogStore.set([]);
}

// ─── pendingCount ─────────────────────────────────────────────────────────────

describe("pendingCount", () => {
  it("counts only pending items", () => {
    expect(pendingCount(SAMPLE)).toBe(2);
  });

  it("returns 0 when all resolved", () => {
    const all = SAMPLE.map((p) => ({ ...p, status: "matched" as const }));
    expect(pendingCount(all)).toBe(0);
  });

  it("returns total when all pending", () => {
    const all = SAMPLE.map((p) => ({ ...p, status: "pending" as const }));
    expect(pendingCount(all)).toBe(3);
  });
});

// ─── Inbox filtering ──────────────────────────────────────────────────────────

describe("inbox filtering", () => {
  it("pending items are filtered from resolved items", () => {
    const pending = SAMPLE.filter((p) => p.status === "pending");
    const resolved = SAMPLE.filter((p) => p.status !== "pending");
    expect(pending).toHaveLength(2);
    expect(resolved).toHaveLength(1);
    expect(resolved[0].id).toBe("u_003");
  });

  it("filters by asset", () => {
    const usdc = SAMPLE.filter((p) => p.asset === "USDC");
    expect(usdc).toHaveLength(2);
  });
});

// ─── manualMatch ─────────────────────────────────────────────────────────────

describe("manualMatch", () => {
  beforeEach(resetStores);

  it("sets status to matched with matchedTo populated", () => {
    manualMatch("u_001", { type: "invoice", id: "inv_42", label: "INV-42" });
    const updated = unmatchedStore.get().find((p) => p.id === "u_001")!;
    expect(updated.status).toBe("matched");
    expect(updated.matchedTo?.id).toBe("inv_42");
    expect(updated.matchedTo?.type).toBe("invoice");
  });

  it("does not affect other items", () => {
    manualMatch("u_001", { type: "payment_link", id: "pl_1", label: "PL1" });
    const other = unmatchedStore.get().find((p) => p.id === "u_002")!;
    expect(other.status).toBe("pending");
  });

  it("records an audit log entry", () => {
    manualMatch("u_001", { type: "customer", id: "cust_1", label: "Alice" }, "TestActor");
    const log = auditLogStore.get();
    expect(log).toHaveLength(1);
    expect(log[0].actionType).toBe("Reconciliation");
    expect(log[0].action).toContain("manually matched");
    expect(log[0].actor).toBe("TestActor");
    expect(log[0].target).toContain("u_001");
  });

  it("decrements pending count after match", () => {
    manualMatch("u_001", { type: "invoice", id: "inv_x", label: "X" });
    manualMatch("u_002", { type: "invoice", id: "inv_y", label: "Y" });
    expect(pendingCount(unmatchedStore.get())).toBe(0);
  });
});

// ─── refundToSender ───────────────────────────────────────────────────────────

describe("refundToSender", () => {
  beforeEach(resetStores);

  it("sets status to refunded with txHash", () => {
    refundToSender("u_002", "refund_tx_abc123");
    const updated = unmatchedStore.get().find((p) => p.id === "u_002")!;
    expect(updated.status).toBe("refunded");
    expect(updated.refundTxHash).toBe("refund_tx_abc123");
  });

  it("records an audit log entry", () => {
    refundToSender("u_002", "tx_xyz", "Owner");
    const log = auditLogStore.get();
    expect(log).toHaveLength(1);
    expect(log[0].action).toContain("refunded to sender");
    expect(log[0].actor).toBe("Owner");
    expect(log[0].target).toContain("u_002");
    expect(log[0].target).toContain("tx_xyz");
  });

  it("removes item from pending inbox", () => {
    refundToSender("u_001", "tx_123");
    expect(pendingCount(unmatchedStore.get())).toBe(1); // u_002 still pending
  });
});

// ─── Sidebar badge count ──────────────────────────────────────────────────────

describe("sidebar badge count integration", () => {
  beforeEach(resetStores);

  it("badge starts at 2 (two pending items in sample)", () => {
    expect(pendingCount(unmatchedStore.get())).toBe(2);
  });

  it("badge decrements after each resolution", () => {
    manualMatch("u_001", { type: "invoice", id: "i1", label: "I1" });
    expect(pendingCount(unmatchedStore.get())).toBe(1);

    refundToSender("u_002", "tx_refund");
    expect(pendingCount(unmatchedStore.get())).toBe(0);
  });
});
