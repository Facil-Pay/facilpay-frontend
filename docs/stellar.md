# Stellar integration

This document covers every Stellar-related module in `lib/stellar/` and `lib/sep24/`, explains testnet/mainnet switching, and shows you how to get a funded testnet account for local development.

---

## Table of contents

- [Overview](#overview)
- [lib/stellar/index.ts — network clients and contracts](#libstellarindexts)
- [lib/stellar/horizon.ts — Horizon REST utilities](#libstellarhorizonts)
- [lib/stellar/sep7.ts — payment URIs](#libstellarsep7ts)
- [lib/stellar/federation.ts — SEP-2 address resolution](#libstellarfederationts)
- [lib/stellar/exchanges.ts — known CEX registry](#libstellarexchangests)
- [lib/stellar/prices.ts — fiat price estimation](#libstellarpricests)
- [lib/stellar/strkey.ts — StrKey validation](#libstellarstrkeysts)
- [lib/stellar/assets.ts — testnet asset catalogue](#libstellarassetsts)
- [lib/stellar/config.ts — URL constants](#libstellarconfigts)
- [lib/sep24/anchors.ts — SEP-24 off-ramp anchors](#libsep24anchorsts)
- [lib/network-mode.ts — testnet / mainnet toggle](#libnetwork-modets)
- [SEP-10 authentication](#sep-10-authentication)
- [Getting a funded testnet account](#getting-a-funded-testnet-account)

---

## Overview

FacilPay processes payments on the Stellar network. The integration covers four protocol layers:

| Layer | Standard | Purpose |
|---|---|---|
| Account & payment history | Horizon REST | Load balances, stream payments, fetch operations |
| Smart contracts | Soroban | On-chain payment, escrow, and refund logic |
| Payment request URIs | SEP-7 | QR codes that wallets can scan to pre-fill a payment |
| Interactive off-ramp | SEP-24 | Withdraw USDC / EURC to a bank account via an anchor |
| Address resolution | SEP-2 | Resolve `name*domain.com` federation addresses |
| Authentication | SEP-10 | Wallet-signed challenge proves account ownership |

---

## `lib/stellar/index.ts`

The main barrel. Import from here rather than from individual files.

```ts
import {
  horizonServer,
  sorobanRpc,
  contracts,
  stellarNetwork,
  TESTNET_ASSETS,
  STELLAR_HORIZON,
} from "@/lib/stellar";
```

### `stellarNetwork`

The Stellar network passphrase for the configured environment. Derived from `NEXT_PUBLIC_STELLAR_NETWORK`:

| `NEXT_PUBLIC_STELLAR_NETWORK` | Passphrase |
|---|---|
| `mainnet` | `Networks.PUBLIC` |
| `testnet` | `Networks.TESTNET` |
| `futurenet` | `Networks.FUTURENET` |

Pass this into `TransactionBuilder` when signing transactions so they cannot be replayed on another network.

### `horizonServer`

A `Horizon.Server` instance pointed at `NEXT_PUBLIC_STELLAR_HORIZON_URL`. Use for account lookups, payment history, and transaction submission.

```ts
const account  = await horizonServer.loadAccount("GABCD...");
const payments = await horizonServer.payments().forAccount("GABCD...").call();
```

`allowHttp: true` is set on non-mainnet to permit HTTP URLs during local development.

### `sorobanRpc`

An `rpc.Server` instance pointed at `NEXT_PUBLIC_SOROBAN_RPC_URL`. Use for contract simulation and invocation.

```ts
const ledger = await sorobanRpc.getLatestLedger();
const result = await sorobanRpc.simulateTransaction(tx);
```

### `contracts`

Pre-built helpers for the three core FacilPay Soroban contracts. Each helper exposes `contract`, `isConfigured`, `contractId`, and `simulate`.

```ts
if (contracts.payment.isConfigured) {
  const result = await contracts.payment.simulate("pay", args, signerKeypair);
}
```

Set contract addresses via environment variables:

```env
NEXT_PUBLIC_PAYMENT_CONTRACT_ID=C...
NEXT_PUBLIC_ESCROW_CONTRACT_ID=C...
NEXT_PUBLIC_REFUND_CONTRACT_ID=C...
```

Leave a variable blank to disable that contract. `isConfigured` will be `false` and `simulate` will log a warning and return `null` instead of throwing.

**`simulate(method, args, signer)`** builds a transaction with `TransactionBuilder`, loads the source account from Horizon, calls `sorobanRpc.simulateTransaction()`, and returns the full simulation response. It does not sign or submit — that step belongs to the wallet integration.

---

## `lib/stellar/horizon.ts`

Direct Horizon REST utilities that bypass the SDK's fluent builder, useful when you need raw account data or path payment quotes.

### `fetchHorizonAccount(accountId, horizonUrl?)`

```ts
import { fetchHorizonAccount } from "@/lib/stellar/horizon";

const { account, isUnfunded, error } = await fetchHorizonAccount("GABCD...");
if (isUnfunded) { /* 404 — account does not exist on-chain */ }
```

Returns `{ account: HorizonAccountResponse | null, isUnfunded: boolean, error?: string }`.

### `parseHorizonBalances(account)`

Converts a raw `HorizonAccountResponse` into a typed `FormattedBalance[]` with XLM always first. Calculates the spendable XLM balance using `calculateXlmReserve`.

### `calculateXlmReserve(totalXlm, subentryCount, sellingLiabilities)`

Stellar requires a minimum reserve to keep an account open. The formula is:

```
minReserve = (2 + subentryCount) × 0.5 XLM + sellingLiabilities
spendable  = totalXlm - minReserve
```

Each trustline, offer, or data entry costs one subentry (0.5 XLM). An account with USDC and EURC trustlines holds 2 subentries → minimum reserve of 2 XLM.

### `fundWithFriendbot(accountId)`

Calls `https://friendbot.stellar.org/?addr=...`. Returns `{ success, message }`. Only works on testnet — see [Getting a funded testnet account](#getting-a-funded-testnet-account).

### `fetchAccountOperations(accountId, limit?, horizonUrl?)`

Returns the most recent `limit` operations for an account as `HorizonOperation[]`.

### `findStrictReceiveQuote(params)`

Queries Horizon's strict-receive path payment API for the best conversion rate between two assets. Falls back to hardcoded estimates if the API fails (XLM/USDC ≈ 0.12, EURC/USDC ≈ 1.08). Quotes expire after 30 seconds.

```ts
const quote = await findStrictReceiveQuote({
  sourceAsset: "XLM",
  destinationAsset: "USDC",
  destinationAmount: "50",
});
// quote.sourceAmount = amount of XLM needed to receive exactly 50 USDC
```

---

## `lib/stellar/sep7.ts`

SEP-7 defines the `web+stellar:pay` URI scheme, which lets wallets scan a QR code and pre-fill a payment.

### `buildSep7PayUri(options)`

```ts
import { buildSep7PayUri } from "@/lib/stellar/sep7";

// Native XLM payment
const uri = buildSep7PayUri({
  destination: "GABCD...",
  amount: "10",
});
// → "web+stellar:pay?destination=GABCD...&amount=10"

// USDC payment with memo
const uri = buildSep7PayUri({
  destination: "GABCD...",
  amount: 50,
  asset: { code: "USDC", issuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5" },
  memo: "ORDER-1234",
  memoType: "text",
  message: "Payment for order #1234",
});
```

**Rules:**
- `amount` must be a positive decimal. Exponential notation is normalised to decimal form.
- `asset` defaults to `"native"` (XLM). For issued assets both `code` and `issuer` must be non-empty.
- `memo` requires `memoType` to be explicitly set, and vice versa.
- Throws `Error` for invalid inputs rather than producing a silently broken URI.

**Memo types:**

| `memoType` | Encoded as |
|---|---|
| `"text"` | `memo_type=MEMO_TEXT` |
| `"id"` | `memo_type=MEMO_ID` |
| `"hash"` | `memo_type=MEMO_HASH` |

---

## `lib/stellar/federation.ts`

SEP-2 federation resolves human-readable addresses (`name*domain.com`) to Stellar public keys.

### `isFederationAddress(value)`

Returns `true` if the value looks like `username*domain.com`.

### `resolveFederationAddress(address)`

```ts
import { resolveFederationAddress } from "@/lib/stellar/federation";

const record = await resolveFederationAddress("merchant*facilpay.io");
// { account_id: "GDYTY...", memo: "FP-MERCH-01", memo_type: "text" }
```

Resolution order:

1. **Built-in registry** — fast offline lookup for FacilPay addresses (`merchant*facilpay.io`, `treasury*facilpay.io`) and major exchanges (Binance, Coinbase, Kraken, Bitso).
2. **Live SEP-2 HTTP lookup** — `GET https://{domain}/federation?q=...&type=name` with a 2.5 s timeout.
3. **Deterministic fallback** — returns a sample key so development flows don't break when the domain is unreachable.

**Exchange detection:** Records from the registry for exchange addresses carry `isExchange: true`, `exchangeName`, and a required `memo`. Always forward the memo when sending to an exchange or the funds will be lost.

---

## `lib/stellar/exchanges.ts`

A registry of known centralised exchange deposit addresses.

### `KNOWN_EXCHANGE_ADDRESSES`

Maps Stellar addresses to `ExchangeInfo` (Binance, Coinbase, Kraken, Bitso, KuCoin, OKX). All entries have `memoRequired: true`.

### `getExchangeDetails(address, federationDomain?)`

Returns `ExchangeInfo | null`. Checks by address first, then by domain string matching.

```ts
import { getExchangeDetails, isKnownExchangeAddress } from "@/lib/stellar/exchanges";

if (isKnownExchangeAddress(destination)) {
  // warn the user they must include a memo
}
```

---

## `lib/stellar/prices.ts`

Fiat price estimation for balance displays. Does not hit a live price feed — values are static defaults suitable for UI previews.

### `getFiatEstimate(assetCode, amount, currency?, customPriceFeeds?)`

```ts
import { getFiatEstimate } from "@/lib/stellar/prices";

const estimate = getFiatEstimate("USDC", 1250);
// { formatted: "$1,250.00", value: 1250, currency: "USD" }
```

Default price feeds: USDC = $1.00, XLM = $0.1285, EURC = $1.085, AQUA = $0.0052.

### `calculateTotalPortfolioUsd(balances, priceFeeds?)`

Sums fiat values across a `FormattedBalance[]` from `parseHorizonBalances`. Returns `{ totalUsd, formatted, hasUnavailablePrices }`.

---

## `lib/stellar/strkey.ts`

Pure TypeScript StrKey validation — no SDK dependency. Use this for validating user-entered addresses without loading the full SDK bundle.

### `StrKey.isValidEd25519PublicKey(address)`

Returns `true` if the address is a valid G… Stellar public key. Checks: length 56, starts with `G`, valid Base32, correct version byte (0x30), CRC16-XModem checksum.

### `StrKey.isValidAddress(address)`

Accepts both G… (Ed25519) and M… (muxed) addresses.

### `StrKey.truncateAddress(address, start?, end?)`

Returns `"GABCD…WXYZ"` for display. Defaults: first 4 and last 4 characters.

---

## `lib/stellar/assets.ts`

### `TESTNET_ASSETS`

```ts
import { TESTNET_ASSETS } from "@/lib/stellar";

TESTNET_ASSETS.USDC  // { code: "USDC", issuer: "GBBD47...", name: "USD Coin", ... }
TESTNET_ASSETS.EURC  // { code: "EURC", issuer: "GBBD47...", name: "Euro Coin", ... }
TESTNET_ASSETS.XLM   // { code: "XLM",  issuer: "native",   name: "Stellar Lumens", ... }
```

USDC and EURC use Circle's testnet issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.

---

## `lib/stellar/config.ts`

Reads `NEXT_PUBLIC_STELLAR_NETWORK` and derives:

| Export | Value (testnet) | Value (mainnet) |
|---|---|---|
| `STELLAR_HORIZON` | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` |
| `STELLAR_FRIENDBOT_URL` | `https://friendbot.stellar.org` | `null` |
| `STELLAR_NETWORK` | `"testnet"` | `"mainnet"` |

---

## `lib/sep24/anchors.ts`

SEP-24 defines an interactive off-ramp flow where a merchant redirects to an anchor's hosted UI to withdraw crypto to a bank account.

### Configured anchors

| Anchor | Assets | Regions | Fee | Delivery |
|---|---|---|---|---|
| **MoneyGram Access** | USDC | Global (180+ countries) | 0% (promo) | Instant – 15 min |
| **Anclap Global** | USDC, EURC | EU, Brazil, Mexico, Argentina, Colombia | 0.35% | Same-day (< 2 h) |
| **Yellow Card** | USDC | Pan-Africa (Nigeria, Kenya, South Africa…) | 0.50% | 5 – 30 min |
| **Vibrant ACH** | USDC | United States | $1.50 flat | 1 business day / instant (FedNow) |
| **MyKobo SEPA** | EURC | Eurozone (36 SEPA countries) | €1.00 flat | 10 s (SEPA Instant) |

### `createSep24Session(anchor, params)`

```ts
import { CONFIGURABLE_ANCHORS, createSep24Session } from "@/lib/sep24/anchors";

const anchor = CONFIGURABLE_ANCHORS.find((a) => a.id === "anclap")!;
const { transaction, interactiveUrl } = createSep24Session(anchor, {
  amount: 500,
  asset: "USDC",
});

// Redirect merchant to interactiveUrl in a popup or new tab
window.open(interactiveUrl, "_blank");
```

The function creates a `Sep24Transaction` stub with status `"incomplete"`. Fee is 0% for MoneyGram, 0.4% for all others. `fiatCurrency` is `"EUR"` for EURC and `"USD"` for everything else.

### `Sep24Transaction` status lifecycle

```
incomplete
  → pending_user_transfer_start  (merchant submits Stellar TX)
  → pending_anchor               (anchor processing)
  → pending_external             (funds in transit to bank)
  → completed | error
```

Poll `anchor.statusEndpoint?transaction_id=...` to track progress.

---

## `lib/network-mode.ts`

### Persistence

The testnet/mainnet toggle is stored in `localStorage` under the key `facilpay.network_mode`. When the user switches, the page does not reload — React state updates immediately via `NetworkModeProvider`.

### Default value

If `NEXT_PUBLIC_STELLAR_NETWORK=mainnet` the default mode is `"mainnet"`. For `testnet` or `futurenet` the default is `"testnet"`.

### Using the toggle in a component

```ts
import { useNetworkMode } from "@/lib/network-mode-context";

function NetworkBadge() {
  const { isTestnet, toggleMode } = useNetworkMode();
  return (
    <button onClick={toggleMode}>
      {isTestnet ? "Testnet" : "Mainnet"}
    </button>
  );
}
```

`useNetworkMode()` throws if used outside `NetworkModeProvider`. The provider initialises to `"testnet"` on the server (to avoid hydration mismatches) and reads the real stored value in `useEffect`.

### Programmatic access (outside React)

```ts
import { getStoredNetworkMode, storeNetworkMode } from "@/lib/network-mode";

const mode = getStoredNetworkMode(); // "testnet" | "mainnet"
storeNetworkMode("mainnet");
```

---

## SEP-10 authentication

SEP-10 lets a user prove they control a Stellar account without sending a transaction. The flow is:

1. **Challenge** — the server returns a transaction envelope built with the account's public key and signed by the server's signing key.
2. **Sign** — the client wallet (Freighter) signs the challenge with the user's private key.
3. **Verify** — the server verifies both signatures and issues a JWT.

In FacilPay, SEP-10 is used by anchors to verify the merchant's Stellar account before initiating an off-ramp session. The signed challenge is included in the `Authorization: Bearer` header when calling an anchor's `POST /auth` endpoint. The JWT returned from that call is then passed as a query parameter when opening the interactive SEP-24 URL.

The app delegates wallet signing to Freighter through `components/wallet/providers.tsx`. When a Soroban contract invocation or SEP-10 challenge needs signing, the calling code passes a `signTransaction` callback (provided by Freighter's React hook) to the relevant hook (e.g. `useRetryRefund`).

---

## Getting a funded testnet account

The Stellar testnet resets roughly every three months. Testnet XLM has no monetary value.

### Method 1 — Friendbot (programmatic)

```ts
import { fundWithFriendbot } from "@/lib/stellar/horizon";

const { success, message } = await fundWithFriendbot("GABCD...");
```

This calls `https://friendbot.stellar.org/?addr=...` and credits 10,000 testnet XLM to the account. The account must not already exist on-chain (Friendbot creates it).

### Method 2 — Stellar Laboratory (browser)

1. Open [https://laboratory.stellar.org](https://laboratory.stellar.org) and switch to **Testnet**.
2. Click **Generate keypair** to create a fresh key pair.
3. Copy the public key and open [https://friendbot.stellar.org/?addr=](https://friendbot.stellar.org/?addr=)`<your-public-key>` in a browser tab.
4. You will receive 10,000 testnet XLM.

### Method 3 — Testnet USDC via the balances page

The `/balances` page in the app has a **"Fund with Friendbot"** button that calls `fundWithFriendbot` automatically for the connected wallet.

After funding, you need USDC and EURC trustlines to receive non-native assets. Use the balances page to add trustlines to the Circle testnet issuer: `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`.

USDC on testnet can be obtained from [https://centre.io/usdc-testnet-faucet](https://centre.io/usdc-testnet-faucet) or by trading XLM via Horizon's DEX on the testnet.

### Setting your wallet in the app

The `DEFAULT_CONNECTED_WALLET` constant in `lib/storage.ts` is the account the payment stream listens to. Update it (or the `initialAccountId` prop on `PaymentStreamProvider`) to your funded testnet key to see live payments flowing through the overview page.
