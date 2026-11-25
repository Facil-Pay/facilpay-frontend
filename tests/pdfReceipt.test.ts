import { generateReceiptPdf } from '../lib/pdfReceipt';
import { PaymentRecord } from '../lib/types';

describe('PDF Receipt Generator Specification', () => {
  const samplePayment: PaymentRecord = {
    id: 'pay_test_987654',
    date: '2026-01-20T15:30:00.000Z',
    amount: 1250.0,
    asset: 'USDC',
    status: 'completed',
    customerEmail: 'test.customer@stellar.org',
    customerWallet: 'GDYTYQZ72P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5E7A',
    merchantId: 'merch_facilpay_01',
    merchantName: 'FacilPay Global Merchant',
    merchantEmail: 'billing@facilpay.io',
    txHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    stellarExpertUrl: 'https://stellar.expert/explorer/testnet/tx/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fee: 0.00001,
    description: 'Enterprise Tier License',
    memo: 'INV-TEST-01',
  };

  test('generates valid PDF Blob with application/pdf mime type', () => {
    const pdfBlob = generateReceiptPdf(samplePayment);
    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(pdfBlob.type).toBe('application/pdf');
    expect(pdfBlob.size).toBeGreaterThan(500); // Standard single-page PDF is several KB
  });

  test('PDF stream contains required payment details and Stellar Expert link', async () => {
    const pdfBlob = generateReceiptPdf(samplePayment);
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const decoder = new TextDecoder('latin1');
    const pdfText = decoder.decode(arrayBuffer);

    // Verify PDF 1.4 header and trailer
    expect(pdfText).toContain('%PDF-1.4');
    expect(pdfText).toContain('%%EOF');

    // Verify FacilPay Branding and Merchant Info
    expect(pdfText).toContain('FacilPay');
    expect(pdfText).toContain('OFFICIAL PAYMENT RECEIPT');
    expect(pdfText).toContain('FacilPay Global Merchant');
    expect(pdfText).toContain('billing@facilpay.io');

    // Verify Payment ID, Amount, Asset, Status
    expect(pdfText).toContain('pay_test_987654');
    expect(pdfText).toContain('1,250.00 USDC');
    expect(pdfText).toContain('COMPLETED');

    // Verify Transaction Hash and Stellar Expert URL Link Annotation
    expect(pdfText).toContain('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(pdfText).toContain('https://stellar.expert/explorer/testnet/tx/e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
    expect(pdfText).toContain('/Subtype /Link');
  });
});
