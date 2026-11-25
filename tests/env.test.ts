/**
 * tests/env.test.ts
 *
 * Tests for the Zod environment schema in lib/env.ts (issue #140).
 * lib/env.ts validates at import time, so every case resets the module
 * registry and re-imports it after setting process.env.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

// Vitest runs from the repository root, where .env.example lives.
const EXAMPLE_PATH = resolve(process.cwd(), ".env.example");

const VALID_ENV: Record<string, string> = {
  NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000/api/v1",
  NEXT_PUBLIC_AUTH_LOGOUT_URL: "http://localhost:3000/login",
  NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
  NEXT_PUBLIC_STELLAR_HORIZON_URL: "https://horizon-testnet.stellar.org",
  NEXT_PUBLIC_SOROBAN_RPC_URL: "https://soroban-testnet.stellar.org",
  NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  NEXT_PUBLIC_USE_MOCKS: "true",
};

const OPTIONAL_KEYS = [
  "NEXT_PUBLIC_PAYMENT_CONTRACT_ID",
  "NEXT_PUBLIC_ESCROW_CONTRACT_ID",
  "NEXT_PUBLIC_REFUND_CONTRACT_ID",
] as const;

/** Keys the schema marks as required (no default, no optional wrapper). */
const REQUIRED_KEYS = Object.keys(VALID_ENV).filter((key) => key !== "NEXT_PUBLIC_USE_MOCKS");

let snapshot: NodeJS.ProcessEnv;

/** Replace process.env with exactly the given values, then import a fresh env module. */
async function loadEnv(overrides: Record<string, string | undefined> = {}) {
  const next: Record<string, string> = { ...VALID_ENV };
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete next[key];
    else next[key] = value;
  }
  for (const key of Object.keys(process.env)) {
    if (key.startsWith("NEXT_PUBLIC_")) delete process.env[key];
  }
  Object.assign(process.env, next);

  vi.resetModules();
  return (await import("@/lib/env")).env;
}

/** Resolves with the validation error thrown while importing lib/env. */
async function loadEnvError(overrides: Record<string, string | undefined> = {}): Promise<Error> {
  try {
    await loadEnv(overrides);
  } catch (err) {
    return err as Error;
  }
  throw new Error("Expected lib/env to reject");
}

/** Schema keys that do not appear as `KEY=` in .env.example. */
function missingExampleKeys(schemaKeys: string[]): string[] {
  const example = readFileSync(EXAMPLE_PATH, "utf8");
  const documented = new Set(
    example
      .split("\n")
      .map((line) => line.match(/^([A-Z][A-Z0-9_]*)=/)?.[1])
      .filter((key): key is string => Boolean(key)),
  );
  return schemaKeys.filter((key) => !documented.has(key));
}

beforeEach(() => {
  snapshot = { ...process.env };
});

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in snapshot)) delete process.env[key];
  }
  Object.assign(process.env, snapshot);
  vi.resetModules();
});

describe("env validation: valid configuration", () => {
  it("parses a complete configuration", async () => {
    const env = await loadEnv({
      NEXT_PUBLIC_PAYMENT_CONTRACT_ID: "CPAY123",
      NEXT_PUBLIC_ESCROW_CONTRACT_ID: "CESC456",
      NEXT_PUBLIC_REFUND_CONTRACT_ID: "CREF789",
    });

    expect(env).toMatchObject({
      NEXT_PUBLIC_API_BASE_URL: "http://localhost:4000/api/v1",
      NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
      NEXT_PUBLIC_PAYMENT_CONTRACT_ID: "CPAY123",
      NEXT_PUBLIC_ESCROW_CONTRACT_ID: "CESC456",
      NEXT_PUBLIC_REFUND_CONTRACT_ID: "CREF789",
      NEXT_PUBLIC_USE_MOCKS: true,
    });
  });

  it("applies defaults for optional contract IDs and mock mode", async () => {
    const env = await loadEnv({
      NEXT_PUBLIC_USE_MOCKS: undefined,
      ...Object.fromEntries(OPTIONAL_KEYS.map((key) => [key, undefined])),
    });

    expect(env.NEXT_PUBLIC_PAYMENT_CONTRACT_ID).toBe("");
    expect(env.NEXT_PUBLIC_ESCROW_CONTRACT_ID).toBe("");
    expect(env.NEXT_PUBLIC_REFUND_CONTRACT_ID).toBe("");
    expect(env.NEXT_PUBLIC_USE_MOCKS).toBe(false);
  });

  it("treats NEXT_PUBLIC_USE_MOCKS=false as disabled", async () => {
    const env = await loadEnv({ NEXT_PUBLIC_USE_MOCKS: "false" });
    expect(env.NEXT_PUBLIC_USE_MOCKS).toBe(false);
  });

  it.each(["mainnet", "testnet", "futurenet"])("accepts %s as the Stellar network", async (network) => {
    const env = await loadEnv({ NEXT_PUBLIC_STELLAR_NETWORK: network });
    expect(env.NEXT_PUBLIC_STELLAR_NETWORK).toBe(network);
  });
});

describe("env validation: missing variables", () => {
  it.each(REQUIRED_KEYS)("throws a readable error when %s is missing", async (key) => {
    await expect(loadEnv({ [key]: undefined })).rejects.toThrow(
      new RegExp(`invalid environment configuration[\\s\\S]*${key}:`),
    );
  });

  it("names every missing variable in one error", async () => {
    const error = await loadEnvError({
      NEXT_PUBLIC_API_BASE_URL: undefined,
      NEXT_PUBLIC_APP_URL: undefined,
    });

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toContain("NEXT_PUBLIC_API_BASE_URL:");
    expect(error.message).toContain("NEXT_PUBLIC_APP_URL:");
  });

  it("tells the developer how to fix the configuration", async () => {
    const error = await loadEnvError({ NEXT_PUBLIC_SOROBAN_RPC_URL: undefined });

    expect(error.message).toContain("Copy .env.example to .env.local");
  });
});

describe("env validation: malformed values", () => {
  it.each([
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_AUTH_LOGOUT_URL",
    "NEXT_PUBLIC_STELLAR_HORIZON_URL",
    "NEXT_PUBLIC_SOROBAN_RPC_URL",
    "NEXT_PUBLIC_APP_URL",
  ])("rejects a non-URL value for %s", async (key) => {
    await expect(loadEnv({ [key]: "not a url" })).rejects.toThrow(`${key}`);
  });

  it("rejects an empty string for a required URL", async () => {
    await expect(loadEnv({ NEXT_PUBLIC_APP_URL: "" })).rejects.toThrow("NEXT_PUBLIC_APP_URL must be a valid URL");
  });

  it("uses the custom message for an invalid API base URL", async () => {
    await expect(loadEnv({ NEXT_PUBLIC_API_BASE_URL: "api.facilpay.test" })).rejects.toThrow(
      "NEXT_PUBLIC_API_BASE_URL must be a valid URL (e.g. http://localhost:4000/api/v1)",
    );
  });

  it.each(["devnet", "Testnet", ""])("rejects %j as a Stellar network", async (network) => {
    await expect(loadEnv({ NEXT_PUBLIC_STELLAR_NETWORK: network })).rejects.toThrow(
      'NEXT_PUBLIC_STELLAR_NETWORK must be "mainnet", "testnet", or "futurenet"',
    );
  });

  it.each(["yes", "1", "TRUE"])("rejects %j for NEXT_PUBLIC_USE_MOCKS", async (value) => {
    await expect(loadEnv({ NEXT_PUBLIC_USE_MOCKS: value })).rejects.toThrow("NEXT_PUBLIC_USE_MOCKS");
  });

  it("reports every invalid value rather than stopping at the first", async () => {
    const error = await loadEnvError({
      NEXT_PUBLIC_STELLAR_NETWORK: "devnet",
      NEXT_PUBLIC_USE_MOCKS: "maybe",
    });

    expect(error.message).toContain("NEXT_PUBLIC_STELLAR_NETWORK");
    expect(error.message).toContain("NEXT_PUBLIC_USE_MOCKS");
  });
});

describe(".env.example stays in sync with the schema", () => {
  it("documents every key in the schema", async () => {
    const { envSchema } = await import("@/lib/env");
    expect(missingExampleKeys(Object.keys(envSchema.shape))).toEqual([]);
  });

  it("documents no key that the schema does not define", async () => {
    const { envSchema } = await import("@/lib/env");
    const example = readFileSync(EXAMPLE_PATH, "utf8");
    const exampleKeys = example
      .split("\n")
      .map((line) => line.match(/^(NEXT_PUBLIC_[A-Z0-9_]+)=/)?.[1])
      .filter((key): key is string => Boolean(key));

    expect(exampleKeys.filter((key) => !(key in envSchema.shape))).toEqual([]);
  });

  it("flags a new schema key that is missing from .env.example", async () => {
    const { envSchema } = await import("@/lib/env");
    const extended = envSchema.extend({ NEXT_PUBLIC_NEW_FEATURE_FLAG: z.string().default("") });

    expect(missingExampleKeys(Object.keys(extended.shape))).toEqual(["NEXT_PUBLIC_NEW_FEATURE_FLAG"]);
  });
});
