/**
 * tests/risk.test.ts
 *
 * Unit/integration tests for:
 *  - StrKey validation on the blocklist
 *  - Rule threshold evaluation
 *  - FlagResult reasons and labels
 *  - Blocklist add/remove + audit log
 *  - Rule updates + audit log
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  validateStellarAddress,
  addToBlocklist,
  removeFromBlocklist,
  updateRiskRules,
  evaluatePaymentRisk,
  blocklistStore,
  riskRulesStore,
  DEFAULT_RISK_RULES,
  type BlocklistEntry,
  type RiskRules,
} from "@/lib/risk";
import { auditLogStore } from "@/lib/unmatched-payments";

// Valid test Stellar addresses — these have correct CRC16 checksums
// (taken from lib/stellar/strkey.test.ts and payouts.test.ts)
const VALID_ADDR_1 = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
const VALID_ADDR_2 = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

function resetStores() {
  blocklistStore.set([]);
  riskRulesStore.set({ ...DEFAULT_RISK_RULES });
  auditLogStore.set([]);
}

// ─── validateStellarAddress ───────────────────────────────────────────────────

describe("validateStellarAddress", () => {
  it("accepts a valid G-address", () => {
    expect(validateStellarAddress(VALID_ADDR_1)).toEqual({ valid: true });
  });

  it("accepts a valid G-address with surrounding whitespace", () => {
    expect(validateStellarAddress(`  ${VALID_ADDR_1}  `)).toEqual({ valid: true });
  });

  it("rejects empty string", () => {
    const result = validateStellarAddress("");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toBeTruthy();
  });

  it("rejects a truncated address", () => {
    const result = validateStellarAddress("GDQP2KPQ");
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.error).toContain("valid Stellar");
  });

  it("rejects an address starting with wrong character", () => {
    const badAddr = "ADQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF";
    const result = validateStellarAddress(badAddr);
    expect(result.valid).toBe(false);
  });

  it("rejects a random non-stellar string", () => {
    expect(validateStellarAddress("not-an-address").valid).toBe(false);
  });
});

// ─── addToBlocklist ───────────────────────────────────────────────────────────

describe("addToBlocklist", () => {
  beforeEach(resetStores);

  it("adds a valid address and returns null", () => {
    const err = addToBlocklist(VALID_ADDR_1);
    expect(err).toBeNull();
    expect(blocklistStore.get()).toHaveLength(1);
    expect(blocklistStore.get()[0].address).toBe(VALID_ADDR_1);
  });

  it("stores the optional note", () => {
    addToBlocklist(VALID_ADDR_1, "Fraud");
    expect(blocklistStore.get()[0].note).toBe("Fraud");
  });

  it("returns an error string for invalid address", () => {
    const err = addToBlocklist("not-valid");
    expect(typeof err).toBe("string");
    expect(blocklistStore.get()).toHaveLength(0);
  });

  it("prevents duplicate entries", () => {
    addToBlocklist(VALID_ADDR_1);
    const err = addToBlocklist(VALID_ADDR_1);
    expect(err).toContain("already on the blocklist");
    expect(blocklistStore.get()).toHaveLength(1);
  });

  it("records an audit log entry", () => {
    addToBlocklist(VALID_ADDR_1, undefined, "TestOwner");
    const log = auditLogStore.get();
    expect(log).toHaveLength(1);
    expect(log[0].action).toContain("added to blocklist");
    expect(log[0].actor).toBe("TestOwner");
    expect(log[0].target).toBe(VALID_ADDR_1);
    expect(log[0].actionType).toBe("Risk");
  });
});

// ─── removeFromBlocklist ──────────────────────────────────────────────────────

describe("removeFromBlocklist", () => {
  beforeEach(() => {
    resetStores();
    blocklistStore.set([
      { address: VALID_ADDR_1, addedAt: new Date().toISOString() },
      { address: VALID_ADDR_2, addedAt: new Date().toISOString() },
    ] as BlocklistEntry[]);
  });

  it("removes the specified address", () => {
    removeFromBlocklist(VALID_ADDR_1);
    const list = blocklistStore.get();
    expect(list).toHaveLength(1);
    expect(list[0].address).toBe(VALID_ADDR_2);
  });

  it("records an audit log entry for removal", () => {
    removeFromBlocklist(VALID_ADDR_1, "TestOwner");
    const log = auditLogStore.get();
    expect(log[0].action).toContain("removed from blocklist");
    expect(log[0].target).toBe(VALID_ADDR_1);
    expect(log[0].actor).toBe("TestOwner");
  });
});

// ─── updateRiskRules ─────────────────────────────────────────────────────────

describe("updateRiskRules", () => {
  beforeEach(resetStores);

  it("updates only the patched fields", () => {
    updateRiskRules({ flagAboveAmount: 5000 });
    expect(riskRulesStore.get().flagAboveAmount).toBe(5000);
    expect(riskRulesStore.get().flagAboveAmountEnabled).toBe(false); // unchanged default
  });

  it("records an audit log entry", () => {
    updateRiskRules({ flagAboveAmountEnabled: true }, "Admin");
    const log = auditLogStore.get();
    expect(log[0].action).toContain("Risk rules updated");
    expect(log[0].actor).toBe("Admin");
    expect(log[0].actionType).toBe("Risk");
  });
});

// ─── evaluatePaymentRisk ─────────────────────────────────────────────────────

describe("evaluatePaymentRisk", () => {
  const noBlocklist: BlocklistEntry[] = [];
  const withBlocklist: BlocklistEntry[] = [
    { address: VALID_ADDR_1, addedAt: new Date().toISOString() },
  ];

  const disabledRules: RiskRules = {
    ...DEFAULT_RISK_RULES,
    flagAboveAmountEnabled: false,
    flagFirstTimePayerEnabled: false,
  };

  it("not flagged when no rules active and not on blocklist", () => {
    const result = evaluatePaymentRisk(VALID_ADDR_2, 500, false, noBlocklist, disabledRules);
    expect(result.flagged).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it("flags blocklisted address", () => {
    const result = evaluatePaymentRisk(VALID_ADDR_1, 10, false, withBlocklist, disabledRules);
    expect(result.flagged).toBe(true);
    expect(result.reasons).toContain("blocklisted_address");
    expect(result.reasonLabels).toContain("Blocklisted address");
  });

  it("flags amount exceeding threshold when rule is enabled", () => {
    const rules: RiskRules = {
      ...disabledRules,
      flagAboveAmountEnabled: true,
      flagAboveAmount: 1000,
    };
    const result = evaluatePaymentRisk(VALID_ADDR_2, 1500, false, noBlocklist, rules);
    expect(result.flagged).toBe(true);
    expect(result.reasons).toContain("amount_exceeds_threshold");
    expect(result.reasonLabels).toContain("Amount exceeds threshold");
  });

  it("does not flag amount at exactly the threshold (must exceed)", () => {
    const rules: RiskRules = {
      ...disabledRules,
      flagAboveAmountEnabled: true,
      flagAboveAmount: 1000,
    };
    const result = evaluatePaymentRisk(VALID_ADDR_2, 1000, false, noBlocklist, rules);
    expect(result.flagged).toBe(false);
  });

  it("flags first-time payer over threshold when rule is enabled", () => {
    const rules: RiskRules = {
      ...disabledRules,
      flagFirstTimePayerEnabled: true,
      flagFirstTimePayerAbove: 500,
    };
    const result = evaluatePaymentRisk(VALID_ADDR_2, 750, true, noBlocklist, rules);
    expect(result.flagged).toBe(true);
    expect(result.reasons).toContain("first_time_payer_over_threshold");
    expect(result.reasonLabels).toContain("First-time payer over threshold");
  });

  it("does not flag first-time payer rule when isFirstTimePayer=false", () => {
    const rules: RiskRules = {
      ...disabledRules,
      flagFirstTimePayerEnabled: true,
      flagFirstTimePayerAbove: 500,
    };
    const result = evaluatePaymentRisk(VALID_ADDR_2, 750, false, noBlocklist, rules);
    expect(result.flagged).toBe(false);
  });

  it("accumulates multiple reasons", () => {
    const rules: RiskRules = {
      flagAboveAmountEnabled: true,
      flagAboveAmount: 100,
      flagFirstTimePayerEnabled: true,
      flagFirstTimePayerAbove: 50,
    };
    const result = evaluatePaymentRisk(VALID_ADDR_1, 200, true, withBlocklist, rules);
    expect(result.flagged).toBe(true);
    expect(result.reasons.length).toBe(3);
    expect(result.reasons).toContain("blocklisted_address");
    expect(result.reasons).toContain("amount_exceeds_threshold");
    expect(result.reasons).toContain("first_time_payer_over_threshold");
  });
});
