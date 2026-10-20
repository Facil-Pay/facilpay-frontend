import { Payment } from './types';

export interface FeeBreakdownResult {
  grossAmount: number;
  facilPayFee: number;
  networkFeeXlm: number;
  networkFeeFiat: number;
  totalFees: number;
  netAmount: number;
  conversionRate: string;
  isConverted: boolean;
}

// Reference Stellar XLM price in USD for network fee fiat conversion
export const STELLAR_XLM_PRICE_USD = 0.12;

/**
 * Calculates a complete, transparent fee breakdown for a payment.
 * Ensures the fundamental accounting identity: Gross - Fees = Net
 */
export function calculatePaymentFeeBreakdown(payment: {
  amount: number;
  asset?: string;
  fee?: number;
  grossAmount?: number;
  facilPayFee?: number;
  networkFeeXlm?: number;
  networkFeeFiat?: number;
  totalFees?: number;
  netAmount?: number;
  conversionRate?: string;
  isConverted?: boolean;
}): FeeBreakdownResult {
  const grossAmount = payment.grossAmount ?? payment.amount;
  const networkFeeXlm = payment.networkFeeXlm ?? payment.fee ?? 0.00001;
  const networkFeeFiat =
    payment.networkFeeFiat ?? Number((networkFeeXlm * STELLAR_XLM_PRICE_USD).toFixed(6));

  // FacilPay platform fee (standard 1.0% of gross transaction amount)
  const facilPayFee =
    payment.facilPayFee ?? Number((grossAmount * 0.01).toFixed(2));

  // For XLM payments, network fee is deducted in XLM; for USDC/EURC, in fiat equivalent
  const feeInAsset = payment.asset === 'XLM' ? networkFeeXlm : networkFeeFiat;
  const calculatedTotalFees = Number((facilPayFee + feeInAsset).toFixed(5));
  const totalFees = payment.totalFees ?? calculatedTotalFees;

  // Exact net settlement amount received by the merchant: Gross - Fees = Net
  const calculatedNetAmount = Number((grossAmount - totalFees).toFixed(5));
  const netAmount = payment.netAmount ?? calculatedNetAmount;

  const isConverted =
    payment.isConverted !== undefined
      ? payment.isConverted
      : payment.asset === 'XLM' || payment.asset === 'EURC';

  let conversionRate = payment.conversionRate;
  if (!conversionRate) {
    if (payment.asset === 'XLM') {
      conversionRate = '1 XLM = 0.1250 USDC';
    } else if (payment.asset === 'EURC') {
      conversionRate = '1 EURC = 1.0850 USDC';
    } else {
      conversionRate = 'Direct (1:1)';
    }
  }

  return {
    grossAmount,
    facilPayFee,
    networkFeeXlm,
    networkFeeFiat,
    totalFees,
    netAmount,
    conversionRate,
    isConverted,
  };
}
