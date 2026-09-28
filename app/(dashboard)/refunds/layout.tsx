import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Refunds | FacilPay Merchant Dashboard',
  description: 'Manage and export customer refund reversals and accounting summaries.',
};

export default function RefundsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
