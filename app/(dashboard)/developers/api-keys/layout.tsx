import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API Keys & Developers | FacilPay Dashboard',
  description: 'Manage publishable and secret API keys, configure permissions, roll credentials, and view integration snippets.',
};

export default function ApiKeysLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
