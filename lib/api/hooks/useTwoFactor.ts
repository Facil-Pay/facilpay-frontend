/**
 * lib/api/hooks/useTwoFactor.ts
 *
 * TOTP two-factor authentication: enrolment, disabling, step-up verification
 * for sensitive actions, and the second login step.
 *
 * Wrong codes must come back as 422 (`invalid_two_factor_code`), never 401 —
 * apiClient treats 401 as an expired session and logs the user out.
 */

"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient, type ApiError } from "@/lib/api/client";
import { merchantKeys } from "@/lib/api/keys";
import type {
  ConfirmTwoFactorRequest,
  ConfirmTwoFactorResponse,
  DisableTwoFactorRequest,
  LoginRequest,
  LoginResponse,
  LoginTwoFactorRequest,
  LoginTwoFactorResponse,
  StepUpRequest,
  StepUpResponse,
  TwoFactorEnrollment,
  TwoFactorStatus,
} from "@/lib/types/settings";

/** Header carrying a step-up token on sensitive requests. */
export const STEP_UP_HEADER = "X-FacilPay-2FA-Token";

/** A 6-digit authenticator code, or a recovery code (e.g. "7HQK-2M9D"). */
export const TWO_FACTOR_CODE_PATTERN = /^(\d{6}|[A-Z0-9]{4}-?[A-Z0-9]{4})$/i;

export function normalizeTwoFactorCode(code: string): string {
  return code.replace(/\s+/g, "").toUpperCase();
}

// ─── Status ───────────────────────────────────────────────────────────────────

const statusQuery = {
  queryKey: merchantKeys.twoFactor(),
  queryFn: () => apiClient.get<TwoFactorStatus>("/merchant/2fa"),
  staleTime: 60_000,
};

export function useTwoFactorStatus(options?: Partial<UseQueryOptions<TwoFactorStatus, ApiError>>) {
  return useQuery<TwoFactorStatus, ApiError>({ ...statusQuery, ...options });
}

/** Reads the cached status, fetching it only when stale or missing. */
export function fetchTwoFactorStatus(qc: QueryClient): Promise<TwoFactorStatus> {
  return qc.fetchQuery<TwoFactorStatus, ApiError>(statusQuery);
}

// ─── Enrolment ────────────────────────────────────────────────────────────────

export function useStartTwoFactorEnrollment() {
  return useMutation<TwoFactorEnrollment, ApiError, void>({
    mutationFn: () => apiClient.post<TwoFactorEnrollment>("/merchant/2fa/enroll"),
  });
}

export function useConfirmTwoFactorEnrollment() {
  const qc = useQueryClient();
  return useMutation<ConfirmTwoFactorResponse, ApiError, ConfirmTwoFactorRequest>({
    mutationFn: (body) =>
      apiClient.post<ConfirmTwoFactorResponse, ConfirmTwoFactorRequest>("/merchant/2fa/enroll/confirm", {
        body: { code: normalizeTwoFactorCode(body.code) },
      }),
    onSuccess: ({ recoveryCodes }) => {
      qc.setQueryData<TwoFactorStatus>(merchantKeys.twoFactor(), {
        enabled: true,
        enrolledAt: new Date().toISOString(),
        recoveryCodesRemaining: recoveryCodes.length,
      });
    },
  });
}

export function useDisableTwoFactor() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, DisableTwoFactorRequest>({
    mutationFn: (body) =>
      apiClient.post<void, DisableTwoFactorRequest>("/merchant/2fa/disable", {
        body: { ...body, code: normalizeTwoFactorCode(body.code) },
      }),
    onSuccess: () => {
      qc.setQueryData<TwoFactorStatus>(merchantKeys.twoFactor(), {
        enabled: false,
        enrolledAt: null,
        recoveryCodesRemaining: 0,
      });
    },
  });
}

// ─── Step-up for sensitive actions ────────────────────────────────────────────

export function useVerifyStepUp() {
  const qc = useQueryClient();
  return useMutation<StepUpResponse, ApiError, StepUpRequest>({
    mutationFn: (body) =>
      apiClient.post<StepUpResponse, StepUpRequest>("/merchant/2fa/verify", {
        body: { ...body, code: normalizeTwoFactorCode(body.code) },
      }),
    // A recovery code may have been consumed
    onSuccess: () => void qc.invalidateQueries({ queryKey: merchantKeys.twoFactor() }),
  });
}

// ─── Login ────────────────────────────────────────────────────────────────────

export function useLogin() {
  return useMutation<LoginResponse, ApiError, LoginRequest>({
    mutationFn: (body) => apiClient.post<LoginResponse, LoginRequest>("/auth/login", { body }),
  });
}

export function useLoginTwoFactor() {
  return useMutation<LoginTwoFactorResponse, ApiError, LoginTwoFactorRequest>({
    mutationFn: (body) =>
      apiClient.post<LoginTwoFactorResponse, LoginTwoFactorRequest>("/auth/login/2fa", {
        body: { ...body, code: normalizeTwoFactorCode(body.code) },
      }),
  });
}
