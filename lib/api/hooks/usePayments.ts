/**
 * lib/api/hooks/usePayments.ts
 *
 * TanStack Query hooks for the Payments domain.
 *
 * When NEXT_PUBLIC_USE_MOCKS=true the underlying fetch is intercepted by MSW,
 * so these hooks work identically in mock mode and against a real backend.
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient, type ApiError } from "@/lib/api/client";
import { paymentKeys, refundKeys }  from "@/lib/api/keys";
import type { Paginated }           from "@/lib/types/pagination";
import type {
  Payment,
  PaymentListParams,
  CreatePaymentRequest,
  UpdatePaymentRequest,
} from "@/lib/types/payment";
import type { CreateRefundRequest, Refund } from "@/lib/types/refund";

// ─── List ─────────────────────────────────────────────────────────────────────

export function usePayments(
  params: PaymentListParams = {},
  options?: Partial<UseQueryOptions<Paginated<Payment>, ApiError>>
) {
  return useQuery<Paginated<Payment>, ApiError>({
    queryKey: paymentKeys.list(params),
    queryFn:  () =>
      apiClient.get<Paginated<Payment>>("/payments", {
        params: params as Record<string, string | number | boolean>,
      }),
    staleTime: 30_000,   // 30 s
    ...options,
  });
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export function usePayment(
  id: string | undefined,
  options?: Partial<UseQueryOptions<Payment, ApiError>>
) {
  return useQuery<Payment, ApiError>({
    queryKey: paymentKeys.detail(id ?? ""),
    queryFn:  () => apiClient.get<Payment>(`/payments/${id}`),
    enabled:  Boolean(id),
    staleTime: 60_000,  // 1 min
    ...options,
  });
}

// ─── Create ───────────────────────────────────────────────────────────────────

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation<Payment, ApiError, CreatePaymentRequest>({
    mutationFn: (body) => apiClient.post<Payment>("/payments", { body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export function useUpdatePayment(id: string) {
  const qc = useQueryClient();
  return useMutation<Payment, ApiError, UpdatePaymentRequest>({
    mutationFn: (body) =>
      apiClient.patch<Payment>(`/payments/${id}`, { body }),
    onSuccess: (updated) => {
      qc.setQueryData(paymentKeys.detail(id), updated);
      void qc.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export function useCancelPayment(id: string) {
  const qc = useQueryClient();
  return useMutation<Payment, ApiError, void>({
    mutationFn: () => apiClient.post<Payment>(`/payments/${id}/cancel`),
    onSuccess: (updated) => {
      qc.setQueryData(paymentKeys.detail(id), updated);
      void qc.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

// ─── Retry ────────────────────────────────────────────────────────────────────

export function useRetryPayment(id: string) {
  const qc = useQueryClient();
  return useMutation<Payment, ApiError, void>({
    mutationFn: () => apiClient.post<Payment>(`/payments/${id}/retry`),
    onSuccess: (updated) => {
      qc.setQueryData(paymentKeys.detail(id), updated);
      void qc.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}

// ─── Refund ───────────────────────────────────────────────────────────────────

export function useRefundPayment(paymentId: string) {
  const qc = useQueryClient();
  return useMutation<Refund, ApiError, Omit<CreateRefundRequest, "paymentId">>({
    mutationFn: (body) =>
      apiClient.post<Refund>(`/payments/${paymentId}/refund`, {
        body: { ...body, paymentId },
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: paymentKeys.detail(paymentId) });
      void qc.invalidateQueries({ queryKey: refundKeys.byPayment(paymentId) });
      void qc.invalidateQueries({ queryKey: paymentKeys.lists() });
    },
  });
}
