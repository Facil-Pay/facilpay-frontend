'use client';

import React from 'react';
import { AuthProvider } from '@/lib/auth-context';
import WebhookManagementView from '@/components/webhooks/WebhookManagementView';

export default function WebhooksPage() {
  return (
    <AuthProvider>
      <WebhookManagementView />
    </AuthProvider>
  );
}
