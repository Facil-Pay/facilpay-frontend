/**
 * lib/tax.ts
 *
 * Tax / VAT rates and tax-inclusive pricing.
 *
 * Pure helpers (no browser APIs) so they can be shared by settings, payment
 * link creation, checkout, PDF receipts and CSV export — on the client and the
 * server alike. Persisted merchant rates live in `lib/tax-store.ts`.
 */

import { assetDecimals, roundTo } from '@/lib/i18n/format';

export interface TaxRate {
  id: string;
  /** Label shown on checkout and receipts, e.g. "VAT" or "GST". */
  name: string;
  /** Percentage, e.g. 20 for 20 %. */
  percentage: number;
  /**
   * true  → prices already include tax (tax is extracted from the amount).
   * false → tax is added on top of the amount.
   */
  inclusive: boolean;
}

/** Snapshot of the tax applied to a payment link, invoice or payment. */
export interface TaxBreakdown {
  rateId?: string;
  name: string;
  percentage: number;
  inclusive: boolean;
  /** Amount before tax. */
  subtotal: number;
  /** Tax portion. */
  taxAmount: number;
  /** Amount the customer pays (subtotal + taxAmount). */
  total: number;
}

/** Ledger precision used for tax rounding of a given asset (e.g. 2 for USDC, 7 for XLM). */
export function assetPrecision(asset: string): number {
  return assetDecimals(asset).maximumFractionDigits;
}

/** Rounds an amount to the precision of the asset it is denominated in. */
export function roundToAsset(value: number, asset: string): number {
  return roundTo(value, assetPrecision(asset));
}

/** Validates a tax rate definition; returns an error message or null. */
export function validateTaxRate(rate: Pick<TaxRate, 'name' | 'percentage'>): string | null {
  if (!rate.name.trim()) return 'Tax name is required';
  if (!Number.isFinite(rate.percentage) || rate.percentage < 0 || rate.percentage > 100) {
    return 'Percentage must be between 0 and 100';
  }
  return null;
}

/**
 * Applies a tax rate to an amount, rounding every line to the asset precision.
 *
 * - Exclusive: `amount` is the subtotal; tax is added on top.
 * - Inclusive: `amount` is the total; the tax portion is extracted from it.
 *
 * In both cases `subtotal + taxAmount === total` exactly at asset precision.
 */
export function calculateTax(amount: number, rate: TaxRate, asset: string): TaxBreakdown {
  const decimals = assetPrecision(asset);
  const base = roundTo(Number.isFinite(amount) ? amount : 0, decimals);
  const ratio = rate.percentage / 100;

  let subtotal: number;
  let taxAmount: number;
  let total: number;

  if (rate.inclusive) {
    total = base;
    subtotal = roundTo(total / (1 + ratio), decimals);
    taxAmount = roundTo(total - subtotal, decimals);
  } else {
    subtotal = base;
    taxAmount = roundTo(subtotal * ratio, decimals);
    total = roundTo(subtotal + taxAmount, decimals);
  }

  return {
    rateId: rate.id,
    name: rate.name,
    percentage: rate.percentage,
    inclusive: rate.inclusive,
    subtotal,
    taxAmount,
    total,
  };
}

/** Human label for a tax line, e.g. "VAT 20% (incl.)". */
export function formatTaxLabel(tax: Pick<TaxBreakdown, 'name' | 'percentage' | 'inclusive'>): string {
  return `${tax.name} ${tax.percentage}%${tax.inclusive ? ' (incl.)' : ''}`;
}

/**
 * The amount the merchant originally entered for a taxed amount — the total
 * for inclusive pricing, the subtotal for exclusive pricing. Used to
 * re-edit a payment link without applying tax twice.
 */
export function enteredAmount(tax: TaxBreakdown): number {
  return tax.inclusive ? tax.total : tax.subtotal;
}

/**
 * Machine-readable amount string at asset precision, keeping at least two
 * decimals (e.g. "12.00" for USDC, "12.3456789" or "12.50" for XLM).
 */
export function toAssetAmountString(value: number, asset: string): string {
  const fixed = roundToAsset(value, asset).toFixed(assetPrecision(asset));
  return fixed.replace(/(\.\d{2}\d*?)0+$/, '$1');
}

/** Tax fields stored on a payment record (see `Payment` in lib/types.ts). */
export interface PaymentTaxFields {
  amount: number;
  asset: string;
  taxName?: string;
  taxRate?: number;
  taxInclusive?: boolean;
  taxAmount?: number;
  subtotal?: number;
}

/**
 * Rebuilds the tax breakdown for a payment, or null when the payment was made
 * without tax (so untaxed payments render exactly as before).
 */
export function getPaymentTax(payment: PaymentTaxFields): TaxBreakdown | null {
  if (payment.taxAmount === undefined || payment.taxAmount === null || !payment.taxName) return null;
  const total = roundToAsset(Number(payment.amount), payment.asset);
  const taxAmount = roundToAsset(Number(payment.taxAmount), payment.asset);
  const subtotal =
    payment.subtotal !== undefined ? roundToAsset(Number(payment.subtotal), payment.asset) : roundToAsset(total - taxAmount, payment.asset);
  return {
    name: payment.taxName,
    percentage: payment.taxRate ?? 0,
    inclusive: payment.taxInclusive ?? false,
    subtotal,
    taxAmount,
    total,
  };
}
