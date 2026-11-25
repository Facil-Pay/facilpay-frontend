import { Payment } from './types';
import { formatTaxLabel, getPaymentTax, toAssetAmountString } from './tax';

/**
 * Escapes characters for PDF string literals.
 * In PDF strings enclosed in parentheses ( ... ), '(', ')', and '\' must be escaped.
 */
function escapePdfText(str: string): string {
  if (!str) return '';
  return str.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * Generates a valid standard PDF 1.4 document for a FacilPay Payment Receipt.
 * Includes FacilPay vector branding, merchant info, amount, asset, date,
 * payment ID, transaction hash, and an interactive clickable Stellar Expert link.
 */
export function generateReceiptPdf(payment: Payment): Blob {
  const stellarUrl =
    payment.stellarExpertUrl ||
    `https://stellar.expert/explorer/testnet/tx/${payment.txHash}`;

  // PDF Page Dimensions: A4 (595.28 x 841.89 points)
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  // Tax line inside the amount card — only for payments made with a tax rate
  const tax = getPaymentTax(payment);
  const taxLines: string[] = tax
    ? [
        'BT',
        '/F1 9 Tf',
        '0.4 0.45 0.55 rg',
        `72 ${pageHeight - 232} Td`,
        `(${escapePdfText(
          `Subtotal ${toAssetAmountString(tax.subtotal, payment.asset)} ${payment.asset}  |  ${formatTaxLabel(tax)}: ${toAssetAmountString(tax.taxAmount, payment.asset)} ${payment.asset}`
        )}) Tj`,
        'ET',
      ]
    : [];

  // Link Annotation coordinates for Stellar Expert URL
  // In PDF, origin (0,0) is bottom-left
  // The Stellar Expert link will be placed around y = 245 to 265
  const linkX1 = 50;
  const linkY1 = 230;
  const linkX2 = 545;
  const linkY2 = 250;

  // Stream content using standard PDF operators:
  // rg = set fill color (RGB 0..1), RG = set stroke color
  // re = rectangle [x y w h], f = fill, s = stroke
  // BT = begin text, ET = end text, Tf = set font & size, Td = move text pos, Tj = show text
  const contentLines: string[] = [
    'q', // save graphics state

    // 1. Background clean white
    '1 1 1 rg',
    `0 0 ${pageWidth} ${pageHeight} re f`,

    // 2. FacilPay Deep Navy Brand Header Banner (height 130pt)
    '0.0 0.059 0.141 rg', // #000F24 Deep Navy
    `0 ${pageHeight - 130} ${pageWidth} 130 re f`,

    // Decorative subtle top border accent in Primary Blue (#55C2FF)
    '0.333 0.761 1.0 rg',
    `0 ${pageHeight - 6} ${pageWidth} 6 re f`,

    // 3. FacilPay Vector Logo Symbol
    // Two stylized polygon payment waves
    '0.333 0.761 1.0 rg', // Primary Blue #55C2FF
    `50 ${pageHeight - 65} m`,
    `75 ${pageHeight - 40} l`,
    `68 ${pageHeight - 40} l`,
    `43 ${pageHeight - 65} l`,
    'h f',

    '0.647 0.831 1.0 rg', // Soft Blue #A5D4FF
    `58 ${pageHeight - 75} m`,
    `83 ${pageHeight - 50} l`,
    `76 ${pageHeight - 50} l`,
    `51 ${pageHeight - 75} l`,
    'h f',

    // 4. Header Text (FacilPay + Subtitle)
    'BT',
    '/F2 26 Tf', // Helvetica-Bold 26pt
    '1 1 1 rg', // White
    `95 ${pageHeight - 58} Td`,
    '(FacilPay) Tj',
    'ET',

    'BT',
    '/F1 10 Tf', // Helvetica 10pt
    '0.647 0.831 1.0 rg', // Soft Blue
    `95 ${pageHeight - 74} Td`,
    '(OFFICIAL PAYMENT RECEIPT) Tj',
    'ET',

    'BT',
    '/F1 9 Tf',
    '0.7 0.75 0.85 rg',
    `410 ${pageHeight - 55} Td`,
    `(${escapePdfText(payment.merchantName || 'FacilPay Merchant')}) Tj`,
    `0 -14 Td`,
    `(${escapePdfText(payment.merchantEmail || 'support@facilpay.io')}) Tj`,
    'ET',

    // 5. Amount & Status Card
    '0.96 0.97 0.99 rg', // Light background card
    `50 ${pageHeight - 245} ${pageWidth - 100} 95 re f`,
    '0.88 0.91 0.95 RG', // Card border
    '1 w',
    `50 ${pageHeight - 245} ${pageWidth - 100} 95 re s`,

    // Card Left Accent Bar in Primary Blue
    '0.333 0.761 1.0 rg',
    `50 ${pageHeight - 245} 4 95 re f`,

    'BT',
    '/F1 10 Tf',
    '0.4 0.45 0.55 rg',
    `72 ${pageHeight - 175} Td`,
    '(Total Amount Paid) Tj',
    'ET',

    'BT',
    '/F2 26 Tf',
    '0.0 0.059 0.141 rg', // Deep Navy
    `72 ${pageHeight - 208} Td`,
    `(${escapePdfText(payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 }))} ${escapePdfText(payment.asset)}) Tj`,
    'ET',

    ...taxLines,

    // Status Badge (Right side of card)
    payment.status === 'COMPLETED'
      ? '0.85 0.96 0.89 rg' // Light green
      : payment.status === 'PENDING'
      ? '1.0 0.95 0.8 rg' // Light yellow
      : '0.98 0.88 0.88 rg', // Light red
    `415 ${pageHeight - 202} 110 28 re f`,

    'BT',
    '/F2 11 Tf',
    payment.status === 'COMPLETED'
      ? '0.05 0.55 0.25 rg' // Green text
      : payment.status === 'PENDING'
      ? '0.65 0.45 0.05 rg' // Yellow text
      : '0.75 0.15 0.15 rg', // Red text
    `435 ${pageHeight - 192} Td`,
    `(${escapePdfText(payment.status)}) Tj`,
    'ET',

    // 6. Section Divider: Merchant Information
    'BT',
    '/F2 13 Tf',
    '0.0 0.059 0.141 rg',
    `50 ${pageHeight - 275} Td`,
    '(Merchant & Customer Details) Tj',
    'ET',

    '0.85 0.88 0.92 RG',
    `50 ${pageHeight - 282} ${pageWidth - 100} 0.5 re s`,

    // Merchant Info Grid
    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 302} Td`,
    '(Merchant Name:) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(payment.merchantName || 'FacilPay Global Merchant')}) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 320} Td`,
    '(Merchant ID:) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(payment.merchantId || 'merch_facilpay_default')}) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 338} Td`,
    '(Customer Email:) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(payment.customerEmail || 'customer@example.com')}) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 356} Td`,
    '(Customer Wallet:) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(payment.customerWallet || 'N/A')}) Tj`,
    'ET',

    // 7. Section: Payment & Stellar Blockchain Details
    'BT',
    '/F2 13 Tf',
    '0.0 0.059 0.141 rg',
    `50 ${pageHeight - 390} Td`,
    '(Payment & Transaction Details) Tj',
    'ET',

    '0.85 0.88 0.92 RG',
    `50 ${pageHeight - 397} ${pageWidth - 100} 0.5 re s`,

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 417} Td`,
    '(Payment ID:) Tj',
    `140 0 Td`,
    '/F2 9 Tf',
    '0.0 0.059 0.141 rg',
    `(${escapePdfText(payment.id)}) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 435} Td`,
    '(Date & Time (UTC):) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(payment.date)}) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 453} Td`,
    '(Settlement Asset:) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(payment.asset)} on Stellar Network) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 471} Td`,
    '(Network Fee:) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(String(payment.fee || '0.00001'))} XLM) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 489} Td`,
    '(Description:) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(payment.description || 'Payment facilitation')}) Tj`,
    'ET',

    'BT',
    '/F2 9 Tf',
    '0.3 0.35 0.45 rg',
    `50 ${pageHeight - 507} Td`,
    '(Memo:) Tj',
    `140 0 Td`,
    '/F1 9 Tf',
    '0.1 0.1 0.1 rg',
    `(${escapePdfText(payment.memo || 'None')}) Tj`,
    'ET',

    // 8. Blockchain Verification Box (Transaction Hash & Stellar Expert Link)
    '0.95 0.97 1.0 rg', // Soft blue tinted card
    `50 ${pageHeight - 625} ${pageWidth - 100} 100 re f`,
    '0.75 0.85 0.95 RG',
    '1 w',
    `50 ${pageHeight - 625} ${pageWidth - 100} 100 re s`,

    'BT',
    '/F2 11 Tf',
    '0.0 0.25 0.65 rg',
    `68 ${pageHeight - 545} Td`,
    '(Blockchain Verification on Stellar) Tj',
    'ET',

    'BT',
    '/F2 8.5 Tf',
    '0.3 0.35 0.45 rg',
    `68 ${pageHeight - 564} Td`,
    '(Transaction Hash:) Tj',
    'ET',

    'BT',
    '/F1 8 Tf',
    '0.15 0.2 0.3 rg',
    `68 ${pageHeight - 577} Td`,
    `(${escapePdfText(payment.txHash)}) Tj`,
    'ET',

    'BT',
    '/F2 8.5 Tf',
    '0.3 0.35 0.45 rg',
    `68 ${pageHeight - 595} Td`,
    '(View on Stellar Expert Explorer (Clickable Link):) Tj',
    'ET',

    // Clickable link text in primary blue
    'BT',
    '/F2 8.5 Tf',
    '0.05 0.45 0.85 rg',
    `68 ${pageHeight - 609} Td`,
    `(${escapePdfText(stellarUrl)}) Tj`,
    'ET',

    // 9. Footer Security Notice
    '0.88 0.91 0.95 RG',
    `50 70 ${pageWidth - 100} 0.5 re s`,

    'BT',
    '/F1 8 Tf',
    '0.5 0.55 0.65 rg',
    `50 52 Td`,
    '(This is an official transaction receipt generated by FacilPay Payment Facilitation Network.) Tj',
    `0 -12 Td`,
    '(All transactions are recorded immutably on the Stellar distributed ledger. For disputes or inquiries, contact your merchant.) Tj',
    'ET',

    'Q', // restore graphics state
  ];

  const streamContent = contentLines.join('\n');
  const streamLength = streamContent.length;

  // Build the complete PDF-1.4 file
  const objects: string[] = [];

  // Object 1: Catalog
  objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Object 2: Pages
  objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // Object 3: Page (includes dimensions, content stream, font resources, and link annotation)
  objects.push(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Annots [7 0 R] >>\nendobj\n`
  );

  // Object 4: Stream Content
  objects.push(
    `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream\nendobj\n`
  );

  // Object 5: Helvetica Font
  objects.push(
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n'
  );

  // Object 6: Helvetica-Bold Font
  objects.push(
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n'
  );

  // Object 7: Interactive URI Link Annotation for Stellar Expert
  // Link coordinates match the Stellar Expert URL location
  objects.push(
    `7 0 obj\n<< /Type /Annot /Subtype /Link /Rect [${linkX1} ${pageHeight - 618} ${linkX2} ${pageHeight - 598}] /Border [0 0 0] /A << /Type /Action /S /URI /URI (${stellarUrl}) >> >>\nendobj\n`
  );

  // Calculate byte offsets for XREF table
  let currentOffset = 0;
  const header = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
  currentOffset += header.length;

  const offsets: number[] = [0]; // 0 is special object 0
  for (const obj of objects) {
    offsets.push(currentOffset);
    currentOffset += obj.length;
  }

  // Cross Reference Table
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += String(offsets[i]).padStart(10, '0') + ' 00000 n \n';
  }

  const startxref = currentOffset;
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`;

  const pdfString = header + objects.join('') + xref + trailer;

  // Convert to binary Uint8Array Blob
  const buffer = new Uint8Array(pdfString.length);
  for (let i = 0; i < pdfString.length; i++) {
    buffer[i] = pdfString.charCodeAt(i) & 0xff;
  }

  return new Blob([buffer], { type: 'application/pdf' });
}

/**
 * Generates and triggers download of the PDF receipt for a payment.
 */
export function downloadPaymentReceipt(payment: Payment): void {
  const blob = generateReceiptPdf(payment);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `facilpay-receipt-${payment.id}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Triggers native browser print dialog with print-optimized styles for the receipt.
 */
export function printPaymentReceipt(): void {
  window.print();
}
