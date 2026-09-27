/**
 * lib/env.ts
 *
 * Validates all NEXT_PUBLIC_* environment variables with Zod at module load
 * time.  Import `env` anywhere in the app to get a fully-typed, guaranteed-
 * present object.  Missing or malformed variables throw immediately with a
 * clear message so misconfiguration is caught before any network call fires.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const base = env.NEXT_PUBLIC_API_BASE_URL;
 */

import { z } from "zod";

// ─── Schema ───────────────────────────────────────────────────────────────────

const envSchema = z.object({
  // ── API ──────────────────────────────────────────────────────────────────
  /** FacilPay backend REST API base URL — no trailing slash */
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .url("NEXT_PUBLIC_API_BASE_URL must be a valid URL (e.g. http://localhost:4000/api/v1)"),

  // ── Auth ─────────────────────────────────────────────────────────────────
  /** Where to redirect after logout or on a 401 response */
  NEXT_PUBLIC_AUTH_LOGOUT_URL: z
    .string()
    .url("NEXT_PUBLIC_AUTH_LOGOUT_URL must be a valid URL (e.g. http://localhost:3000/login)"),

  // ── Stellar network ───────────────────────────────────────────────────────
  NEXT_PUBLIC_STELLAR_NETWORK: z.enum(["mainnet", "testnet", "futurenet"], {
    errorMap: () => ({
      message:
        'NEXT_PUBLIC_STELLAR_NETWORK must be "mainnet", "testnet", or "futurenet"',
    }),
  }),

  NEXT_PUBLIC_STELLAR_HORIZON_URL: z
    .string()
    .url("NEXT_PUBLIC_STELLAR_HORIZON_URL must be a valid URL"),

  NEXT_PUBLIC_SOROBAN_RPC_URL: z
    .string()
    .url("NEXT_PUBLIC_SOROBAN_RPC_URL must be a valid URL"),

  // ── Soroban contract IDs (optional — empty string allowed) ───────────────
  NEXT_PUBLIC_PAYMENT_CONTRACT_ID: z.string().default(""),
  NEXT_PUBLIC_ESCROW_CONTRACT_ID: z.string().default(""),
  NEXT_PUBLIC_REFUND_CONTRACT_ID: z.string().default(""),

  // ── App ───────────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url("NEXT_PUBLIC_APP_URL must be a valid URL (e.g. http://localhost:3000)"),

  // ── Mock mode ─────────────────────────────────────────────────────────────
  /** Set to "true" to activate MSW mock handlers instead of hitting the API */
  NEXT_PUBLIC_USE_MOCKS: z
    .enum(["true", "false"])
    .default("false")
    .transform((v) => v === "true"),
});

// ─── Exported type ────────────────────────────────────────────────────────────

export type Env = z.infer<typeof envSchema>;

// ─── Validation ───────────────────────────────────────────────────────────────

function validateEnv(): Env {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_API_BASE_URL:       process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_AUTH_LOGOUT_URL:    process.env.NEXT_PUBLIC_AUTH_LOGOUT_URL,
    NEXT_PUBLIC_STELLAR_NETWORK:    process.env.NEXT_PUBLIC_STELLAR_NETWORK,
    NEXT_PUBLIC_STELLAR_HORIZON_URL:process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
    NEXT_PUBLIC_SOROBAN_RPC_URL:    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
    NEXT_PUBLIC_PAYMENT_CONTRACT_ID:process.env.NEXT_PUBLIC_PAYMENT_CONTRACT_ID,
    NEXT_PUBLIC_ESCROW_CONTRACT_ID: process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ID,
    NEXT_PUBLIC_REFUND_CONTRACT_ID: process.env.NEXT_PUBLIC_REFUND_CONTRACT_ID,
    NEXT_PUBLIC_APP_URL:            process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_USE_MOCKS:          process.env.NEXT_PUBLIC_USE_MOCKS,
  });

  if (!result.success) {
    const lines = result.error.issues.map(
      (issue) => `  • ${issue.path.join(".")}: ${issue.message}`
    );
    throw new Error(
      `\n❌  FacilPay — invalid environment configuration:\n\n${lines.join("\n")}\n\n` +
        `  Copy .env.example to .env.local and fill in the missing values.\n`
    );
  }

  return result.data;
}

/**
 * Validated, typed environment variables.
 * Throws at import time if any required variable is missing or malformed.
 */
export const env: Env = validateEnv();
