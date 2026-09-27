/**
 * lib/api/hooks/useAnalytics.ts
 */

"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";

import { apiClient, type ApiError } from "@/lib/api/client";
import { analyticsKeys }             from "@/lib/api/keys";
import type {
  AnalyticsInsights,
  AnalyticsInsightsParams,
} from "@/lib/types/analytics";

export function useAnalyticsInsights(
  params: AnalyticsInsightsParams,
  options?: Partial<UseQueryOptions<AnalyticsInsights, ApiError>>
) {
  return useQuery<AnalyticsInsights, ApiError>({
    queryKey: analyticsKeys.insights(params),
    queryFn:  () =>
      apiClient.get<AnalyticsInsights>("/analytics/insights", { params: { ...params } }),
    staleTime: 60_000,
    placeholderData: (previous) => previous,
    ...options,
  });
}
