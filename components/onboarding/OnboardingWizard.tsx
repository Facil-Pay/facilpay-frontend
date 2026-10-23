'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { OnboardingState, BusinessDetails, SettlementAccount, TrustlinesState, BrandingDetails, PaymentLinkData } from '@/types/onboarding';
import { getOnboardingState, saveOnboardingState, INITIAL_ONBOARDING_STATE } from '@/lib/storage';
import { useAuth } from '@/lib/auth-context';
import StepIndicator from './StepIndicator';
import StepWelcome from './StepWelcome';
import StepBusinessDetails from './StepBusinessDetails';
import StepSettlement from './StepSettlement';
import StepTrustlines from './StepTrustlines';
import StepBranding from './StepBranding';
import StepPaymentLink from './StepPaymentLink';
import StepDone from './StepDone';

export default function OnboardingWizard() {
  const router = useRouter();
  const t = useTranslations('onboarding');
  const { completeProfile } = useAuth();
  const [state, setState] = useState<OnboardingState>(INITIAL_ONBOARDING_STATE);
  const [isLoaded, setIsLoaded] = useState(false);

  // Resume saved progress on mount
  useEffect(() => {
    const saved = getOnboardingState();
    setState(saved);
    setIsLoaded(true);
  }, []);

  const persistState = (newState: OnboardingState) => {
    setState(newState);
    saveOnboardingState(newState);
  };

  const handleStepClick = (stepId: number) => {
    if (stepId < state.currentStep || state.completedSteps.includes(stepId)) {
      const updated = { ...state, currentStep: stepId };
      persistState(updated);
    }
  };

  const handleBack = () => {
    if (state.currentStep > 1) {
      const updated = { ...state, currentStep: state.currentStep - 1 };
      persistState(updated);
    }
  };

  // Step 1: Welcome Next
  const handleWelcomeNext = () => {
    const completed = Array.from(new Set([...state.completedSteps, 1]));
    const updated: OnboardingState = {
      ...state,
      currentStep: 2,
      completedSteps: completed,
    };
    persistState(updated);
  };

  // Step 2: Business Details Next
  const handleBusinessNext = (business: BusinessDetails) => {
    const completed = Array.from(new Set([...state.completedSteps, 2]));
    const updated: OnboardingState = {
      ...state,
      business,
      currentStep: 3,
      completedSteps: completed,
    };
    persistState(updated);
  };

  // Step 3: Settlement Next
  const handleSettlementNext = (settlement: SettlementAccount) => {
    const completed = Array.from(new Set([...state.completedSteps, 3]));
    const updated: OnboardingState = {
      ...state,
      settlement,
      currentStep: 4,
      completedSteps: completed,
    };
    persistState(updated);
  };

  // Step 4: Trustlines Next
  const handleTrustlinesNext = (trustlines: TrustlinesState) => {
    const completed = Array.from(new Set([...state.completedSteps, 4]));
    const updated: OnboardingState = {
      ...state,
      trustlines,
      currentStep: 5,
      completedSteps: completed,
    };
    persistState(updated);
  };

  // Step 5: Branding Next
  const handleBrandingNext = (branding: BrandingDetails) => {
    const completed = Array.from(new Set([...state.completedSteps, 5]));
    const updated: OnboardingState = {
      ...state,
      branding,
      currentStep: 6,
      completedSteps: completed,
    };
    persistState(updated);
  };

  // Step 5: Branding Skip
  const handleBrandingSkip = () => {
    const completed = Array.from(new Set([...state.completedSteps, 5]));
    const updated: OnboardingState = {
      ...state,
      branding: {
        ...state.branding,
        skipped: true,
      },
      currentStep: 6,
      completedSteps: completed,
    };
    persistState(updated);
  };

  // Step 6: Payment Link Next
  const handlePaymentLinkNext = (paymentLink: PaymentLinkData) => {
    const completed = Array.from(new Set([...state.completedSteps, 6]));
    const updated: OnboardingState = {
      ...state,
      paymentLink,
      currentStep: 7,
      completedSteps: completed,
    };
    persistState(updated);
  };

  // Step 7: Done Finish
  const handleFinish = () => {
    const completed = Array.from(new Set([...state.completedSteps, 7]));
    const updated: OnboardingState = {
      ...state,
      isCompleted: true,
      completedSteps: completed,
    };
    persistState(updated);
    completeProfile();
    router.push('/overview');
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-zinc-500">
          <svg className="h-5 w-5 animate-spin text-[#0088FF]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span>{t('resuming')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Wizard Card Container */}
      <div className="rounded-3xl border border-zinc-200/80 bg-white/95 p-6 sm:p-10 shadow-xl shadow-zinc-900/5 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-950/90 dark:shadow-none">
        {/* Progress Stepper Bar */}
        <StepIndicator
          currentStep={state.currentStep}
          completedSteps={state.completedSteps}
          onStepClick={handleStepClick}
        />

        {/* Step Contents */}
        <div className="pt-2">
          {state.currentStep === 1 && (
            <StepWelcome onNext={handleWelcomeNext} />
          )}

          {state.currentStep === 2 && (
            <StepBusinessDetails
              initialData={state.business}
              onNext={handleBusinessNext}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 3 && (
            <StepSettlement
              initialData={state.settlement}
              onNext={handleSettlementNext}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 4 && (
            <StepTrustlines
              settlementAddress={state.settlement.address}
              initialData={state.trustlines}
              onNext={handleTrustlinesNext}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 5 && (
            <StepBranding
              businessName={state.business.name}
              initialData={state.branding}
              onNext={handleBrandingNext}
              onSkip={handleBrandingSkip}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 6 && (
            <StepPaymentLink
              branding={state.branding}
              initialData={state.paymentLink}
              onNext={handlePaymentLinkNext}
              onBack={handleBack}
            />
          )}

          {state.currentStep === 7 && (
            <StepDone
              data={state}
              onFinish={handleFinish}
              onBack={handleBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
