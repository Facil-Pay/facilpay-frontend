import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Bundle analyzer configuration (Issue #82)
let withBundleAnalyzer = (config: NextConfig) => config;
if (process.env.ANALYZE === "true") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const bundleAnalyzer = require("@next/bundle-analyzer");
    withBundleAnalyzer = bundleAnalyzer({ enabled: true });
  } catch {
    // Graceful fallback if dependency is unavailable
  }
}

// Strict security headers for the dashboard (Issue #83)
const dashboardSecurityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://horizon.stellar.org https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org https://rpc.stellar.org https://friendbot.stellar.org https://*.stellar.org wss://*.stellar.org https://api.stellar.expert https://api.dicebear.com https://*.albedo.link https://*.xbull.app",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

// Embeddable checkout policy allowing iframe embedding by merchants
const checkoutSecurityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://horizon.stellar.org https://horizon-testnet.stellar.org https://soroban-testnet.stellar.org https://rpc.stellar.org https://friendbot.stellar.org https://*.stellar.org wss://*.stellar.org https://api.stellar.expert https://api.dicebear.com https://*.albedo.link https://*.xbull.app",
      "frame-ancestors *",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Prevent Next.js / Turbopack from trying to bundle MSW on the server.
  serverExternalPackages: ["msw", "msw/node"],

  async headers() {
    return [
      {
        source: "/checkout/:path*",
        headers: checkoutSecurityHeaders,
      },
      {
        source: "/pay/:path*",
        headers: checkoutSecurityHeaders,
      },
      {
        source: "/:path*",
        headers: dashboardSecurityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withBundleAnalyzer(withNextIntl(nextConfig));
