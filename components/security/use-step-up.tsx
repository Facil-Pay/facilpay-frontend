"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { STEP_UP_HEADER, fetchTwoFactorStatus, useVerifyStepUp } from "@/lib/api/hooks/useTwoFactor";
import type { SensitiveAction } from "@/lib/types/settings";
import { TwoFactorChallengeDialog } from "./TwoFactorChallengeDialog";

/** Proof of a fresh 2FA check; spread `headers` into the sensitive request. */
export interface StepUpGrant {
  headers: Record<string, string>;
}

const ACTION_COPY: Record<SensitiveAction, { title: string; description: string; submitLabel: string }> = {
  create_payout: {
    title: "Confirm payout",
    description: "Enter the 6-digit code from your authenticator app to send this payout.",
    submitLabel: "Confirm payout",
  },
  reveal_api_key: {
    title: "Reveal API key",
    description: "Enter the 6-digit code from your authenticator app to view this secret key.",
    submitLabel: "Reveal key",
  },
  change_settlement_address: {
    title: "Change settlement address",
    description: "Enter the 6-digit code from your authenticator app. New payments will settle to the updated address.",
    submitLabel: "Confirm change",
  },
};

interface PendingStepUp {
  action: SensitiveAction;
  resolve: (grant: StepUpGrant | null) => void;
}

/**
 * Gate a sensitive action behind a fresh 2FA code.
 *
 *   const { requestStepUp, stepUpDialog } = useStepUp();
 *   const grant = await requestStepUp("create_payout");
 *   if (!grant) return;                      // user cancelled
 *   await apiClient.post("/payouts", { body, headers: grant.headers });
 *   …
 *   return <>{…}{stepUpDialog}</>;
 *
 * Merchants without 2FA get an empty grant immediately. The server remains
 * the authority: it rejects sensitive requests without a valid token when
 * 2FA is enabled. Rejects if the 2FA status cannot be loaded.
 */
export function useStepUp(): {
  requestStepUp: (action: SensitiveAction) => Promise<StepUpGrant | null>;
  stepUpDialog: ReactNode;
} {
  const queryClient = useQueryClient();
  const verify = useVerifyStepUp();
  const [pending, setPending] = useState<PendingStepUp | null>(null);
  const pendingRef = useRef<PendingStepUp | null>(null);

  const settle = useCallback((grant: StepUpGrant | null) => {
    pendingRef.current?.resolve(grant);
    pendingRef.current = null;
    setPending(null);
  }, []);

  // Never leave a caller awaiting forever if the component goes away mid-prompt.
  useEffect(() => () => pendingRef.current?.resolve(null), []);

  const requestStepUp = useCallback(
    async (action: SensitiveAction): Promise<StepUpGrant | null> => {
      const status = await fetchTwoFactorStatus(queryClient);
      if (!status.enabled) return { headers: {} };

      // A second request while one is open replaces it; the first caller gets "cancelled".
      pendingRef.current?.resolve(null);
      return new Promise<StepUpGrant | null>((resolve) => {
        const next = { action, resolve };
        pendingRef.current = next;
        setPending(next);
      });
    },
    [queryClient],
  );

  const copy = ACTION_COPY[pending?.action ?? "create_payout"];

  const stepUpDialog = (
    <TwoFactorChallengeDialog
      open={pending !== null}
      title={copy.title}
      description={copy.description}
      submitLabel={copy.submitLabel}
      onCancel={() => settle(null)}
      onSubmit={async (code) => {
        if (!pendingRef.current) return;
        const { token } = await verify.mutateAsync({ action: pendingRef.current.action, code });
        settle({ headers: { [STEP_UP_HEADER]: token } });
      }}
    />
  );

  return { requestStepUp, stepUpDialog };
}
