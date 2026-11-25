/**
 * Memo types allowed by the SEP-7 `web+stellar:pay` URI scheme.
 * Mapped to the `memo_type` query value (`MEMO_TEXT`, `MEMO_ID`, `MEMO_HASH`).
 */
export type Sep7MemoType = "text" | "id" | "hash";

/**
 * Asset to request in a payment URI: `"native"` for XLM, or an issued asset with its code and issuer account.
 */
export type Sep7Asset = "native" | {
  code: string;
  issuer: string;
};

/**
 * Inputs for {@link buildSep7PayUri}.
 *
 * @property destination - Stellar account (G...) or federation address to pay.
 * @property amount - Positive decimal amount. Numbers in exponent notation are expanded.
 * @property asset - Asset to request. Defaults to `"native"`.
 * @property memo - Optional memo text, ID or hash. Must not be empty when provided.
 * @property memoType - Memo type for `memo`. Defaults to `"text"`.
 * @property message - Optional human-readable message shown by the wallet.
 */
export type BuildSep7PayUriOptions = {
  destination: string;
  amount: string | number;
  asset?: Sep7Asset;
  memo?: string;
  memoType?: Sep7MemoType;
  message?: string;
};

function encodeParameter(value: string) {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

function decimalAmount(amount: string | number) {
  if (typeof amount === "string") return amount.trim();
  if (!Number.isFinite(amount)) return String(amount);

  const value = String(amount);
  const exponentMatch = /^(\d+)(?:\.(\d+))?e([+-]?\d+)$/i.exec(value);
  if (!exponentMatch) return value;

  const [, integer, fraction = "", exponentText] = exponentMatch;
  const digits = integer + fraction;
  const decimalIndex = integer.length + Number(exponentText);
  if (decimalIndex <= 0) return `0.${"0".repeat(-decimalIndex)}${digits}`;
  if (decimalIndex >= digits.length) return `${digits}${"0".repeat(decimalIndex - digits.length)}`;
  return `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
}

/**
 * Builds a SEP-7 `web+stellar:pay` URI that wallets can open to send a payment.
 *
 * Parameters are percent-encoded per RFC 3986, so memos and messages containing
 * spaces, `&` or `=` survive the round trip.
 *
 * @throws {Error} When the destination is blank, the amount is not a positive
 *   decimal, an issued asset lacks a code or issuer, or the memo is empty or
 *   missing while a non-text memo type is requested.
 *
 * @example
 * ```ts
 * buildSep7PayUri({
 *   destination: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
 *   amount: "12.50",
 *   asset: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
 *   memo: "INV-42",
 * });
 * // web+stellar:pay?destination=G...&amount=12.50&asset_code=USDC&...
 * ```
 */
export function buildSep7PayUri({
  destination,
  amount,
  asset = "native",
  memo,
  memoType = "text",
  message,
}: BuildSep7PayUriOptions) {
  if (!destination.trim()) throw new Error("A destination is required.");

  const amountValue = decimalAmount(amount);
  if (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(amountValue) || !Number.isFinite(Number(amountValue)) || Number(amountValue) <= 0) {
    throw new Error("Amount must be a positive decimal value.");
  }

  const parameters: [string, string][] = [
    ["destination", destination],
    ["amount", amountValue],
  ];

  if (asset !== "native") {
    if (!asset.code.trim() || !asset.issuer.trim()) {
      throw new Error("Issued assets require both an asset code and issuer.");
    }
    parameters.push(["asset_code", asset.code], ["asset_issuer", asset.issuer]);
  }

  if (memo !== undefined) {
    if (memo.length === 0) throw new Error("Memo cannot be empty when a memo type is provided.");
    const memoTypes: Record<Sep7MemoType, string> = {
      text: "MEMO_TEXT",
      id: "MEMO_ID",
      hash: "MEMO_HASH",
    };
    parameters.push(["memo", memo], ["memo_type", memoTypes[memoType]]);
  } else if (memoType !== "text") {
    throw new Error("A memo is required when a memo type is provided.");
  }

  if (message !== undefined) parameters.push(["msg", message]);

  const query = parameters
    .map(([key, value]) => `${encodeParameter(key)}=${encodeParameter(value)}`)
    .join("&");
  return `web+stellar:pay?${query}`;
}