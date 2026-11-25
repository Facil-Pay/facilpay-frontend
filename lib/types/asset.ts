/**
 * lib/types/asset.ts
 *
 * Stellar assets the dashboard settles in, plus merchant balances.
 */

export const ASSET_TYPES = ["USDC", "XLM", "EURC"] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

export interface MerchantBalance {
  asset: AssetType;
  available: number;
  escrowLocked: number;
  total: number;
}
