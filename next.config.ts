import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Bundle analysis: run `ANALYZE=true next build` to open a bundle report.
const withBundleAnalyzer =
  process.env.ANALYZE === "true"
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports
      require("@next/bundle-analyzer")({ enabled: true })
    : (cfg: NextConfig) => cfg;

// Allowed external origins for CSP (extend as needed).
const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL ?? "https://api.facilpay.io";
const HORIZON_ORIGIN = "https://horizon.stellar.org https://horizon-testnet.stellar.org";
const SOROBAN_RPC_ORIGIN =
  "https://soroban-testnet.stellar.org https://rpc-mainnet.stellar.org";
const WALLET_ORIGINS =
  "https://lobstr.co https://freighter.app https://wallet.stellar.org";

const securityHeaders = [
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
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    // Dashboard: no embedding allowed.
    // For embeddable checkout pages (/checkout/*), override this header in
    // a separate rule with frame-ancestors set to the merchant's domain.
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `connect-src 'self' ${API_ORIGIN} ${HORIZON_ORIGIN} ${SOROBAN_RPC_ORIGIN} ${WALLET_ORIGINS}`,
      // Scripts: nonce-based; Next.js injects `nonce` automatically when
      // the CSP header contains a `nonce-` source.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "frame-ancestors 'none'",
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
        // Apply security headers to all routes.
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withBundleAnalyzer(withNextIntl(nextConfig));
