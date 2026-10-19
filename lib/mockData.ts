import { Payment, Refund, Payout, ExportColumn } from './types';

export const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pay_20260115_9f8a2c',
    date: '2026-01-15T14:32:00.000Z',
    amount: 1250.0,
    asset: 'USDC',
    status: 'COMPLETED',
    customerEmail: 'alex.chen@innovate.co',
    customerWallet: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant Ltd',
    merchantEmail: 'billing@facilpay.io',
    txHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fee: 0.00001,
    description: 'Enterprise Tier License, "Q1 Renewal", priority SLA',
    memo: 'INV-2026-001',
  },
  {
    id: 'pay_20260118_8d7e6f',
    date: '2026-01-18T09:15:22.000Z',
    amount: 450.5,
    asset: 'USDC',
    status: 'COMPLETED',
    customerEmail: 'sarah.j@acmeflow.com',
    customerWallet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant Ltd',
    merchantEmail: 'billing@facilpay.io',
    txHash: 'a5c7f89312d8a4369e01bc34df56890213ef4598a72314bcdef56123490abcde',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/a5c7f89312d8a4369e01bc34df56890213ef4598a72314bcdef56123490abcde',
    fee: 0.00001,
    description: 'API Usage Pack: 50,000 requests',
    memo: 'MEMO-50K-API',
  },
  {
    id: 'pay_20260122_3b4c5d',
    date: '2026-01-22T18:45:00.000Z',
    amount: 3200.0,
    asset: 'XLM',
    status: 'COMPLETED',
    customerEmail: 'devin@stellarforge.org',
    customerWallet: 'GCKAZ67QPF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFL',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant Ltd',
    merchantEmail: 'billing@facilpay.io',
    txHash: '7f98e12345bcdef67890123456789abcdef0123456789abcdef0123456789abc',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/7f98e12345bcdef67890123456789abcdef0123456789abcdef0123456789abc',
    fee: 0.00001,
    description: 'Custom Smart Contract Audit & Escrow setup\nPhase 1 Milestone',
    memo: 'ESCROW-DEPOSIT-99',
  },
  {
    id: 'pay_20260125_1a2b3c',
    date: '2026-01-25T11:20:10.000Z',
    amount: 150.0,
    asset: 'EURC',
    status: 'REFUNDED',
    customerEmail: 'marc.dubois@paris-fin.fr',
    customerWallet: 'GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant Ltd',
    merchantEmail: 'billing@facilpay.io',
    txHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    fee: 0.00001,
    description: 'Consultation fee, "EU Cross-Border Setup"',
    memo: 'CONSULT-REF',
  },
  {
    id: 'pay_20260129_7f6e5d',
    date: '2026-01-29T16:04:30.000Z',
    amount: 890.0,
    asset: 'USDC',
    status: 'COMPLETED',
    customerEmail: 'clara.m@techbridge.io',
    customerWallet: 'GDRQYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant Ltd',
    merchantEmail: 'billing@facilpay.io',
    txHash: '9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba',
    fee: 0.00001,
    description: 'Merchant Onboarding Kit, hardware module',
    memo: 'HW-KIT-01',
  },
  {
    id: 'pay_20260202_4d5e6f',
    date: '2026-02-02T10:11:45.000Z',
    amount: 2100.0,
    asset: 'USDC',
    status: 'COMPLETED',
    customerEmail: 'samuel.k@blockpay.net',
    customerWallet: 'GBTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant Ltd',
    merchantEmail: 'billing@facilpay.io',
    txHash: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    fee: 0.00001,
    description: 'Bulk Payout Facilitation credits, batch #41',
    memo: 'BATCH-CR-41',
  },
  {
    id: 'pay_20260206_8a9b0c',
    date: '2026-02-06T13:22:15.000Z',
    amount: 75.0,
    asset: 'XLM',
    status: 'FAILED',
    customerEmail: 'test.user@sandbox.org',
    customerWallet: 'GCTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant Ltd',
    merchantEmail: 'billing@facilpay.io',
    txHash: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
    fee: 0.00001,
    description: 'Test micropayment (simulated slippage failure)',
    memo: 'TEST-TX-FAIL',
  },
  {
    id: 'pay_20260210_5c6d7e',
    date: '2026-02-10T17:50:30.000Z',
    amount: 1850.0,
    asset: 'EURC',
    status: 'COMPLETED',
    customerEmail: 'helena.v@nordicpay.se',
    customerWallet: 'GDAYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant Ltd',
    merchantEmail: 'billing@facilpay.io',
    txHash: 'ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221100',
    fee: 0.00001,
    description: 'Nordic expansion setup, anchor integration support',
    memo: 'NORDIC-EXP',
  },
];

export const INITIAL_REFUNDS: Refund[] = [
  {
    id: 'ref_20260125_1a2b3c',
    paymentId: 'pay_20260125_1a2b3c',
    date: '2026-01-25T14:10:00.000Z',
    amount: 150.0,
    asset: 'EURC',
    status: 'COMPLETED',
    reason: 'Customer requested cancellation, full refund issued',
    customerWallet: 'GAYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    txHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    fee: 0.00001,
  },
  {
    id: 'ref_20260127_8e9f0a',
    paymentId: 'pay_20260115_9f8a2c',
    date: '2026-01-27T09:40:12.000Z',
    amount: 250.0,
    asset: 'USDC',
    status: 'COMPLETED',
    reason: 'Partial discount credit applied, "Special Promo voucher"',
    customerWallet: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    txHash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90',
    fee: 0.00001,
  },
  {
    id: 'ref_20260205_3c4d5e',
    paymentId: 'pay_20260202_4d5e6f',
    date: '2026-02-05T16:15:45.000Z',
    amount: 500.0,
    asset: 'USDC',
    status: 'PENDING',
    reason: 'Disputed overcharge; under merchant review',
    customerWallet: 'GBTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    txHash: 'b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3',
    fee: 0.00001,
  },
];

export const INITIAL_BALANCES: Record<AssetType, MerchantBalance> = {
  USDC: {
    asset: 'USDC',
    available: 42850.0,
    escrowLocked: 5000.0,
    total: 47850.0,
  },
  XLM: {
    asset: 'XLM',
    available: 18400.0,
    escrowLocked: 2000.0,
    total: 20400.0,
  },
  EURC: {
    asset: 'EURC',
    available: 12200.0,
    escrowLocked: 1500.0,
    total: 13700.0,
  },
};

export const INITIAL_SAVED_DESTINATIONS: SavedDestination[] = [
  {
    id: 'dest_binance_treasury',
    label: 'Binance Treasury Deposit',
    address: 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG',
    memo: '109283741',
    memoType: 'id',
    isExchange: true,
    exchangeName: 'Binance',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'dest_coinbase_ops',
    label: 'Coinbase Operational Reserve',
    address: 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV',
    memo: 'CB-948201',
    memoType: 'text',
    isExchange: true,
    exchangeName: 'Coinbase',
    createdAt: '2026-01-12T14:20:00.000Z',
  },
  {
    id: 'dest_internal_cold',
    label: 'FacilPay Multi-sig Cold Storage',
    address: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    createdAt: '2026-01-05T10:00:00.000Z',
  },
  {
    id: 'dest_fed_treasury',
    label: 'FacilPay Treasury (Federation)',
    address: 'treasury*facilpay.io',
    resolvedAddress: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    createdAt: '2026-01-15T09:30:00.000Z',
  },
];

export const INITIAL_PAYOUTS: Payout[] = [
  {
    id: 'pout_20260131_01a2b3',
    date: '2026-01-31T23:59:59.000Z',
    amount: 14500.0,
    asset: 'USDC',
    status: 'COMPLETED',
    destinationWallet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    destinationLabel: 'Anclap Global Bank Wire',
    payoutMethod: 'SEP-24 Bank Off-Ramp (Anclap)',
    txHash: '3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
    fee: 0.00005,
    anchorName: 'Anclap',
    bankDetailsSummary: 'IBAN: DE89 3704 ... 9201 (Deutsche Bank)',
    sep24TransactionId: 'sep24_anclap_k8a92j',
  },
  {
    id: 'pout_20260215_4d5e6f',
    date: '2026-02-15T12:00:00.000Z',
    amount: 8200.0,
    asset: 'USDC',
    status: 'COMPLETED',
    destinationWallet: 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG',
    destinationLabel: 'Binance Treasury Deposit',
    payoutMethod: 'Stellar Direct Transfer',
    txHash: '5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
    fee: 0.00001,
    memo: '109283741',
    memoType: 'id',
  },
  {
    id: 'pout_20260228_7a8b9c',
    date: '2026-02-28T18:30:00.000Z',
    amount: 4500.0,
    asset: 'EURC',
    status: 'PROCESSING',
    destinationWallet: 'GDRQYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    destinationLabel: 'MyKobo SEPA Gateway',
    payoutMethod: 'SEP-24 Bank Off-Ramp (MyKobo)',
    txHash: '7890123456abcdef7890123456abcdef7890123456abcdef7890123456abcdef',
    fee: 0.00005,
    anchorName: 'MyKobo',
    bankDetailsSummary: 'IBAN: FR76 3000 ... 4820 (BNP Paribas)',
    sep24TransactionId: 'sep24_mykobo_99x1za',
  },
  {
    id: 'pout_20260301_msig_awaiting',
    date: '2026-03-01T10:15:00.000Z',
    amount: 18500.0,
    asset: 'USDC',
    status: 'AWAITING_SIGNATURES',
    destinationWallet: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    destinationLabel: 'Circle Testnet Reserve',
    payoutMethod: 'Stellar Direct Transfer',
    txHash: '',
    fee: 0.00001,
    multisig: {
      isMultisig: true,
      requiredThreshold: 2,
      currentWeight: 1,
      timeBounds: {
        minTime: '0',
        maxTime: String(Math.floor(Date.now() / 1000) + 86400),
      },
      expiresAt: new Date(Date.now() + 86400 * 1000).toISOString(),
      isExpired: false,
      signers: [
        {
          key: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
          weight: 1,
          signed: true,
          signedAt: '2026-03-01T10:15:00.000Z',
          signature: 'sig_mock_gdyty_init',
          label: 'Treasury Officer (Initiator)',
        },
        {
          key: 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG',
          weight: 1,
          signed: false,
          label: 'Finance Director (Signer 2)',
        },
        {
          key: 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV',
          weight: 1,
          signed: false,
          label: 'Compliance Lead (Signer 3)',
        },
      ],
      xdr: 'AAAAAGRNVUxUSVNJRzcyUDdNREVTV0NSR1RQVVdWM05ZM0RU==',
    },
  },
  {
    id: 'pout_20260220_msig_expired',
    date: '2026-02-20T08:00:00.000Z',
    amount: 6200.0,
    asset: 'XLM',
    status: 'EXPIRED',
    destinationWallet: 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG',
    destinationLabel: 'Binance Cold Storage',
    payoutMethod: 'Stellar Direct Transfer',
    txHash: '',
    fee: 0.00001,
    multisig: {
      isMultisig: true,
      requiredThreshold: 2,
      currentWeight: 1,
      timeBounds: {
        minTime: '0',
        maxTime: '1771584000',
      },
      expiresAt: '2026-02-21T08:00:00.000Z',
      isExpired: true,
      signers: [
        {
          key: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
          weight: 1,
          signed: true,
          signedAt: '2026-02-20T08:00:00.000Z',
          signature: 'sig_mock_expired_init',
          label: 'Treasury Officer',
        },
        {
          key: 'GCO2IP3MJNUOKS45K4MKDU6QKONKVI4ZXCUYTDN7TYGDM6ZFAKIRURCG',
          weight: 1,
          signed: false,
          label: 'Finance Director',
        },
        {
          key: 'GBV4ZDEPNQYXVTHTT7QWC2SZNCYGHYLMR7NA52AAS2RXR2MGDF6ISXNV',
          weight: 1,
          signed: false,
          label: 'Compliance Lead',
        },
      ],
      xdr: 'AAAAAGRNVUxUSVNJRzcyUDdNREVTV0NSR1RQVVdWM05ZM0RU==',
    },
  },
];

/**
 * Standard column definitions for Payments export
 */
export const PAYMENT_EXPORT_COLUMNS: ExportColumn<Payment>[] = [
  { key: 'id', label: 'Payment ID', selected: true },
  { key: 'date', label: 'Date (ISO 8601)', selected: true },
  {
    key: 'amount',
    label: 'Amount',
    selected: true,
    formatter: (val) => Number(val).toFixed(2),
  },
  { key: 'asset', label: 'Asset', selected: true },
  { key: 'status', label: 'Status', selected: true },
  { key: 'customerEmail', label: 'Customer Email', selected: true },
  { key: 'customerWallet', label: 'Customer Wallet', selected: true },
  { key: 'merchantName', label: 'Merchant Name', selected: true },
  { key: 'txHash', label: 'Transaction Hash', selected: true },
  { key: 'stellarExpertUrl', label: 'Stellar Expert Link', selected: true },
  { key: 'fee', label: 'Network Fee', selected: true },
  { key: 'description', label: 'Description', selected: true },
  { key: 'memo', label: 'Memo', selected: true },
];

/**
 * Standard column definitions for Refunds export
 */
export const REFUND_EXPORT_COLUMNS: ExportColumn<Refund>[] = [
  { key: 'id', label: 'Refund ID', selected: true },
  { key: 'paymentId', label: 'Original Payment ID', selected: true },
  { key: 'date', label: 'Date (ISO 8601)', selected: true },
  {
    key: 'amount',
    label: 'Refund Amount',
    selected: true,
    formatter: (val) => Number(val).toFixed(2),
  },
  { key: 'asset', label: 'Asset', selected: true },
  { key: 'status', label: 'Status', selected: true },
  { key: 'reason', label: 'Reason', selected: true },
  { key: 'customerWallet', label: 'Customer Wallet', selected: true },
  { key: 'txHash', label: 'Transaction Hash', selected: true },
  { key: 'fee', label: 'Fee', selected: true },
];

/**
 * Standard column definitions for Payouts export
 */
export const PAYOUT_EXPORT_COLUMNS: ExportColumn<Payout>[] = [
  { key: 'id', label: 'Payout ID', selected: true },
  { key: 'date', label: 'Date (ISO 8601)', selected: true },
  {
    key: 'amount',
    label: 'Payout Amount',
    selected: true,
    formatter: (val) => Number(val).toFixed(2),
  },
  { key: 'asset', label: 'Asset', selected: true },
  { key: 'status', label: 'Status', selected: true },
  { key: 'payoutMethod', label: 'Payout Method', selected: true },
  { key: 'destinationWallet', label: 'Destination Wallet', selected: true },
  { key: 'txHash', label: 'Transaction Hash', selected: true },
  { key: 'fee', label: 'Fee', selected: true },
];

/**
 * Generates a realistic large dataset (>1,000 rows) for testing progress indicators
 */
export function generateLargePayments(count = 2500): Payment[] {
  const assets: ('USDC' | 'XLM' | 'EURC')[] = ['USDC', 'XLM', 'EURC'];
  const statuses: ('COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED')[] = [
    'COMPLETED',
    'COMPLETED',
    'COMPLETED',
    'PENDING',
    'FAILED',
    'REFUNDED',
  ];

  const results: Payment[] = [];
  const baseTime = new Date('2026-01-01T08:00:00.000Z').getTime();

  for (let i = 1; i <= count; i++) {
    // Generate dates incrementing over Jan-March 2026
    const itemDate = new Date(baseTime + i * 3600 * 1000 * 0.7);
    const asset = assets[i % assets.length];
    const status = statuses[i % statuses.length];
    const amount = Number((25 + (i * 13.37) % 4500).toFixed(2));
    const hexHash = ((i * 1234567891).toString(16) + 'abcdef0123456789abcdef0123456789abcdef0123456789').slice(0, 64);

    results.push({
      id: `pay_2026_${String(i).padStart(6, '0')}`,
      date: itemDate.toISOString(),
      amount,
      asset,
      status,
      customerEmail: `customer${i % 250}@clientorg.com`,
      customerWallet: `GD${String(i).padStart(4, '0')}QZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A`,
      merchantId: 'merch_facilpay_01',
      merchantName: 'FacilPay Global Merchant Ltd',
      merchantEmail: 'billing@facilpay.io',
      txHash: hexHash,
      stellarExpertUrl: `https://stellar.expert/explorer/testnet/tx/${hexHash}`,
      fee: 0.00001,
      description: `Automated settlement #${i}, "Standard terms applied"`,
      memo: `MEMO-AUTO-${i}`,
    });
  }

  return results;
}
