"use client";

import { AlertCircle } from "lucide-react";
import { useAnalyticsInsights } from "@/lib/api/hooks/useAnalytics";
import type { AnalyticsRange } from "@/lib/types/analytics";
import { AssetBreakdown } from "./AssetBreakdown";
import { ConversionFunnel } from "./ConversionFunnel";
import { GeographyBreakdown } from "./GeographyBreakdown";
import { PaymentMethodSplit } from "./PaymentMethodSplit";
import { TopCustomers } from "./TopCustomers";

/** Deeper analytics section; every widget is scoped to the page's date range and asset filter. */
export function AnalyticsInsights({ range, asset }: { range: AnalyticsRange; asset?: string }) {
  const { data, isLoading, isError, error, refetch } = useAnalyticsInsights({ range, asset });

  return (
    <section aria-labelledby="insights-heading" className="mt-10">
      <div className="mb-4">
        <h2 id="insights-heading" className="text-lg font-semibold text-zinc-900">
          Customer &amp; asset insights
        </h2>
        <p className="text-xs text-zinc-500">Which assets customers use, who they are, and how well checkout converts.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2" aria-busy="true" aria-label="Loading insights">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
          ))}
        </div>
      ) : isError || !data ? (
        <div role="alert" className="flex flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-6 py-10 text-center">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <p className="text-sm font-medium text-zinc-900">Couldn&apos;t load insights</p>
          {error && <p className="text-xs text-zinc-500">{error.message}</p>}
          <button
            type="button"
            onClick={() => void refetch()}
            className="mt-1 rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50"
          >
            Try again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <AssetBreakdown assets={data.assets} />
          <ConversionFunnel steps={data.funnel} />
          <PaymentMethodSplit methods={data.paymentMethods} />
          <TopCustomers customers={data.topCustomers} />
          {data.geography && data.geography.length > 0 && <GeographyBreakdown countries={data.geography} />}
        </div>
      )}
    </section>
  );
}
