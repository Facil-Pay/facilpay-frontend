/**
 * tests/setup.ts
 *
 * Global test setup for React Testing Library.
 * Imported by vitest.config.ts via `setupFiles`.
 */

import "@testing-library/jest-dom";

/**
 * lib/env.ts validates NEXT_PUBLIC_* variables at import time, and most
 * modules under test import it. CI does not export these values, so supply
 * the .env.example defaults when they are absent. Tests that need to check
 * validation behaviour overwrite or delete these keys themselves.
 */
const TEST_ENV_DEFAULTS: Record<string, string> = {
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000/api/v1",
  NEXT_PUBLIC_AUTH_LOGOUT_URL: "http://localhost:3000/login",
  NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
  NEXT_PUBLIC_STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
  NEXT_PUBLIC_SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_USE_MOCKS: "true",
};

for (const [key, value] of Object.entries(TEST_ENV_DEFAULTS)) {
  process.env[key] ??= value;
}
