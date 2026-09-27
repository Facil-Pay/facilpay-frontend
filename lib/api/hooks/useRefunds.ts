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
import type {
  Refund,
  RefundListParams,
  RefundSummary,
  RetryRefundResponse,
} from "@/lib/types/refund";

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

/** Filtered, paginated refund list for the /refunds page. */
export function useRefundList(
  params: RefundListParams,
  options?: Partial<UseQueryOptions<Paginated<Refund>, ApiError>>
) {
  return useQuery<Paginated<Refund>, ApiError>({
    queryKey: refundKeys.list(params),
    queryFn:  () => apiClient.get<Paginated<Refund>>("/refunds", { params: { ...params } }),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    ...options,
  });
}

/** Totals for the refunds summary header, scoped to the same filters. */
export function useRefundSummary(
  params: RefundListParams,
  options?: Partial<UseQueryOptions<RefundSummary, ApiError>>
) {
  return useQuery<RefundSummary, ApiError>({
    queryKey: refundKeys.summary(params),
    queryFn:  () => apiClient.get<RefundSummary>("/refunds/summary", { params: { ...params } }),
    staleTime: 30_000,
    ...options,
  });
}

/**
 * Retries a failed refund by re-running the signing flow:
 *   1. POST /refunds/:id/retry rebuilds the refund transaction
 *   2. if an unsigned XDR is returned, the merchant wallet signs it
 *   3. POST /refunds/:id/submit broadcasts the signed transaction
 */
export function useRetryRefund(signTransaction: (xdr: string) => Promise<string>) {
  const qc = useQueryClient();
  return useMutation<Refund, ApiError | Error, string>({
    mutationFn: async (id) => {
      const { refund, xdr } = await apiClient.post<RetryRefundResponse>(`/refunds/${id}/retry`);
      if (!xdr) return refund;
      const signedXdr = await signTransaction(xdr);
      return apiClient.post<Refund>(`/refunds/${id}/submit`, { body: { signedXdr } });
    },
    onSuccess: (updated) => {
      qc.setQueryData(refundKeys.detail(updated.id), updated);
      void qc.invalidateQueries({ queryKey: refundKeys.all() });
    },
  });
}
