import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Prevent Next.js / Turbopack from trying to bundle MSW on the server.
  serverExternalPackages: ["msw", "msw/node"],
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
