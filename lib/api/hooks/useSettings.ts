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

/**
 * React Query hook for the merchant's business profile.
 *
 * Data is cached for five minutes.
 *
 * @param options - Extra React Query options merged over the defaults.
 * @returns The query result with `BusinessProfile` data. Errors are reported as an {@link ApiError}.
 */
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

/**
 * Variables for {@link useUpdateBusinessProfile}.
 *
 * @property profile - Full profile to save.
 * @property headers - Step-up headers from a fresh 2FA check. Required by the API when the settlement address changes and 2FA is enabled.
 */
export interface UpdateBusinessProfileInput {
  profile: BusinessProfile;
  /** Step-up headers; required by the API when the settlement address changes and 2FA is on */
  headers?: Record<string, string>;
}

/**
 * Mutation that saves the business profile.
 *
 * On success the cached profile is replaced with the saved version and the profile queries are invalidated.
 *
 * @returns A React Query mutation that takes {@link UpdateBusinessProfileInput}. Rejects with an {@link ApiError}; a 403 may indicate a missing or expired step-up token.
 */
export function useUpdateBusinessProfile() {
  const qc = useQueryClient();
  return useMutation<BusinessProfile, ApiError, UpdateBusinessProfileInput>({
    mutationFn: ({ profile, headers }) =>
      apiClient.patch<BusinessProfile>("/merchant/profile", { body: profile, headers }),
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

/**
 * Variables for {@link useUpdateBranding}.
 *
 * @property brandColor - Hex colour such as `#20A7EE`.
 * @property logo - Existing URL, a `data:` URL that must be uploaded first, or `null` to remove the logo.
 * @property logoFileName - Original file name, used as the upload name for new data URLs.
 */
export interface UpdateBrandingInput {
  brandColor: string;
  /** Existing URL, a new data URL to upload, or null to remove the logo */
  logo: string | null;
  logoFileName?: string;
}

/**
 * Mutation that saves checkout branding.
 *
 * When `logo` is a `data:` URL it is uploaded to `/merchant/branding/logo` first, and the returned URL is saved with the colour. The request then fails without saving the colour if the upload fails.
 *
 * @returns A React Query mutation that takes {@link UpdateBrandingInput}. Rejects with an {@link ApiError}.
 */
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

/**
 * Mutation that saves the merchant's default payment preferences.
 *
 * On success the cached preferences are replaced with the saved version.
 *
 * @returns A React Query mutation that sends the full `PaymentPreferences` object. Rejects with an {@link ApiError} on failure.
 */
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

/**
 * Mutation that signs out one merchant session.
 *
 * On success the session is removed from the cached session list without a refetch.
 *
 * @returns A React Query mutation whose variable is the session ID. Rejects with an {@link ApiError} on failure.
 */
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

/**
 * Mutation that signs out every session except the current one.
 *
 * On success the cached list is narrowed to the current session.
 *
 * @returns A React Query mutation with no variables. Rejects with an {@link ApiError} on failure.
 */
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

/**
 * React Query hook for the Stellar wallets linked to the merchant account.
 *
 * @param options - Extra React Query options merged over the defaults.
 * @returns The query result with `LinkedWallet[]` data. Errors are reported as an {@link ApiError}.
 */
export function useLinkedWallets(options?: Partial<UseQueryOptions<LinkedWallet[], ApiError>>) {
  return useQuery<LinkedWallet[], ApiError>({
    queryKey: merchantKeys.wallets(),
    queryFn:  () => apiClient.get<LinkedWallet[]>("/merchant/wallets"),
    staleTime: 5 * 60_000,
    ...options,
  });
}
