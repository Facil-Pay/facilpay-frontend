'use client';

import React from 'react';
import Navbar from '@/components/Navbar';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { AuthProvider } from '@/lib/auth-context';

export default function OnboardingPage() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 flex flex-col">
        <Navbar />
        <main className="flex-1 py-8 px-4 sm:px-6">
          <OnboardingWizard />
        </main>
      </div>
    </AuthProvider>
  );
}
