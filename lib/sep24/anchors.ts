/**
 * SEP-24 Interactive Anchor Off-Ramp Configuration & Protocol Client.
 * Enables merchants to off-ramp crypto funds into external bank accounts via regulated anchors.
 */

import { AssetType } from '../types';
import { roundTo } from '@/lib/i18n/format';

export interface Sep24Anchor {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  supportedAssets: AssetType[];
  supportedMethods: string[];
  supportedRegions: string[];
  feeDescription: string;
  estimatedDeliveryTime: string;
  interactiveUrlBase: string;
  statusEndpoint: string;
}

export interface Sep24Transaction {
  id: string;
  anchorId: string;
  anchorName: string;
  kind: 'withdrawal';
  status:
    | 'incomplete'
    | 'pending_user_transfer_start'
    | 'pending_anchor'
    | 'pending_external'
    | 'completed'
    | 'error';
  statusEta?: number;
  amountIn: number;
  amountOut: number;
  asset: AssetType;
  fiatCurrency: string;
  feeAmount: number;
  bankAccountDetails?: {
    accountHolder: string;
    bankName: string;
    ibanOrAccount: string;
    routingOrBic?: string;
    country: string;
  };
  stellarTxHash?: string;
  externalTransactionId?: string;
  startedAt: string;
  completedAt?: string;
  message?: string;
}

export const CONFIGURABLE_ANCHORS: Sep24Anchor[] = [
  {
    id: 'moneygram',
    name: 'MoneyGram Access',
    domain: 'moneygram.com',
    supportedAssets: ['USDC'],
    supportedMethods: ['Bank Direct Deposit', 'Cash Pick-Up (350,000+ Locations)'],
    supportedRegions: ['Global (180+ Countries)', 'United States', 'Europe', 'LatAm'],
    feeDescription: '0.00% Zero-fee promotion for USDC withdrawals',
    estimatedDeliveryTime: 'Instant to 15 minutes',
    interactiveUrlBase: 'https://ext.moneygram.com/sep24/interactive/withdraw',
    statusEndpoint: 'https://ext.moneygram.com/sep24/transaction',
  },
  {
    id: 'anclap',
    name: 'Anclap Global Bank Transfer',
    domain: 'anclap.com',
    supportedAssets: ['USDC', 'EURC'],
    supportedMethods: ['SEPA Instant (EU)', 'SPEI (Mexico)', 'PIX (Brazil)', 'ACH'],
    supportedRegions: ['European Union', 'Brazil', 'Mexico', 'Argentina', 'Colombia'],
    feeDescription: '0.35% Flat off-ramp fee',
    estimatedDeliveryTime: 'Same-day bank settlement (< 2 hours)',
    interactiveUrlBase: 'https://api.anclap.com/sep24/interactive/withdraw',
    statusEndpoint: 'https://api.anclap.com/sep24/transaction',
  },
  {
    id: 'yellowcard',
    name: 'Yellow Card Financial',
    domain: 'yellowcard.io',
    supportedAssets: ['USDC'],
    supportedMethods: ['Local Bank Wire', 'Mobile Money (M-Pesa, MTN, Airtel)'],
    supportedRegions: ['Pan-Africa (Nigeria, Kenya, South Africa, Ghana, Rwanda)'],
    feeDescription: '0.50% standard processing fee',
    estimatedDeliveryTime: '5 to 30 minutes',
    interactiveUrlBase: 'https://api.yellowcard.io/stellar/sep24/withdraw',
    statusEndpoint: 'https://api.yellowcard.io/stellar/sep24/transaction',
  },
  {
    id: 'vibrant',
    name: 'Vibrant ACH Off-Ramp',
    domain: 'vibrant.cash',
    supportedAssets: ['USDC'],
    supportedMethods: ['US Direct ACH Bank Wire', 'FedNow Instant'],
    supportedRegions: ['United States'],
    feeDescription: '$1.50 flat fee per withdrawal',
    estimatedDeliveryTime: '1 business day (FedNow: Instant)',
    interactiveUrlBase: 'https://sep24.vibrant.cash/withdraw/interactive',
    statusEndpoint: 'https://sep24.vibrant.cash/transaction',
  },
  {
    id: 'mykobo',
    name: 'MyKobo SEPA Gateway',
    domain: 'mykobo.co',
    supportedAssets: ['EURC'],
    supportedMethods: ['SEPA Credit Transfer', 'SEPA Instant'],
    supportedRegions: ['Eurozone (36 SEPA Countries)'],
    feeDescription: '€1.00 flat fee',
    estimatedDeliveryTime: '10 seconds (SEPA Instant)',
    interactiveUrlBase: 'https://anchor.mykobo.co/sep24/withdraw',
    statusEndpoint: 'https://anchor.mykobo.co/transaction',
  },
];

/**
 * Initiates an interactive SEP-24 withdrawal session.
 */
export function createSep24Session(
  anchor: Sep24Anchor,
  params: {
    amount: number;
    asset: AssetType;
    destinationAccount?: string;
  }
): { transaction: Sep24Transaction; interactiveUrl: string } {
  const txId = `sep24_${anchor.id}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  const fee = anchor.id === 'moneygram' ? 0.0 : roundTo(params.amount * 0.004, 2);
  const amountOut = roundTo(params.amount - fee, 2);

  const transaction: Sep24Transaction = {
    id: txId,
    anchorId: anchor.id,
    anchorName: anchor.name,
    kind: 'withdrawal',
    status: 'incomplete',
    amountIn: params.amount,
    amountOut,
    asset: params.asset,
    fiatCurrency: params.asset === 'EURC' ? 'EUR' : 'USD',
    feeAmount: fee,
    startedAt: new Date().toISOString(),
    message: 'Waiting for merchant to submit bank account details in interactive anchor session.',
  };

  const interactiveUrl = `${anchor.interactiveUrlBase}?transaction_id=${txId}&asset_code=${params.asset}&amount=${params.amount}`;

  return { transaction, interactiveUrl };
}
