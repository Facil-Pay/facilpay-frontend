/**
 * lib/api/hooks/useDashboard.ts
 *
 * TanStack Query hook for the Dashboard Overview endpoint.
 */

"use client";

import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiClient, type ApiError }       from "@/lib/api/client";
import { dashboardKeys }                  from "@/lib/api/keys";

// Re-use the shape already defined in the app layer
import type { DashboardData } from "@/app/lib/api/dashboard";

export function useDashboard(
  options?: Partial<UseQueryOptions<DashboardData, ApiError>>
) {
  return useQuery<DashboardData, ApiError>({
    queryKey: dashboardKeys.overview(),
    queryFn:  () => apiClient.get<DashboardData>("/dashboard"),
    staleTime: 60_000,   // 1 min — dashboard data changes slowly
    refetchInterval: 5 * 60_000, // background refresh every 5 min
    ...options,
  });
}
