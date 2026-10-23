export type PaymentStatus = 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
export type RefundStatus = 'COMPLETED' | 'PENDING' | 'FAILED';
export type PayoutStatus = 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED';
export type AssetType = 'USDC' | 'XLM' | 'EURC';

export interface MerchantInfo {
  name: string;
  id: string;
  email: string;
  website?: string;
  stellarAccount?: string;
}

export interface Payment {
  id: string;
  date: string; // ISO 8601: e.g. 2026-01-15T14:32:00.000Z
  amount: number;
  asset: AssetType;
  status: PaymentStatus;
  customerEmail: string;
  customerWallet: string;
  merchantId: string;
  merchantName: string;
  merchantEmail: string;
  txHash: string;
  stellarExpertUrl: string;
  fee: number;
  description: string;
  memo: string;
  sourceAsset?: string;
  sourceAmount?: number;
  path?: string[];
  // Fee breakdown (issue #77)
  facilpayFee?: number;  // FacilPay platform fee in payment asset
  netAmount?: number;    // Amount merchant actually received (amount − facilpayFee)
  conversionRate?: number; // Exchange rate applied when asset was converted (e.g. XLM→USDC)
  networkFeeXlm?: number;  // Stellar network fee in XLM (always 0.00001 per operation)
}

export interface Refund {
  id: string;
  paymentId: string;
  date: string; // ISO 8601
  amount: number;
  asset: AssetType;
  status: RefundStatus;
  reason: string;
  customerWallet: string;
  txHash: string;
  fee: number;
}

export interface MerchantBalance {
  asset: AssetType;
  available: number;
  escrowLocked: number;
  total: number;
}

export interface SavedDestination {
  id: string;
  label: string;
  address: string; // Stellar G... or federation address name*domain.com
  resolvedAddress?: string;
  memo?: string;
  memoType?: 'text' | 'id' | 'hash';
  isExchange?: boolean;
  exchangeName?: string;
  createdAt: string;
}

export interface Payout {
  id: string;
  date: string; // ISO 8601
  amount: number;
  asset: AssetType;
  status: PayoutStatus;
  destinationWallet: string;
  destinationLabel?: string;
  payoutMethod: string;
  txHash: string;
  fee: number;
  memo?: string;
  memoType?: string;
  sep24TransactionId?: string;
  anchorName?: string;
  bankDetailsSummary?: string;
}

export interface ExportColumn<T> {
  key: keyof T | string;
  label: string;
  selected: boolean;
  formatter?: (value: any, item: T) => string;
}

export interface ExportProgress {
  current: number;
  total: number;
  percentage: number;
  batchIndex: number;
  totalBatches: number;
  status: 'idle' | 'fetching' | 'processing' | 'generating' | 'completed' | 'cancelled' | 'error';
  message?: string;
}
