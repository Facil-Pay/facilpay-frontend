import { describe, expect, it } from 'vitest';
import {
  createHtmlPaymentButton,
  createReactPaymentButton,
  getPaymentButtonStyle,
  getSafePaymentUrl,
} from '../lib/payment-button-snippet';

describe('payment button snippets', () => {
  const options = {
    url: 'https://pay.facilpay.io/pay/abc?item=1&source=store',
    label: 'Pay "now" & securely',
    size: 'large' as const,
    theme: 'brand' as const,
  };

  it('creates a standalone HTML anchor with escaped attributes and label', () => {
    const snippet = createHtmlPaymentButton(options);

    expect(snippet).toContain('href="https://pay.facilpay.io/pay/abc?item=1&amp;source=store"');
    expect(snippet).toContain('>Pay &quot;now&quot; &amp; securely</a>');
    expect(snippet).toContain('padding:14px 22px');
    expect(snippet).toContain('background-color:#0088ff');
  });

  it('uses the same style and content options in the React snippet and preview', () => {
    const snippet = createReactPaymentButton(options);
    const previewStyle = getPaymentButtonStyle(options.size, options.theme);

    expect(snippet).toContain(`href={"${options.url}"}`);
    expect(snippet).toContain(`{${JSON.stringify(options.label)}}`);
    expect(snippet).toContain(`fontSize: "${previewStyle.fontSize}"`);
    expect(snippet).toContain(`backgroundColor: "${previewStyle.backgroundColor}"`);
  });

  it('rejects unsafe and malformed payment URLs', () => {
    expect(getSafePaymentUrl('javascript:alert(1)')).toBeNull();
    expect(getSafePaymentUrl('not a url')).toBeNull();
    expect(getSafePaymentUrl('https://pay.facilpay.io/link')).toBe('https://pay.facilpay.io/link');
  });
});
