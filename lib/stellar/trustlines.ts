/**
 * lib/stellar/trustlines.ts
 *
 * Trustline (changeTrust) helpers for the merchant's receiving account.
 *
 *  • Read side  — `parseTrustlines` narrows the balances returned by
 *    lib/stellar/horizon.ts down to the non-native credit assets an account
 *    holds an explicit trustline for.
 *  • Write side — `buildChangeTrustXdr` / `submitSignedChangeTrust` build and
 *    submit a `changeTrust` operation for the connected wallet to sign.
 *    A limit of "0" removes an existing trustline.
 */

import { Asset, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { BASE_FEE, horizonServer, stellarNetwork } from "@/lib/stellar";
import {
  parseHorizonBalances,
  SUPPORTED_TRUSTLINE_ASSETS,
  type FormattedBalance,
  type HorizonAccountResponse,
} from "@/lib/stellar/horizon";
import { TESTNET_ASSETS } from "@/lib/stellar/assets";
import { StrKey } from "@/lib/stellar/strkey";

/** Stellar's maximum trust limit (2^63 − 1 stroops). */
export const MAX_TRUST_LIMIT = "922337203685.4775807";

/** The limit sent when removing a trustline. */
export const REMOVE_TRUST_LIMIT = "0";

/** A credit asset identified by its code and issuing account. */
export interface TrustlineAsset {
  code: string;
  issuer: string;
}

/** A curated asset a merchant can add in a single step. */
export interface CuratedTrustlineAsset extends TrustlineAsset {
  name: string;
  domain: string;
  icon: string;
}

// ─── Display helpers ──────────────────────────────────────────────────────────

const ASSET_ICONS: Record<string, string> = {
  USDC: TESTNET_ASSETS.USDC.icon,
  EURC: TESTNET_ASSETS.EURC.icon,
  XLM: TESTNET_ASSETS.XLM.icon,
};

/** Emoji used to render an asset, falling back to a generic token. */
export function assetIcon(code: string): string {
  return ASSET_ICONS[code.toUpperCase()] ?? "🪙";
}

// ─── Configured network ───────────────────────────────────────────────────────

/** Stellar network the app is configured against (from the public env). */
export const configuredNetwork: "mainnet" | "testnet" =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK === "mainnet" ? "mainnet" : "testnet";

export const isMainnet = configuredNetwork === "mainnet";

/** Stellar Expert only indexes the two public networks. */
export function stellarExplorerBase(): string {
  return isMainnet
    ? "https://stellar.expert/explorer/public"
    : "https://stellar.expert/explorer/testnet";
}

export function stellarExplorerTxUrl(transactionHash: string): string {
  return `${stellarExplorerBase()}/tx/${transactionHash}`;
}

export function stellarExplorerAssetUrl(balance: FormattedBalance): string {
  const issuer = balance.assetIssuer ?? "";
  return `${stellarExplorerBase()}/asset/${balance.assetCode}-${issuer}`;
}

// ─── Curated asset list ───────────────────────────────────────────────────────

/**
 * The curated assets offered in the "add trustline" flow, built from the
 * registries in lib/stellar/horizon.ts and lib/stellar/assets.ts.
 *
 * Only issuers that pass StrKey validation are offered: an unverifiable issuer
 * would make the Stellar SDK throw while building the transaction, so those
 * entries (and XLM, which has no issuer) are dropped and remain available
 * through the custom "code + issuer" path.
 */
function toCuratedAsset(
  code: string,
  issuer: string,
  name: string,
  domain: string,
): CuratedTrustlineAsset | null {
  if (issuer === "native") return null;
  if (!StrKey.isValidEd25519PublicKey(issuer)) return null;
  return { code, issuer, name, domain, icon: assetIcon(code) };
}

function buildCuratedAssets(): CuratedTrustlineAsset[] {
  const candidates: (CuratedTrustlineAsset | null)[] = [
    ...SUPPORTED_TRUSTLINE_ASSETS.map((asset) =>
      toCuratedAsset(asset.code, asset.issuer, asset.name, asset.domain),
    ),
    toCuratedAsset(
      TESTNET_ASSETS.USDC.code,
      TESTNET_ASSETS.USDC.issuer,
      TESTNET_ASSETS.USDC.name,
      "circle.com",
    ),
    toCuratedAsset(
      TESTNET_ASSETS.EURC.code,
      TESTNET_ASSETS.EURC.issuer,
      TESTNET_ASSETS.EURC.name,
      "circle.com",
    ),
  ];

  const seen = new Set<string>();
  const curated: CuratedTrustlineAsset[] = [];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const key = `${candidate.code.toUpperCase()}-${candidate.issuer}`;
    if (seen.has(key)) continue;
    seen.add(key);
    curated.push(candidate);
  }
  return curated;
}

export const CURATED_TRUSTLINE_ASSETS: CuratedTrustlineAsset[] = buildCuratedAssets();

// ─── Read helpers ─────────────────────────────────────────────────────────────

/** Trustlines are the non-native balances Horizon reports for the account. */
export function parseTrustlines(account: HorizonAccountResponse): FormattedBalance[] {
  return parseHorizonBalances(account).filter((balance) => !balance.isNative);
}

/** A trustline can only be removed once it holds no funds. */
export function isTrustlineRemovable(balance: FormattedBalance): boolean {
  return balance.totalBalance === 0;
}

/** True when the account already trusts the exact same asset. */
export function hasTrustline(existing: FormattedBalance[], asset: TrustlineAsset): boolean {
  const code = asset.code.trim().toUpperCase();
  const issuer = asset.issuer.trim();
  return existing.some(
    (balance) =>
      balance.assetCode.toUpperCase() === code &&
      (balance.assetIssuer ?? "") === issuer,
  );
}

/** True when `asset` matches a curated entry. */
export function findCuratedAsset(asset: TrustlineAsset): CuratedTrustlineAsset | undefined {
  const code = asset.code.trim().toUpperCase();
  const issuer = asset.issuer.trim();
  return CURATED_TRUSTLINE_ASSETS.find(
    (entry) => entry.code.toUpperCase() === code && entry.issuer === issuer,
  );
}

// ─── Write helpers ────────────────────────────────────────────────────────────

/**
 * Builds an unsigned `changeTrust` transaction for `accountId`.
 *
 * @param limit  Trust limit; defaults to the maximum. Pass "0" to remove the
 *               trustline (which is only valid when the balance is zero).
 */
export async function buildChangeTrustXdr({
  accountId,
  asset,
  limit = MAX_TRUST_LIMIT,
}: {
  accountId: string;
  asset: TrustlineAsset;
  limit?: string;
}): Promise<string> {
  const code = asset.code.trim().toUpperCase();
  const issuer = asset.issuer.trim();

  if (!issuer || !StrKey.isValidEd25519PublicKey(issuer)) {
    throw new Error(
      `${code} has an issuer that is not a valid Stellar account, so a trustline cannot be created for it.`,
    );
  }

  const account = await horizonServer.loadAccount(accountId);

  return new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: stellarNetwork,
  })
    .addOperation(Operation.changeTrust({ asset: new Asset(code, issuer), limit }))
    .setTimeout(180)
    .build()
    .toXDR();
}

/** Submits a wallet-signed change-trust transaction and returns its hash. */
export async function submitSignedChangeTrust(signedXdr: string): Promise<string> {
  const transaction = TransactionBuilder.fromXDR(signedXdr, stellarNetwork);
  const response = await horizonServer.submitTransaction(transaction);
  return response.hash;
}

/** Turns a raw Horizon / wallet error into a message a merchant can act on. */
export function describeChangeTrustError(error: unknown, action: "add" | "remove"): string {
  const raw =
    error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const lower = raw.toLowerCase();

  if (lower.includes("cancel") || lower.includes("reject") || lower.includes("declin")) {
    return "The signature request was cancelled, so nothing was submitted.";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return "This receiving account is not funded on the network yet. Fund it with XLM before changing trustlines.";
  }
  if (
    lower.includes("insufficient") ||
    lower.includes("underfunded") ||
    lower.includes("balance") ||
    lower.includes("reserve")
  ) {
    return "The account needs more XLM to cover the network fee and the 0.5 XLM trustline reserve.";
  }
  if (lower.includes("op_") || lower.includes("change_trust") || lower.includes("resultcode")) {
    return action === "remove"
      ? "Stellar rejected the change-trust operation. A trustline can only be removed once its balance is zero."
      : "Stellar rejected the change-trust operation. Check the asset code and issuer, then try again.";
  }
  return raw || (action === "remove"
    ? "The trustline could not be removed. Please try again."
    : "The trustline could not be added. Please try again.");
}
