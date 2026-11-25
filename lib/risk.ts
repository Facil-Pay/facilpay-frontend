/**
 * lib/risk.ts
 *
 * Address blocklist and configurable risk rules.
 * Rules are stored in localStorage and evaluated at payment render time.
 * All mutations record an audit log entry.
 */

import { createLocalStore } from "./local-store";
import { StrKey } from "./stellar/strkey";
import { auditLogStore, type AuditActionType } from "./unmatched-payments";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlocklistEntry {
  address: string;
  /** Optional human note, e.g. "Known fraud address" */
  note?: string;
  addedAt: string;
}

export interface RiskRules {
  /** Flag payments above this amount (in USD). 0 = disabled. */
  flagAboveAmount: number;
  flagAboveAmountEnabled: boolean;
  /** Flag first-time payers above this amount (in USD). 0 = disabled. */
  flagFirstTimePayerAbove: number;
  flagFirstTimePayerEnabled: boolean;
}

export const DEFAULT_RISK_RULES: RiskRules = {
  flagAboveAmount: 10_000,
  flagAboveAmountEnabled: false,
  flagFirstTimePayerAbove: 1_000,
  flagFirstTimePayerEnabled: false,
};

// ─── Stores ───────────────────────────────────────────────────────────────────

export const blocklistStore = createLocalStore<BlocklistEntry[]>(
  "facilpay_blocklist",
  [],
);

export const riskRulesStore = createLocalStore<RiskRules>(
  "facilpay_risk_rules",
  DEFAULT_RISK_RULES,
);

export const useBlocklist = blocklistStore.useStore;
export const useRiskRules = riskRulesStore.useStore;

// ─── Validation ───────────────────────────────────────────────────────────────

export type AddressValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export function validateStellarAddress(address: string): AddressValidationResult {
  const trimmed = address.trim();
  if (!trimmed) {
    return { valid: false, error: "Address cannot be empty." };
  }
  if (!StrKey.isValidAddress(trimmed)) {
    return {
      valid: false,
      error:
        "Not a valid Stellar address. Must be a 56-character G… public key or a 69-character M… muxed account.",
    };
  }
  return { valid: true };
}

// ─── Audit helper ─────────────────────────────────────────────────────────────

function appendAudit(
  action: string,
  target: string,
  actor = "Merchant",
  actionType: AuditActionType = "Risk",
): void {
  auditLogStore.set((log) => [
    {
      id: `evt_${Math.random().toString(36).slice(2, 10)}`,
      actor,
      actionType,
      action,
      target,
      ip: "—",
      timestamp: new Date().toISOString(),
    },
    ...log,
  ]);
}

// ─── Blocklist actions ────────────────────────────────────────────────────────

/**
 * Add an address to the blocklist.
 * Returns an error string on validation failure, null on success.
 */
export function addToBlocklist(
  address: string,
  note?: string,
  actor = "Merchant",
): string | null {
  const validation = validateStellarAddress(address);
  if (!validation.valid) return validation.error;

  const trimmed = address.trim();
  const existing = blocklistStore.get().some((e) => e.address === trimmed);
  if (existing) return "This address is already on the blocklist.";

  blocklistStore.set((list) => [
    ...list,
    { address: trimmed, note, addedAt: new Date().toISOString() },
  ]);

  appendAudit("Address added to blocklist", trimmed, actor);
  return null;
}

/**
 * Remove an address from the blocklist.
 */
export function removeFromBlocklist(address: string, actor = "Merchant"): void {
  blocklistStore.set((list) => list.filter((e) => e.address !== address));
  appendAudit("Address removed from blocklist", address, actor);
}

// ─── Risk rule actions ────────────────────────────────────────────────────────

export function updateRiskRules(
  patch: Partial<RiskRules>,
  actor = "Merchant",
): void {
  riskRulesStore.set((rules) => ({ ...rules, ...patch }));
  appendAudit(
    "Risk rules updated",
    JSON.stringify(patch),
    actor,
  );
}

// ─── Flag evaluation ──────────────────────────────────────────────────────────

export type FlagReason =
  | "blocklisted_address"
  | "amount_exceeds_threshold"
  | "first_time_payer_over_threshold";

export interface FlagResult {
  flagged: boolean;
  reasons: FlagReason[];
  /** Human-readable labels for each reason */
  reasonLabels: string[];
}

const REASON_LABELS: Record<FlagReason, string> = {
  blocklisted_address: "Blocklisted address",
  amount_exceeds_threshold: "Amount exceeds threshold",
  first_time_payer_over_threshold: "First-time payer over threshold",
};

/**
 * Evaluate a payment against the current blocklist and risk rules.
 *
 * @param senderAddress  The Stellar sender address.
 * @param amountUsd      Payment amount in USD.
 * @param isFirstTimePayer  Whether this is the sender's first payment.
 */
export function evaluatePaymentRisk(
  senderAddress: string,
  amountUsd: number,
  isFirstTimePayer: boolean,
  blocklist: BlocklistEntry[],
  rules: RiskRules,
): FlagResult {
  const reasons: FlagReason[] = [];

  if (blocklist.some((e) => e.address === senderAddress.trim())) {
    reasons.push("blocklisted_address");
  }

  if (rules.flagAboveAmountEnabled && amountUsd > rules.flagAboveAmount) {
    reasons.push("amount_exceeds_threshold");
  }

  if (
    rules.flagFirstTimePayerEnabled &&
    isFirstTimePayer &&
    amountUsd > rules.flagFirstTimePayerAbove
  ) {
    reasons.push("first_time_payer_over_threshold");
  }

  return {
    flagged: reasons.length > 0,
    reasons,
    reasonLabels: reasons.map((r) => REASON_LABELS[r]),
  };
}
