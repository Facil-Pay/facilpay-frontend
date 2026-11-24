/**
 * tests/setup.ts
 *
 * Global test setup for React Testing Library.
 * Imported by vitest.config.ts via `setupFiles`.
 */

import "@testing-library/jest-dom";

// ── Env stubs ────────────────────────────────────────────────────────────────
// lib/env.ts runs at module load time and throws if any required NEXT_PUBLIC_*
// variable is missing.  Set minimal valid values here so every test file can
// import app modules without a real .env.local present.
process.env.NEXT_PUBLIC_API_BASE_URL          = "http://localhost:4000/api/v1";
process.env.NEXT_PUBLIC_AUTH_LOGOUT_URL       = "http://localhost:3000/login";
process.env.NEXT_PUBLIC_STELLAR_NETWORK       = "testnet";
process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL   = "https://horizon-testnet.stellar.org";
process.env.NEXT_PUBLIC_SOROBAN_RPC_URL       = "https://soroban-testnet.stellar.org";
process.env.NEXT_PUBLIC_APP_URL               = "http://localhost:3000";
process.env.NEXT_PUBLIC_USE_MOCKS             = "false";
