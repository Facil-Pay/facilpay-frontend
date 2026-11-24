import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    // Use jsdom for component tests; pure-logic tests still run fine here
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    globals: true,
    // Exclude Playwright E2E specs — those run via `npm run test:e2e`
    exclude: ["e2e/**", "node_modules/**"],
    // Provide the env vars that lib/env.ts validates at import time so
    // any test that transitively imports the API client does not throw.
    env: {
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000/api/v1",
      NEXT_PUBLIC_AUTH_LOGOUT_URL: "http://localhost:3000/login",
      NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
      NEXT_PUBLIC_STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
      NEXT_PUBLIC_SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXT_PUBLIC_USE_MOCKS: "true",
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "."),
    },
  },
});
