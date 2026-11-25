import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaymentButtonGenerator from '@/components/developers/PaymentButtonGenerator';
import type { PaymentLinkData } from '@/types/onboarding';

const paymentLink: PaymentLinkData = {
  id: 'pl_123',
  title: 'Order 123',
  amount: '25.00',
  currency: 'USDC',
  description: '',
  paymentUrl: 'https://pay.facilpay.io/pay/pl_123',
  createdAt: '2026-01-01T00:00:00.000Z',
  status: 'active',
};
const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

afterEach(() => {
  vi.restoreAllMocks();
  if (originalClipboard) {
    Object.defineProperty(navigator, 'clipboard', originalClipboard);
  } else {
    Reflect.deleteProperty(navigator, 'clipboard');
  }
});

describe('PaymentButtonGenerator', () => {
  it('updates the live preview and generated snippets from the selected options', async () => {
    const user = userEvent.setup();
    const clipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: clipboard,
    });

    render(<PaymentButtonGenerator paymentLinks={[paymentLink]} />);

    const preview = screen.getByRole('link', { name: 'Pay with FacilPay' });
    expect(preview).toHaveAttribute('href', paymentLink.paymentUrl);

    await user.clear(screen.getByLabelText('Button label'));
    await user.type(screen.getByLabelText('Button label'), 'Pay for order');
    await user.selectOptions(screen.getByLabelText('Size'), 'large');
    await user.selectOptions(screen.getByLabelText('Theme'), 'dark');

    const updatedPreview = screen.getByRole('link', { name: 'Pay for order' });
    expect(updatedPreview.style.padding).toBe('14px 22px');
    expect(updatedPreview.style.backgroundColor).toBe('rgb(15, 23, 42)');
    expect(screen.getByText(/<a href="https:\/\/pay\.facilpay\.io\/pay\/pl_123"/)).toHaveTextContent(
      'Pay for order'
    );

    await user.click(screen.getByRole('button', { name: 'Copy HTML snippet' }));
    expect(clipboard.writeText).toHaveBeenCalledWith(
      expect.stringContaining('<a href="https://pay.facilpay.io/pay/pl_123"')
    );
    expect(screen.getByRole('button', { name: 'Copy React snippet' })).toBeInTheDocument();
  });

  it('does not render a clickable preview for unsafe URLs', async () => {
    render(<PaymentButtonGenerator paymentLinks={[]} />);
    fireEvent.change(screen.getByLabelText('Payment link'), {
      target: { value: 'javascript:alert(1)' },
    });

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('valid HTTP or HTTPS');
  });
});
