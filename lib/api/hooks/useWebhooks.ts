/**
 * lib/api/hooks/useWebhooks.ts
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient, type ApiError }       from "@/lib/api/client";
import { webhookKeys }                    from "@/lib/api/keys";
import type { Paginated, PaginationParams } from "@/lib/types/pagination";
import type {
  Webhook,
  WebhookDelivery,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from "@/lib/types/webhook";

export function useWebhooks(
  params: PaginationParams = {},
  options?: Partial<UseQueryOptions<Paginated<Webhook>, ApiError>>
) {
  return useQuery<Paginated<Webhook>, ApiError>({
    queryKey: webhookKeys.list(params),
    queryFn:  () =>
      apiClient.get<Paginated<Webhook>>("/webhooks", {
        params: params as Record<string, string | number>,
      }),
    staleTime: 60_000,
    ...options,
  });
}

export function useWebhook(
  id: string | undefined,
  options?: Partial<UseQueryOptions<Webhook, ApiError>>
) {
  return useQuery<Webhook, ApiError>({
    queryKey: webhookKeys.detail(id ?? ""),
    queryFn:  () => apiClient.get<Webhook>(`/webhooks/${id}`),
    enabled:  Boolean(id),
    staleTime: 60_000,
    ...options,
  });
}

export function useWebhookDeliveries(
  webhookId: string | undefined,
  options?: Partial<UseQueryOptions<Paginated<WebhookDelivery>, ApiError>>
) {
  return useQuery<Paginated<WebhookDelivery>, ApiError>({
    queryKey: webhookKeys.deliveries(webhookId ?? ""),
    queryFn:  () =>
      apiClient.get<Paginated<WebhookDelivery>>(
        `/webhooks/${webhookId}/deliveries`
      ),
    enabled:  Boolean(webhookId),
    staleTime: 30_000,
    ...options,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation<Webhook, ApiError, CreateWebhookRequest>({
    mutationFn: (body) => apiClient.post<Webhook>("/webhooks", { body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useUpdateWebhook(id: string) {
  const qc = useQueryClient();
  return useMutation<Webhook, ApiError, UpdateWebhookRequest>({
    mutationFn: (body) =>
      apiClient.patch<Webhook>(`/webhooks/${id}`, { body }),
    onSuccess: (updated) => {
      qc.setQueryData(webhookKeys.detail(id), updated);
      void qc.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => apiClient.delete(`/webhooks/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: webhookKeys.all() });
    },
  });
}
