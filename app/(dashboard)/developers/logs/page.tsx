import type { Metadata } from "next";
import ApiRequestLogsView from "@/components/developers/ApiRequestLogsView";

export const metadata: Metadata = {
  title: "API Request Logs | FacilPay Dashboard",
  description:
    "Inspect recent API requests made with your merchant keys, filter by status class, key and path, and debug integrations with redacted request/response bodies.",
};

export default function DeveloperLogsPage() {
  return <ApiRequestLogsView />;
}
