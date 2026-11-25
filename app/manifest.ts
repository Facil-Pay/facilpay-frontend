import type { MetadataRoute } from "next";

/**
 * Web app manifest (Issue #136). Next.js serves this at /manifest.webmanifest
 * and links it from <head> automatically — no change to layout.tsx needed
 * for the link tag itself.
 *
 * Only a 192x192 icon exists in this repo (app/icon.png); there is no
 * 512x512 asset to reference, so installability on platforms that require
 * one may be degraded until a real brand icon at that size is added.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "FacilPay Merchant Dashboard",
    short_name: "FacilPay",
    description: "Manage payments and issue refunds with FacilPay.",
    start_url: "/overview",
    display: "standalone",
    background_color: "#000F24",
    theme_color: "#20A7EE",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
    ],
  };
}
