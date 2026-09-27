/**
 * lib/types/escrow.ts
 *
 * Escrow domain types.
 * An Escrow holds funds on-chain between a payer and payee until release
 * conditions are met or the escrow is disputed / cancelled.
 */

export type EscrowStatus =
  | "pending"
  | "funded"
  | "release_pending"
  | "released"
  | "disputed"
  | "cancelled"
  | "expired";

export interface EscrowCondition {
  id: string;
  type: "time_lock" | "approval" | "multi_sig" | "oracle";
  description: string;
  /** ISO 8601 — for time-lock conditions */
  unlockAt?: string;
  isMet: boolean;
  metAt?: string;
}

export interface Escrow {
  id: string;
  reference: string;
  status: EscrowStatus;

  payerId: string;
  payeeId: string;

  amount: number;
  currency: string;
  amountUsd?: number;

  /** Soroban contract address managing this escrow */
  contractId?: string;
  /** On-chain account holding the escrowed funds */
  escrowAddress?: string;

  conditions: EscrowCondition[];

  description?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  releasedAt?: string;
}

export interface CreateEscrowRequest {
  payerId: string;
  payeeId: string;
  amount: number;
  currency: string;
  conditions: Omit<EscrowCondition, "id" | "isMet" | "metAt">[];
  description?: string;
  expiresAt?: string;
}

export interface ReleaseEscrowRequest {
  escrowId: string;
  note?: string;
}
