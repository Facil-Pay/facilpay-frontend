import { describe, test, expect } from 'vitest';
import { INITIAL_PAYMENTS, PAYMENT_EXPORT_COLUMNS } from '../lib/mockData';
import { calculatePaymentFeeBreakdown, STELLAR_XLM_PRICE_USD } from '../lib/feeCalculation';
import { generateCsv } from '../lib/csvExport';

describe('Payment Fee Breakdown & Net Settlement (#77)', () => {
  describe('Fixture Verification: Gross − Fees = Net', () => {
    test('satisfies Gross − Fees = Net for EVERY fixture payment in INITIAL_PAYMENTS', () => {
      expect(INITIAL_PAYMENTS.length).toBeGreaterThan(0);

      for (const payment of INITIAL_PAYMENTS) {
        const breakdown = calculatePaymentFeeBreakdown(payment);

        // Core acceptance criterion: Gross - fees = net
        const expectedNet = Number((breakdown.grossAmount - breakdown.totalFees).toFixed(5));
        expect(breakdown.netAmount).toBeCloseTo(expectedNet, 4);

        // Verify that net is strictly less than gross
        expect(breakdown.netAmount).toBeLessThan(breakdown.grossAmount);

        // Verify that fees are positive
        expect(breakdown.facilPayFee).toBeGreaterThan(0);
        expect(breakdown.networkFeeXlm).toBeGreaterThan(0);
        expect(breakdown.networkFeeFiat).toBeGreaterThan(0);
        expect(breakdown.totalFees).toBeGreaterThan(0);
      }
    });

    test('verifies all expected fee fields are present on fixture payments', () => {
      for (const payment of INITIAL_PAYMENTS) {
        expect(payment.grossAmount).toBeDefined();
        expect(payment.facilPayFee).toBeDefined();
        expect(payment.networkFeeXlm).toBeDefined();
        expect(payment.networkFeeFiat).toBeDefined();
        expect(payment.totalFees).toBeDefined();
        expect(payment.netAmount).toBeDefined();
        expect(payment.conversionRate).toBeDefined();
      }
    });
  });

  describe('calculatePaymentFeeBreakdown Helper', () => {
    test('calculates 1% FacilPay fee and fiat network fee for direct USDC payment', () => {
      const mock = {
        amount: 1000.0,
        asset: 'USDC',
        fee: 0.00001,
      };

      const breakdown = calculatePaymentFeeBreakdown(mock);
      expect(breakdown.grossAmount).toBe(1000.0);
      expect(breakdown.facilPayFee).toBe(10.0); // 1% of 1000
      expect(breakdown.networkFeeXlm).toBe(0.00001);
      expect(breakdown.networkFeeFiat).toBeCloseTo(0.00001 * STELLAR_XLM_PRICE_USD, 6);
      expect(breakdown.conversionRate).toBe('Direct (1:1)');
      expect(breakdown.isConverted).toBe(false);

      // Verify Gross - Fees = Net
      expect(breakdown.netAmount).toBeCloseTo(breakdown.grossAmount - breakdown.totalFees, 4);
    });

    test('calculates fee breakdown and conversion rate for XLM payment', () => {
      const mock = {
        amount: 5000.0,
        asset: 'XLM',
        fee: 0.00001,
      };

      const breakdown = calculatePaymentFeeBreakdown(mock);
      expect(breakdown.grossAmount).toBe(5000.0);
      expect(breakdown.facilPayFee).toBe(50.0); // 1% of 5000
      expect(breakdown.networkFeeXlm).toBe(0.00001);
      expect(breakdown.conversionRate).toBe('1 XLM = 0.1250 USDC');
      expect(breakdown.isConverted).toBe(true);

      expect(breakdown.netAmount).toBeCloseTo(breakdown.grossAmount - breakdown.totalFees, 4);
    });

    test('calculates fee breakdown and conversion rate for EURC payment', () => {
      const mock = {
        amount: 200.0,
        asset: 'EURC',
        fee: 0.00001,
      };

      const breakdown = calculatePaymentFeeBreakdown(mock);
      expect(breakdown.grossAmount).toBe(200.0);
      expect(breakdown.facilPayFee).toBe(2.0);
      expect(breakdown.conversionRate).toBe('1 EURC = 1.0850 USDC');
      expect(breakdown.isConverted).toBe(true);
    });
  });

  describe('CSV Export Integration', () => {
    test('PAYMENT_EXPORT_COLUMNS includes all fee breakdown and conversion fields', () => {
      const columnKeys = PAYMENT_EXPORT_COLUMNS.map((col) => col.key);
      expect(columnKeys).toContain('grossAmount');
      expect(columnKeys).toContain('facilPayFee');
      expect(columnKeys).toContain('networkFeeXlm');
      expect(columnKeys).toContain('networkFeeFiat');
      expect(columnKeys).toContain('netAmount');
      expect(columnKeys).toContain('conversionRate');
    });

    test('generates CSV with fee breakdown and net amounts properly formatted', () => {
      const testData = INITIAL_PAYMENTS.slice(0, 3);
      const csv = generateCsv(testData, PAYMENT_EXPORT_COLUMNS);

      // Check Header Row contains required columns
      expect(csv).toContain('Gross Amount');
      expect(csv).toContain('FacilPay Fee');
      expect(csv).toContain('Stellar Network Fee (XLM)');
      expect(csv).toContain('Stellar Network Fee (Fiat)');
      expect(csv).toContain('Net Amount Received');
      expect(csv).toContain('Conversion Rate');

      // Check first row (pay_20260115_9f8a2c) data
      expect(csv).toContain('1250.00'); // Gross Amount
      expect(csv).toContain('12.50');   // FacilPay Fee
      expect(csv).toContain('1237.50'); // Net Amount (formatted to 2 decimals)
      expect(csv).toContain('Direct (1:1)');

      // Check converted row (pay_20260122_3b4c5d - XLM)
      expect(csv).toContain('3200.00'); // Gross Amount
      expect(csv).toContain('32.00');   // FacilPay Fee
      expect(csv).toContain('3168.00'); // Net Amount
      expect(csv).toContain('1 XLM = 0.1250 USDC');
    });
  });
});
