'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import {
  PaymentItem,
  StreamConnectionStatus,
  PaymentStreamContextType,
} from '@/lib/types';
import { STELLAR_TESTNET_HORIZON, isValidStellarAddress } from '@/lib/stellar';
import { DEFAULT_CONNECTED_WALLET } from '@/lib/storage';

const PaymentStreamContext = createContext<PaymentStreamContextType | undefined>(undefined);

const INITIAL_DEMO_PAYMENTS: PaymentItem[] = [
  {
    id: 'op_test_101',
    paging_token: '1234567890001',
    type: 'payment',
    created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    transaction_hash: '7a9f8b2c4d1e3f5a7b9c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4b6c8d0e2f4a',
    asset_type: 'credit_alphanum4',
    asset_code: 'USDC',
    asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    from: 'GABCD3XYZ99238KLMS72782910AAJJWWQQOPPLKKJJHGFEDCBA7766554433221',
    to: DEFAULT_CONNECTED_WALLET,
    amount: '50.0000000',
    isNew: false,
  },
  {
    id: 'op_test_102',
    paging_token: '1234567890002',
    type: 'payment',
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    transaction_hash: '3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e',
    asset_type: 'credit_alphanum4',
    asset_code: 'EURC',
    asset_issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    from: 'GDEMO8899AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPQQRRSSTTUUVVWWXXYYZZ12',
    to: DEFAULT_CONNECTED_WALLET,
    amount: '25.0000000',
    isNew: false,
  },
  {
    id: 'op_test_103',
    paging_token: '1234567890003',
    type: 'payment',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    transaction_hash: '9e8d7c6b5a4f3e2d1c0b9a8f7e6d5c4b3a2f1e0d9c8b7a6f5e4d3c2b1a0f9e8d',
    asset_type: 'native',
    asset_code: 'XLM',
    from: 'GTEST445566778899AABBCCDDEEFFGGHHIIJJKKLLMMNNOOPPQQRRSSTTUUVVWW',
    to: DEFAULT_CONNECTED_WALLET,
    amount: '100.0000000',
    isNew: false,
  },
];

interface PaymentStreamProviderProps {
  children: ReactNode;
  initialAccountId?: string;
}

export function PaymentStreamProvider({
  children,
  initialAccountId = DEFAULT_CONNECTED_WALLET,
}: PaymentStreamProviderProps) {
  const [accountId, setAccountId] = useState(initialAccountId);
  const [status, setStatus] = useState<StreamConnectionStatus>('offline');
  const [payments, setPayments] = useState<PaymentItem[]>(INITIAL_DEMO_PAYMENTS);
  const [latestPayment, setLatestPayment] = useState<PaymentItem | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [lastPagingToken, setLastPagingToken] = useState<string | null>(null);

  // Singleton references for stream control
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorRef = useRef<string | null>(null);
  const isComponentMountedRef = useRef(false);

  // Sync state ref
  useEffect(() => {
    lastCursorRef.current = lastPagingToken;
  }, [lastPagingToken]);

  // Teardown stream
  const teardownStream = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      try {
        eventSourceRef.current.close();
      } catch (err) {
        console.warn('Error closing EventSource:', err);
      }
      eventSourceRef.current = null;
    }
  }, []);

  // Process incoming Horizon payment event
  const handleIncomingPaymentData = useCallback((data: unknown) => {
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      if (!parsed || !parsed.id) return;

      const assetCode =
        parsed.asset_type === 'native'
          ? 'XLM'
          : parsed.asset_code || 'USDC';

      const newPayment: PaymentItem = {
        id: parsed.id || `op_${Date.now()}`,
        paging_token: parsed.paging_token || String(Date.now()),
        type: parsed.type || 'payment',
        created_at: parsed.created_at || new Date().toISOString(),
        transaction_hash:
          parsed.transaction_hash ||
          Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        asset_type: parsed.asset_type || 'credit_alphanum4',
        asset_code: assetCode,
        asset_issuer: parsed.asset_issuer,
        from: parsed.from || parsed.source_account || 'GACCOUNT...',
        to: parsed.to || parsed.account || accountId,
        amount: parseFloat(parsed.amount || '0').toFixed(2),
        isNew: true,
      };

      // Update cursor
      if (newPayment.paging_token) {
        setLastPagingToken(newPayment.paging_token);
        lastCursorRef.current = newPayment.paging_token;
      }

      // Prepend to payments list & set latest
      setPayments((prev) => {
        // avoid duplicate IDs
        if (prev.some((p) => p.id === newPayment.id)) return prev;
        return [newPayment, ...prev];
      });
      setLatestPayment(newPayment);
    } catch (err) {
      console.warn('Failed to parse incoming Horizon payment event:', err);
    }
  }, [accountId]);

  // Connect to Horizon SSE stream
  const connectStream = useCallback(() => {
    if (!accountId || !isValidStellarAddress(accountId)) {
      setStatus('offline');
      return;
    }

    teardownStream();

    const cursor = lastCursorRef.current || 'now';
    const streamUrl = `${STELLAR_TESTNET_HORIZON}/accounts/${accountId.trim()}/payments?cursor=${encodeURIComponent(cursor)}&order=asc`;

    try {
      setStatus('reconnecting');
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        setStatus('connected');
        setReconnectAttempts(0);
      };

      es.onmessage = (event) => {
        handleIncomingPaymentData(event.data);
      };

      es.onerror = () => {
        // On error, trigger exponential backoff reconnect
        teardownStream();
        setStatus('reconnecting');

        setReconnectAttempts((prev) => {
          const nextAttempt = prev + 1;
          // Exponential backoff: min 1.5s, max 16s with jitter
          const backoffDelay = Math.min(1500 * Math.pow(1.8, Math.min(nextAttempt, 5)), 16000) + Math.random() * 600;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isComponentMountedRef.current && !document.hidden) {
              connectStream();
            }
          }, backoffDelay);

          return nextAttempt;
        });
      };
    } catch (err) {
      console.warn('EventSource connection error:', err);
      setStatus('offline');
    }
  }, [accountId, teardownStream, handleIncomingPaymentData]);

  // Lifecycle & Page Visibility API listener
  useEffect(() => {
    isComponentMountedRef.current = true;
    connectStream();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden: pause stream
        setIsPaused(true);
        setStatus('paused');
        teardownStream();
      } else {
        // Page visible again: resume stream from last cursor
        setIsPaused(false);
        setStatus('reconnecting');
        connectStream();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isComponentMountedRef.current = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      teardownStream();
    };
  }, [connectStream, teardownStream]);

  // Method to manually clear the isNew animation flag
  const clearNewHighlights = useCallback(() => {
    setPayments((prev) => prev.map((p) => ({ ...p, isNew: false })));
  }, []);

  // Method to simulate an incoming payment on-demand
  const simulateIncomingPayment = useCallback(
    (custom?: Partial<PaymentItem>) => {
      const randomSender = `G${Array.from({ length: 55 }, () =>
        'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[Math.floor(Math.random() * 32)]
      ).join('')}`;

      const simPayment: PaymentItem = {
        id: `op_sim_${Date.now()}`,
        paging_token: `${Date.now()}0001`,
        type: 'payment',
        created_at: new Date().toISOString(),
        transaction_hash: Array.from({ length: 64 }, () =>
          Math.floor(Math.random() * 16).toString(16)
        ).join(''),
        asset_type: custom?.asset_code === 'XLM' ? 'native' : 'credit_alphanum4',
        asset_code: custom?.asset_code || 'USDC',
        asset_issuer:
          custom?.asset_code === 'XLM'
            ? undefined
            : 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
        from: custom?.from || randomSender,
        to: accountId,
        amount: custom?.amount || (Math.floor(Math.random() * 95) + 5).toFixed(2),
        isNew: true,
      };

      setPayments((prev) => [simPayment, ...prev]);
      setLatestPayment(simPayment);
      setLastPagingToken(simPayment.paging_token);
    },
    [accountId]
  );

  return (
    <PaymentStreamContext.Provider
      value={{
        status,
        payments,
        latestPayment,
        accountId,
        reconnectAttempts,
        lastPagingToken,
        isPaused,
        simulateIncomingPayment,
        clearNewHighlights,
        reconnect: connectStream,
      }}
    >
      {children}
    </PaymentStreamContext.Provider>
  );
}

const FALLBACK_CONTEXT: PaymentStreamContextType = {
  status: 'offline',
  payments: [],
  latestPayment: null,
  accountId: DEFAULT_CONNECTED_WALLET,
  reconnectAttempts: 0,
  lastPagingToken: null,
  isPaused: false,
  simulateIncomingPayment: () => {},
  clearNewHighlights: () => {},
  reconnect: () => {},
};

/**
 * Shared hook: subscribes to server.payments().forAccount(accountId).cursor('now').stream()
 * Components consume the shared singleton stream without opening redundant EventSource connections.
 */
export function usePaymentStream(targetAccountId?: string) {
  const context = useContext(PaymentStreamContext);
  return context || FALLBACK_CONTEXT;
}
