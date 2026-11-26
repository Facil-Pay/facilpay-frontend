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

/**
 * React Query hook for a paginated list of webhook endpoints.
 *
 * @param params - Pagination parameters. Defaults to an empty object, which uses the API's default page.
 * @param options - Extra React Query options merged over the defaults.
 * @returns The query result with `Paginated<Webhook>` data. Errors are reported as an {@link ApiError}.
 */
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

/**
 * React Query hook for a single webhook endpoint.
 *
 * The query stays disabled while `id` is empty.
 *
 * @param id - Webhook ID, or `undefined` to keep the query idle.
 * @param options - Extra React Query options merged over the defaults.
 * @returns The query result. Errors are reported as an {@link ApiError}.
 */
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

/**
 * React Query hook for recent delivery attempts of one webhook.
 *
 * The query stays disabled while `webhookId` is empty.
 *
 * @param webhookId - Webhook whose deliveries to load, or `undefined` to keep the query idle.
 * @param options - Extra React Query options merged over the defaults.
 * @returns The query result with `Paginated<WebhookDelivery>` data. Errors are reported as an {@link ApiError}.
 */
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

/**
 * Mutation that creates a webhook endpoint and refreshes the webhook lists on success.
 *
 * @returns A React Query mutation that sends `CreateWebhookRequest`. Rejects with an {@link ApiError} when the API returns a validation or server error.
 */
export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation<Webhook, ApiError, CreateWebhookRequest>({
    mutationFn: (body) => apiClient.post<Webhook>("/webhooks", { body }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: webhookKeys.lists() });
    },
  });
}

/**
 * Mutation that updates one webhook endpoint.
 *
 * On success the cached detail is replaced with the response and the webhook lists are invalidated.
 *
 * @param id - Webhook ID to update.
 * @returns A React Query mutation that sends `UpdateWebhookRequest`. Rejects with an {@link ApiError} on failure.
 */
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

/**
 * Mutation that deletes a webhook endpoint by ID and invalidates all cached webhook queries on success.
 *
 * @returns A React Query mutation whose variable is the webhook ID. Rejects with an {@link ApiError} on failure.
 */
export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation<void, ApiError, string>({
    mutationFn: (id) => apiClient.delete(`/webhooks/${id}`),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: webhookKeys.all() });
    },
  });
}
