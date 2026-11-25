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

/**
 * React Query hook for analytics insights over a date range.
 *
 * Keeps the previous result visible while new parameters load, so charts do not flash empty.
 *
 * @param params - Range and filter parameters for the insights request.
 * @param options - Extra React Query options merged over the defaults.
 * @returns The query result. Errors are reported as an {@link ApiError}.
 */
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
