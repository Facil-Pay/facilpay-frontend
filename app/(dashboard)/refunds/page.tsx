import { Suspense } from "react";
import { RefundsView } from "@/components/refunds/RefundsView";

export default function RefundsPage() {
  // RefundsView reads filters from the URL, which requires a Suspense boundary
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-xl bg-zinc-100" aria-label="Loading refunds" />}>
      <RefundsView />
    </Suspense>
  );
}
