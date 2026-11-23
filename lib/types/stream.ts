/**
 * lib/types/stream.ts
 *
 * Live Horizon payment stream: raw operation items and context state.
 */

export type StreamConnectionStatus = 'connected' | 'reconnecting' | 'offline' | 'paused';

export interface PaymentItem {
  id: string;
  paging_token: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  asset_type: string;
  asset_code: string;
  asset_issuer?: string;
  from: string;
  to: string;
  amount: string;
  isNew?: boolean; // For triggering row highlight animation
}

export interface PaymentStreamContextType {
  status: StreamConnectionStatus;
  payments: PaymentItem[];
  latestPayment: PaymentItem | null;
  accountId: string;
  reconnectAttempts: number;
  lastPagingToken: string | null;
  isPaused: boolean;
  simulateIncomingPayment: (custom?: Partial<PaymentItem>) => void;
  clearNewHighlights: () => void;
  reconnect: () => void;
}
