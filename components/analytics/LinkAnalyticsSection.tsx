"use client";

import dynamic from "next/dynamic";
import { useLinkAnalytics } from "@/lib/api/hooks/useAnalytics";
import { ConversionFunnel } from "@/components/analytics/ConversionFunnel";

// Lazy-loaded to keep recharts out of the initial bundle for this page,
// matching the convention used on the main analytics dashboard.
const LinkViewsChart = dynamic(() => import("./LinkViewsChart"), {
  ssr: false,
  loading: () => <div className="h-[220px] animate-pulse rounded-lg bg-zinc-100" />,
});

/** Per-link analytics section for a payment link's detail page (Issue #134). */
export function LinkAnalyticsSection({ linkId }: { linkId: string }) {
  const { data, isLoading, isError } = useLinkAnalytics(linkId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />;
  }

  if (isError || !data) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-zinc-900">Link analytics</h2>
        <p className="mt-0.5 text-sm text-zinc-500">
          {data.totalViews} views &middot; {data.totalCompletedPayments} completed payments &middot;{" "}
          {data.conversionRate}% conversion
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <LinkViewsChart data={data.series} />
        <ConversionFunnel steps={data.funnel} />
      </div>
    </section>
  );
}
