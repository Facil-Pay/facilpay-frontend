/**
 * lib/api/keys.ts
 *
 * TanStack Query key factories for every domain.
 *
 * Centralising keys here means:
 *  - Keys are consistent across hooks (no accidental mismatches)
 *  - Invalidation is surgical: paymentKeys.all() invalidates every payment
 *    query; paymentKeys.detail(id) invalidates exactly one
 *  - Adding a new key shape is a single-file change
 *
 * Convention: each factory returns a readonly tuple so TypeScript can narrow
 * the type and TanStack Query can do structural equality checks correctly.
 *
 * Usage:
 *   queryClient.invalidateQueries({ queryKey: paymentKeys.all() });
 *   useQuery({ queryKey: paymentKeys.detail(id), queryFn: … });
 */

import type { PaymentListParams }  from "@/lib/types/payment";
import type { PaginationParams }   from "@/lib/types/pagination";

// ─── Payments ─────────────────────────────────────────────────────────────────

export const paymentKeys = {
  /** Matches every payment query */
  all: ()                          => ["payments"]                           as const,
  /** Matches all payment list queries (any filter) */
  lists: ()                        => [...paymentKeys.all(), "list"]         as const,
  /** Matches one specific list query */
  list: (params: PaymentListParams)=> [...paymentKeys.lists(), params]       as const,
  /** Matches all payment detail queries */
  details: ()                      => [...paymentKeys.all(), "detail"]       as const,
  /** Matches one payment detail by ID */
  detail: (id: string)             => [...paymentKeys.details(), id]         as const,
  /** Timeline events for one payment */
  events: (id: string)             => [...paymentKeys.detail(id), "events"]  as const,
} as const;

// ─── Refunds ──────────────────────────────────────────────────────────────────

export const refundKeys = {
  all: ()                          => ["refunds"]                            as const,
  lists: ()                        => [...refundKeys.all(), "list"]          as const,
  list: (params: PaginationParams) => [...refundKeys.lists(), params]        as const,
  details: ()                      => [...refundKeys.all(), "detail"]        as const,
  detail: (id: string)             => [...refundKeys.details(), id]          as const,
  byPayment: (paymentId: string)   => [...refundKeys.all(), "byPayment", paymentId] as const,
} as const;

// ─── Escrow ───────────────────────────────────────────────────────────────────

export const escrowKeys = {
  all: ()                          => ["escrows"]                            as const,
  lists: ()                        => [...escrowKeys.all(), "list"]          as const,
  list: (params: PaginationParams) => [...escrowKeys.lists(), params]        as const,
  details: ()                      => [...escrowKeys.all(), "detail"]        as const,
  detail: (id: string)             => [...escrowKeys.details(), id]          as const,
} as const;

// ─── Webhooks ─────────────────────────────────────────────────────────────────

export const webhookKeys = {
  all: ()                          => ["webhooks"]                           as const,
  lists: ()                        => [...webhookKeys.all(), "list"]         as const,
  list: (params: PaginationParams) => [...webhookKeys.lists(), params]       as const,
  details: ()                      => [...webhookKeys.all(), "detail"]       as const,
  detail: (id: string)             => [...webhookKeys.details(), id]         as const,
  deliveries: (id: string)         => [...webhookKeys.detail(id), "deliveries"] as const,
} as const;

// ─── API Keys ─────────────────────────────────────────────────────────────────

export const apiKeyKeys = {
  all: ()                          => ["apiKeys"]                            as const,
  lists: ()                        => [...apiKeyKeys.all(), "list"]          as const,
  list: (params: PaginationParams) => [...apiKeyKeys.lists(), params]        as const,
  detail: (id: string)             => [...apiKeyKeys.all(), "detail", id]    as const,
} as const;

// ─── Merchant ─────────────────────────────────────────────────────────────────

export const merchantKeys = {
  all: ()                          => ["merchant"]                           as const,
  profile: ()                      => [...merchantKeys.all(), "profile"]     as const,
  team: ()                         => [...merchantKeys.all(), "team"]        as const,
  teamMember: (id: string)         => [...merchantKeys.team(), id]           as const,
} as const;

// ─── Payouts ──────────────────────────────────────────────────────────────────

export const payoutKeys = {
  all: ()                          => ["payouts"]                            as const,
  lists: ()                        => [...payoutKeys.all(), "list"]          as const,
  list: (params: PaginationParams) => [...payoutKeys.lists(), params]        as const,
  detail: (id: string)             => [...payoutKeys.all(), "detail", id]    as const,
} as const;

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardKeys = {
  all: ()                          => ["dashboard"]                          as const,
  overview: ()                     => [...dashboardKeys.all(), "overview"]   as const,
} as const;

// ─── Stellar ──────────────────────────────────────────────────────────────────

export const stellarKeys = {
  all: ()                          => ["stellar"]                            as const,
  account: (publicKey: string)     => [...stellarKeys.all(), "account", publicKey]      as const,
  transaction: (hash: string)      => [...stellarKeys.all(), "transaction", hash]       as const,
  ledger: (sequence: number)       => [...stellarKeys.all(), "ledger", sequence]        as const,
} as const;
