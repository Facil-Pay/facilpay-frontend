/**
 * lib/api/hooks/useSettings.ts
 *
 * Merchant settings: business profile, branding, payment preferences,
 * sessions and linked wallets.
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient, type ApiError } from "@/lib/api/client";
import { merchantKeys }              from "@/lib/api/keys";
import type {
  Branding,
  BusinessProfile,
  LinkedWallet,
  MerchantSession,
  PaymentPreferences,
  UploadLogoRequest,
  UploadLogoResponse,
} from "@/lib/types/settings";

// ─── Business profile ─────────────────────────────────────────────────────────

const profileKey = [...merchantKeys.profile(), "business"] as const;

export function useBusinessProfile(
  options?: Partial<UseQueryOptions<BusinessProfile, ApiError>>
) {
  return useQuery<BusinessProfile, ApiError>({
    queryKey: profileKey,
    queryFn:  () => apiClient.get<BusinessProfile>("/merchant/profile"),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation<BusinessProfile, ApiError, BusinessProfile>({
    mutationFn: (body) => apiClient.patch<BusinessProfile>("/merchant/profile", { body }),
    onSuccess: (updated) => {
      qc.setQueryData(profileKey, updated);
      void qc.invalidateQueries({ queryKey: merchantKeys.profile() });
    },
  });
}

// ─── Branding ─────────────────────────────────────────────────────────────────

export function useBranding(options?: Partial<UseQueryOptions<Branding, ApiError>>) {
  return useQuery<Branding, ApiError>({
    queryKey: merchantKeys.branding(),
    queryFn:  () => apiClient.get<Branding>("/merchant/branding"),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export interface UpdateBrandingInput {
  brandColor: string;
  /** Existing URL, a new data URL to upload, or null to remove the logo */
  logo: string | null;
  logoFileName?: string;
}

export function useUpdateBranding() {
  const qc = useQueryClient();
  return useMutation<Branding, ApiError, UpdateBrandingInput>({
    mutationFn: async ({ brandColor, logo, logoFileName }) => {
      let logoUrl = logo;
      if (logo?.startsWith("data:")) {
        const contentType = logo.startsWith("data:image/svg+xml") ? "image/svg+xml" : "image/png";
        const uploaded = await apiClient.post<UploadLogoResponse, UploadLogoRequest>(
          "/merchant/branding/logo",
          { body: { fileName: logoFileName ?? "logo", contentType, dataUrl: logo } }
        );
        logoUrl = uploaded.logoUrl;
      }
      return apiClient.patch<Branding, Branding>("/merchant/branding", {
        body: { brandColor, logoUrl },
      });
    },
    onSuccess: (updated) => {
      qc.setQueryData(merchantKeys.branding(), updated);
    },
  });
}

// ─── Payment preferences ──────────────────────────────────────────────────────

export function usePaymentPreferences(
  options?: Partial<UseQueryOptions<PaymentPreferences, ApiError>>
) {
  return useQuery<PaymentPreferences, ApiError>({
    queryKey: merchantKeys.preferences(),
    queryFn:  () => apiClient.get<PaymentPreferences>("/merchant/preferences"),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useUpdatePaymentPreferences() {
  const qc = useQueryClient();
  return useMutation<PaymentPreferences, ApiError, PaymentPreferences>({
    mutationFn: (body) => apiClient.patch<PaymentPreferences>("/merchant/preferences", { body }),
    onSuccess: (updated) => {
      qc.setQueryData(merchantKeys.preferences(), updated);
    },
  });
}

// ─── Security ─────────────────────────────────────────────────────────────────

export function useSessions(options?: Partial<UseQueryOptions<MerchantSession[], ApiError>>) {
  return useQuery<MerchantSession[], ApiError>({
    queryKey: merchantKeys.sessions(),
    queryFn:  () => apiClient.get<MerchantSession[]>("/merchant/sessions"),
    staleTime: 30_000,
    ...options,
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (sessionId) => apiClient.delete(`/merchant/sessions/${sessionId}`),
    onSuccess: (_, sessionId) => {
      qc.setQueryData<MerchantSession[]>(merchantKeys.sessions(), (current) =>
        current?.filter((session) => session.id !== sessionId)
      );
    },
  });
}

export function useRevokeOtherSessions() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, void>({
    mutationFn: () => apiClient.post("/merchant/sessions/revoke-others"),
    onSuccess: () => {
      qc.setQueryData<MerchantSession[]>(merchantKeys.sessions(), (current) =>
        current?.filter((session) => session.current)
      );
    },
  });
}

export function useLinkedWallets(options?: Partial<UseQueryOptions<LinkedWallet[], ApiError>>) {
  return useQuery<LinkedWallet[], ApiError>({
    queryKey: merchantKeys.wallets(),
    queryFn:  () => apiClient.get<LinkedWallet[]>("/merchant/wallets"),
    staleTime: 5 * 60_000,
    ...options,
  });
}
