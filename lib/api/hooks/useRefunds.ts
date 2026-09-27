/**
 * lib/api/hooks/useRefunds.ts
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient, type ApiError } from "@/lib/api/client";
import { refundKeys }               from "@/lib/api/keys";
import type { Paginated }           from "@/lib/types/pagination";
import type { Refund }              from "@/lib/types/refund";

export function useRefunds(
  paymentId?: string,
  options?: Partial<UseQueryOptions<Paginated<Refund>, ApiError>>
) {
  const key = paymentId
    ? refundKeys.byPayment(paymentId)
    : refundKeys.lists();

  return useQuery<Paginated<Refund>, ApiError>({
    queryKey: key,
    queryFn:  () => {
      const path = paymentId ? `/payments/${paymentId}/refunds` : "/refunds";
      return apiClient.get<Paginated<Refund>>(path);
    },
    staleTime: 30_000,
    ...options,
  });
}

export function useRefund(
  id: string | undefined,
  options?: Partial<UseQueryOptions<Refund, ApiError>>
) {
  return useQuery<Refund, ApiError>({
    queryKey: refundKeys.detail(id ?? ""),
    queryFn:  () => apiClient.get<Refund>(`/refunds/${id}`),
    enabled:  Boolean(id),
    staleTime: 60_000,
    ...options,
  });
}

export function useCancelRefund(id: string) {
  const qc = useQueryClient();
  return useMutation<Refund, ApiError, void>({
    mutationFn: () => apiClient.post<Refund>(`/refunds/${id}/cancel`),
    onSuccess: (updated) => {
      qc.setQueryData(refundKeys.detail(id), updated);
      void qc.invalidateQueries({ queryKey: refundKeys.lists() });
    },
  });
}
