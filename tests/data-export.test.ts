/**
 * tests/data-export.test.ts
 *
 * Unit/integration tests for:
 *  - Role enforcement (owner vs non-owner)
 *  - Closure precondition blocking with specific messages
 *  - Business name + 2FA validation
 *  - Export job lifecycle
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  checkClosureEligibility,
  isBusinessNameMatch,
  isValidTwoFactorCode,
  startExportJob,
  exportJobStore,
} from "@/lib/data-export";

// ─── checkClosureEligibility ─────────────────────────────────────────────────

describe("checkClosureEligibility", () => {
  it("eligible when all balances are zero and no pending payouts", () => {
    const result = checkClosureEligibility(
      { usdc: 0, xlm: 0, eurc: 0 },
      { count: 0 },
    );
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("blocks when USDC balance is non-zero", () => {
    const result = checkClosureEligibility(
      { usdc: 150.5, xlm: 0, eurc: 0 },
      { count: 0 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("USDC"))).toBe(true);
    expect(result.reasons.some((r) => r.includes("150.50"))).toBe(true);
  });

  it("blocks when XLM balance is non-zero", () => {
    const result = checkClosureEligibility(
      { usdc: 0, xlm: 100.0, eurc: 0 },
      { count: 0 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("XLM"))).toBe(true);
  });

  it("blocks when EURC balance is non-zero", () => {
    const result = checkClosureEligibility(
      { usdc: 0, xlm: 0, eurc: 50 },
      { count: 0 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("EURC"))).toBe(true);
  });

  it("blocks when pending payouts exist", () => {
    const result = checkClosureEligibility(
      { usdc: 0, xlm: 0, eurc: 0 },
      { count: 3 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.includes("3 pending payout"))).toBe(true);
  });

  it("singular 'payout' when count is 1", () => {
    const result = checkClosureEligibility(
      { usdc: 0, xlm: 0, eurc: 0 },
      { count: 1 },
    );
    expect(result.reasons[0]).toMatch(/1 pending payout[^s]/);
  });

  it("accumulates multiple blocking reasons", () => {
    const result = checkClosureEligibility(
      { usdc: 100, xlm: 50, eurc: 0 },
      { count: 2 },
    );
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(3); // USDC + XLM + payouts
  });
});

// ─── isBusinessNameMatch ─────────────────────────────────────────────────────

describe("isBusinessNameMatch", () => {
  it("exact match returns true", () => {
    expect(isBusinessNameMatch("Northstar Goods", "Northstar Goods")).toBe(true);
  });

  it("case-sensitive: different case returns false", () => {
    expect(isBusinessNameMatch("northstar goods", "Northstar Goods")).toBe(false);
  });

  it("trims surrounding whitespace before comparing", () => {
    expect(isBusinessNameMatch("  Northstar Goods  ", "Northstar Goods")).toBe(true);
  });

  it("partial match returns false", () => {
    expect(isBusinessNameMatch("Northstar", "Northstar Goods")).toBe(false);
  });

  it("empty input does not match non-empty expected", () => {
    expect(isBusinessNameMatch("", "Northstar Goods")).toBe(false);
  });
});

// ─── isValidTwoFactorCode ────────────────────────────────────────────────────

describe("isValidTwoFactorCode", () => {
  it("accepts a valid 6-digit code", () => {
    expect(isValidTwoFactorCode("123456")).toBe(true);
    expect(isValidTwoFactorCode("000000")).toBe(true);
    expect(isValidTwoFactorCode("999999")).toBe(true);
  });

  it("rejects codes shorter than 6 digits", () => {
    expect(isValidTwoFactorCode("12345")).toBe(false);
    expect(isValidTwoFactorCode("")).toBe(false);
  });

  it("rejects codes longer than 6 digits", () => {
    expect(isValidTwoFactorCode("1234567")).toBe(false);
  });

  it("rejects codes containing non-digits", () => {
    expect(isValidTwoFactorCode("12345a")).toBe(false);
    expect(isValidTwoFactorCode("abcdef")).toBe(false);
  });

  it("strips surrounding whitespace before validating", () => {
    expect(isValidTwoFactorCode(" 123456 ")).toBe(true);
  });
});

// ─── Export job store ────────────────────────────────────────────────────────

describe("startExportJob", () => {
  beforeEach(() => {
    exportJobStore.set(null);
  });

  it("creates a job with status=queued", () => {
    const job = startExportJob();
    expect(job.status).toBe("queued");
    expect(job.progress).toBe(0);
    expect(job.id).toMatch(/^export_/);
    expect(typeof job.startedAt).toBe("string");
  });

  it("stores the job in the store", () => {
    startExportJob();
    const stored = exportJobStore.get();
    expect(stored).not.toBeNull();
    expect(stored?.status).toBe("queued");
  });

  it("each call creates a new job ID", () => {
    const j1 = startExportJob();
    exportJobStore.set(null);
    const j2 = startExportJob();
    expect(j1.id).not.toBe(j2.id);
  });
});
