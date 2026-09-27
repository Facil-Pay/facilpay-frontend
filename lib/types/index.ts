/**
 * lib/types/index.ts
 *
 * Core domain types for the FacilPay platform.
 * Re-exports everything so consumers can import from a single path:
 *
 *   import type { Payment, Refund, Merchant, Paginated } from "@/lib/types";
 */

export * from "./payment";
export * from "./refund";
export * from "./escrow";
export * from "./webhook";
export * from "./apiKey";
export * from "./merchant";
export * from "./payout";
export * from "./pagination";
export * from "./analytics";
export * from "./settings";
