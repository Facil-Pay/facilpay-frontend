import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Webhook Event Catalog | FacilPay Developers',
  description: 'Complete reference for every webhook event emitted by FacilPay across payments, refunds, escrows, and payouts on the Stellar network.',
};

export default function WebhookEventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
