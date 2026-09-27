/**
 * lib/stellar/index.ts
 *
 * Stellar network clients and Soroban contract helpers.
 *
 * Uses @stellar/stellar-sdk v13 export shape:
 *   - Horizon.Server  — REST API for accounts, transactions, payments
 *   - rpc.Server      — Soroban JSON-RPC for contract simulation / invocation
 *   - contract.*      — Soroban contract client utilities
 *   - Networks        — network passphrases
 *   - Contract        — Soroban contract address wrapper
 *   - TransactionBuilder, BASE_FEE, xdr — transaction construction
 *
 * Usage:
 *   import { horizonServer, sorobanRpc, contracts } from "@/lib/stellar";
 *
 *   const account = await horizonServer.loadAccount(publicKey);
 *   const ledger  = await sorobanRpc.getLatestLedger();
 *   if (contracts.payment.isConfigured) {
 *     await contracts.payment.simulate("pay", args, signer);
 *   }
 */

import {
  Horizon,
  rpc,
  Networks,
  Contract,
  TransactionBuilder,
  BASE_FEE,
  xdr,
  type Keypair,
} from "@stellar/stellar-sdk";

import { env } from "@/lib/env";

// ─── Network passphrase ───────────────────────────────────────────────────────

const NETWORK_PASSPHRASE_MAP: Record<
  typeof env.NEXT_PUBLIC_STELLAR_NETWORK,
  string
> = {
  mainnet:   Networks.PUBLIC,
  testnet:   Networks.TESTNET,
  futurenet: Networks.FUTURENET,
};

/** The Stellar network passphrase for the configured environment. */
export const stellarNetwork: string =
  NETWORK_PASSPHRASE_MAP[env.NEXT_PUBLIC_STELLAR_NETWORK];

// ─── Horizon server ───────────────────────────────────────────────────────────

/**
 * Horizon REST API instance.
 * Use for account lookups, payment history, transaction submission.
 *
 * @example
 *   const account  = await horizonServer.loadAccount("G…");
 *   const payments = await horizonServer.payments().forAccount("G…").call();
 */
export const horizonServer = new Horizon.Server(
  env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
  { allowHttp: env.NEXT_PUBLIC_STELLAR_NETWORK !== "mainnet" }
);

// ─── Soroban RPC server ───────────────────────────────────────────────────────

/**
 * Soroban RPC server instance (rpc.Server in SDK v13).
 * Use for smart-contract simulation, invocation, event streaming.
 *
 * @example
 *   const ledger = await sorobanRpc.getLatestLedger();
 *   const sim    = await sorobanRpc.simulateTransaction(tx);
 */
export const sorobanRpc = new rpc.Server(
  env.NEXT_PUBLIC_SOROBAN_RPC_URL,
  { allowHttp: env.NEXT_PUBLIC_STELLAR_NETWORK !== "mainnet" }
);

// ─── Contract helper factory ──────────────────────────────────────────────────

export interface ContractHelper {
  /** Raw SDK Contract instance, or null when not configured */
  contract: Contract | null;
  /** Whether a non-empty contract ID has been provided */
  isConfigured: boolean;
  /** The Soroban contract address (C…) */
  contractId: string;

  /**
   * Build and simulate a contract method call against Soroban RPC.
   * Returns null (with a console warning) when the contract is not configured.
   *
   * @param method  Soroban function name to call
   * @param args    Array of XDR ScVal arguments
   * @param signer  Keypair whose public key is used as the source account
   */
  simulate(
    method: string,
    args: xdr.ScVal[],
    signer: Keypair
  ): Promise<rpc.Api.SimulateTransactionResponse | null>;
}

function createContractHelper(contractId: string): ContractHelper {
  const isConfigured = contractId.length > 0;
  const contract     = isConfigured ? new Contract(contractId) : null;

  async function simulate(
    method: string,
    args: xdr.ScVal[],
    signer: Keypair
  ): Promise<rpc.Api.SimulateTransactionResponse | null> {
    if (!contract) {
      console.warn(
        `[FacilPay Stellar] Contract "${contractId || "(unset)"}" is not configured. ` +
          `Set the corresponding NEXT_PUBLIC_*_CONTRACT_ID env variable.`
      );
      return null;
    }

    const account = await horizonServer.loadAccount(signer.publicKey());

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: stellarNetwork,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    return sorobanRpc.simulateTransaction(tx);
  }

  return { contract, isConfigured, contractId, simulate };
}

// ─── Pre-built contract helpers ───────────────────────────────────────────────

/**
 * Contract helpers for the three core FacilPay Soroban contracts.
 * Each helper is usable whether or not its contract ID is set —
 * `isConfigured` tells you if it's ready.
 */
export const contracts = {
  payment: createContractHelper(env.NEXT_PUBLIC_PAYMENT_CONTRACT_ID),
  escrow:  createContractHelper(env.NEXT_PUBLIC_ESCROW_CONTRACT_ID),
  refund:  createContractHelper(env.NEXT_PUBLIC_REFUND_CONTRACT_ID),
} as const;

// ─── Utility re-exports ───────────────────────────────────────────────────────

export { xdr, TransactionBuilder, BASE_FEE, Networks, Contract } from "@stellar/stellar-sdk";
export type { rpc };
