import type { Metadata } from "next";
import TrustlinesManager from "@/components/trustlines/TrustlinesManager";

export const metadata: Metadata = {
  title: "Trustline Management | FacilPay Dashboard",
  description:
    "Review the Stellar trustlines on your merchant receiving account, add assets from a curated list or a custom code and issuer, and remove unused trustlines once their balance is zero.",
};

export default function TrustlinesPage() {
  return <TrustlinesManager />;
}
