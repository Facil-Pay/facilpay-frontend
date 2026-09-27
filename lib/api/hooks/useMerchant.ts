/**
 * lib/api/hooks/useMerchant.ts
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient, type ApiError }     from "@/lib/api/client";
import { merchantKeys }                 from "@/lib/api/keys";
import type {
  Merchant,
  TeamMember,
  InviteTeamMemberRequest,
  UpdateTeamMemberRequest,
} from "@/lib/types/merchant";

export function useMerchantProfile(
  options?: Partial<UseQueryOptions<Merchant, ApiError>>
) {
  return useQuery<Merchant, ApiError>({
    queryKey: merchantKeys.profile(),
    queryFn:  () => apiClient.get<Merchant>("/merchant"),
    staleTime: 5 * 60_000,
    ...options,
  });
}

export function useTeamMembers(
  options?: Partial<UseQueryOptions<TeamMember[], ApiError>>
) {
  return useQuery<TeamMember[], ApiError>({
    queryKey: merchantKeys.team(),
    queryFn:  () => apiClient.get<TeamMember[]>("/merchant/team"),
    staleTime: 2 * 60_000,
    ...options,
  });
}

export function useInviteTeamMember() {
  const qc = useQueryClient();
  return useMutation<TeamMember, ApiError, InviteTeamMemberRequest>({
    mutationFn: (body) =>
      apiClient.post<TeamMember>("/merchant/team/invite", { body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: merchantKeys.team() });
    },
  });
}

export function useUpdateTeamMember(memberId: string) {
  const qc = useQueryClient();
  return useMutation<TeamMember, ApiError, UpdateTeamMemberRequest>({
    mutationFn: (body) =>
      apiClient.patch<TeamMember>(`/merchant/team/${memberId}`, { body }),
    onSuccess: (updated) => {
      qc.setQueryData(merchantKeys.teamMember(memberId), updated);
      void qc.invalidateQueries({ queryKey: merchantKeys.team() });
    },
  });
}

export function useRemoveTeamMember() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (memberId) =>
      apiClient.delete(`/merchant/team/${memberId}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: merchantKeys.team() });
    },
  });
}
