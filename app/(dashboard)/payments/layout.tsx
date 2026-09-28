import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Payments | FacilPay Merchant Dashboard',
  description: 'Manage payments, export CSV transaction reports, and download receipts.',
};

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
