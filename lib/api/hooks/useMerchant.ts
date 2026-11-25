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

/**
 * React Query hook for the authenticated merchant's profile.
 *
 * @param options - Extra React Query options merged over the defaults.
 * @returns The query result. Errors are reported as an {@link ApiError}.
 */
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

/**
 * React Query hook for the merchant's team members.
 *
 * @param options - Extra React Query options merged over the defaults.
 * @returns The query result. Errors are reported as an {@link ApiError}.
 */
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

/**
 * Mutation that invites a team member and refreshes the team list on success.
 *
 * @returns A React Query mutation. Calling `mutate` or `mutateAsync` sends `InviteTeamMemberRequest`.
 *   Rejects with an {@link ApiError} when the API refuses the invite.
 */
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

/**
 * Mutation that updates one team member's role or details.
 *
 * On success the member's cached entry is replaced with the response and the team list is invalidated.
 *
 * @param memberId - ID of the team member to update.
 * @returns A React Query mutation that sends `UpdateTeamMemberRequest`. Rejects with an {@link ApiError} on failure.
 */
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

/**
 * Mutation that removes a team member and refreshes the team list on success.
 *
 * @returns A React Query mutation whose variable is the member ID. Rejects with an {@link ApiError} on failure.
 */
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
