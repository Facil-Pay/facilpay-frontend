import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Content Security Policy Directives
// Defines strict sources allowing Horizon, Soroban RPC, Stellar testnet/mainnet, and wallet origins
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js hydration & Freighter wallet injection support
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://horizon-testnet.stellar.org https://horizon.stellar.org https://soroban-testnet.stellar.org https://soroban.stellar.org https://*.stellar.org wss://*.stellar.org",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
];

const dashboardCsp = [...cspDirectives, "frame-ancestors 'none'"].join("; ");
const checkoutCsp = [...cspDirectives, "frame-ancestors *"].join("; ");

const nextConfig: NextConfig = {
  // Prevent Next.js / Turbopack from trying to bundle MSW on the server.
  serverExternalPackages: ["msw", "msw/node"],

  async headers() {
    return [
      // 1. Strict Security Headers for Embeddable Checkout (/checkout)
      {
        source: "/checkout/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: checkoutCsp,
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
        ],
      },
      // 2. Global Security Headers for Dashboard and Application Routes
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: dashboardCsp,
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
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
