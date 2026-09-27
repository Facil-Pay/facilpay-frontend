# facilpay-frontend

Merchant dashboard for FacilPay. Manage payments, view analytics, configure webhooks, and handle refunds through an intuitive web interface.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Mock Mode](#mock-mode)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [API Client Layer](#api-client-layer)
- [Stellar Integration](#stellar-integration)
- [Running the App](#running-the-app)
- [Contribution](#contribution)

---

## Project Overview

A **production-ready Next.js 16 application** built with TypeScript and modern tooling. It serves as the foundation for:

- Payment management and lifecycle tracking
- Analytics dashboards with on-chain metrics
- Webhook configuration and delivery monitoring
- Refund management and escrow handling

**Tech stack:**

## Design Tokens

Tailwind utilities use the brand and semantic tokens defined in `app/globals.css`.
The brand palette is primary blue `#55C2FF`, secondary blue `#A5D4FF`, and deep navy
`#000F24`. Use semantic utilities such as `bg-background`, `text-danger`, and
`border-border` instead of hard-coding colors. Use `font-heading` for Montserrat,
`font-sans` for Inter, and `font-mono` for wallet addresses, hashes, and API keys.
The same theme defines the type scale, spacing, radii, and elevation tokens; `.dark`
overrides the semantic surface colors.

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9 (or pnpm / yarn)
- **Git**

---

## Installation

```bash
git clone https://github.com/yourusername/facilpay-frontend.git
cd facilpay-frontend
npm install
cp .env.example .env.local   # then fill in the values
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values. All `NEXT_PUBLIC_*` variables are validated with Zod at startup — the app throws a clear error message if any required variable is missing or malformed.

```env
# ── API ──────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1

# ── Auth ─────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_AUTH_LOGOUT_URL=http://localhost:3000/login

# ── Stellar ───────────────────────────────────────────────────────────────────
NEXT_PUBLIC_STELLAR_NETWORK=testnet          # mainnet | testnet | futurenet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

NEXT_PUBLIC_PAYMENT_CONTRACT_ID=             # leave blank to disable
NEXT_PUBLIC_ESCROW_CONTRACT_ID=
NEXT_PUBLIC_REFUND_CONTRACT_ID=

# ── App ───────────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Mock mode (see below) ─────────────────────────────────────────────────────
NEXT_PUBLIC_USE_MOCKS=true
```

> ⚠️ Never commit `.env.local`. Only `.env.example` is tracked.

---

## Mock Mode

The app ships with a complete **Mock Service Worker (MSW)** setup so you can do frontend development without a running backend.

### Enabling mock mode

Set `NEXT_PUBLIC_USE_MOCKS=true` in `.env.local` (it is already `true` in the provided example).

When mock mode is active:

- The browser service worker at `/mockServiceWorker.js` intercepts every `fetch` call that targets `NEXT_PUBLIC_API_BASE_URL`.
- Realistic fixture data is returned for every supported endpoint (payments, dashboard, refunds, escrows, webhooks, API keys, merchant, team, payouts).
- A simulated 200 ms latency is applied so loading states are visible during development.
- Unrecognised requests (assets, Next.js internal routes) are passed through to the real network.

### Disabling mock mode

Set `NEXT_PUBLIC_USE_MOCKS=false` (or remove the variable). The MSW worker will not start and all requests go to the real API.

### Mock handlers

All handlers live in `lib/mocks/handlers.ts`. They support:

| Method | Behaviour |
|---|---|
| `GET /payments` | Returns paginated list; honours `page`, `pageSize`, `status`, `network`, `search` |
| `GET /payments/:id` | Returns one payment or 404 |
| `POST /payments` | Creates a stub payment (201) |
| `POST /payments/:id/cancel` | Cancels a payment |
| `POST /payments/:id/retry` | Sets status to `processing` |
| `POST /payments/:id/refund` | Creates a stub refund |
| `GET /dashboard` | Returns full KPI / chart data |
| `GET /refunds` | Paginated refund list |
| `GET /webhooks` | Paginated webhook list with full CRUD |
| `GET /merchant` | Returns merchant profile |
| `GET /merchant/team` | Returns team member list |
| `GET /payouts` | Paginated payout list |
| … | All list endpoints honour `page` / `pageSize` |

### Adding a handler

```ts
// lib/mocks/handlers.ts
import { http, HttpResponse } from "msw";

http.get(`${base}/your-endpoint`, async () => {
  await delay(200);
  return HttpResponse.json({ data: [] });
}),
```

### Accessing the MSW server (Node / tests)

```ts
import { server } from "@/lib/mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

## Refund flow integration

The refund screen currently uses sample payment records because this starter repository does not include a payment API or query cache. Replace the `initialPayments` data in `app/page.tsx` with the merchant payment source and invalidate/refetch its payment and refund queries after confirmation.

The Soroban call expects the configured refund contract to expose `refund(payment_id: u64, amount: i128, destination: Address, reason: String)`. Amounts are sent in Stellar's 7-decimal base units. The transaction is simulated through `NEXT_PUBLIC_SOROBAN_RPC_URL` (or the connected wallet's RPC URL), signed through Freighter, and submitted to that network. Confirm this ABI and the payment ID mapping against the deployed contract before enabling production refunds.

---

## Development Workflow

```bash
npm run dev     # start dev server at http://localhost:3000
npm run build   # production build
npm run lint    # ESLint
npm start       # start production server (after build)
```

---

## Project Structure

```
facilpay-frontend/
│
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (nav, footer, Providers)
│   ├── providers.tsx           # QueryClientProvider + MSW init + Devtools
│   ├── dashboard/page.tsx      # Overview page
│   ├── payments/
│   │   ├── page.tsx            # Payments list
│   │   └── [id]/page.tsx       # Payment detail
│   ├── components/
│   │   ├── ui/                 # Badge, Button, Card, Select, Spinner, …
│   │   ├── payments/           # PaymentStatusBadge, Timeline, Actions, …
│   │   └── dashboard/          # KpiCards, RevenueTrendChart, …
│   └── lib/                    # App-layer mock API (used before backend)
│       ├── api/payments.ts
│       └── types/payment.ts
│
├── lib/                        # Framework-agnostic infrastructure
│   ├── env.ts                  # Zod env validation (fail-fast)
│   ├── api/
│   │   ├── client.ts           # Typed fetch wrapper (ApiError, auth, logout)
│   │   ├── keys.ts             # TanStack Query key factories
│   │   └── hooks/              # usePayments, useDashboard, useRefunds, …
│   ├── types/                  # Domain types: Payment, Refund, Escrow, …
│   ├── stellar/index.ts        # Horizon server, Soroban RPC, contract helpers
│   └── mocks/
│       ├── fixtures.ts         # Realistic mock data
│       ├── handlers.ts         # MSW request handlers
│       ├── browser.ts          # MSW browser worker entry-point
│       └── server.ts           # MSW Node server entry-point (tests)
│
├── public/
│   └── mockServiceWorker.js    # MSW service worker (auto-generated)
│
├── .env.example                # Template — copy to .env.local
└── .env.local                  # Your local secrets — git-ignored
```

---

## API Client Layer

```ts
import { apiClient, ApiError } from "@/lib/api/client";

// GET with typed response
const payment = await apiClient.get<Payment>("/payments/pay_123");

// POST with typed body + response
const created = await apiClient.post<Payment, CreatePaymentRequest>(
  "/payments",
  { body: { amount: 100, currency: "USDC", … } }
);

// Error handling
try {
  await apiClient.get("/payments/unknown");
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.status, err.code, err.message); // 404, "payment_not_found", …
    if (err.isNotFound) { /* handle 404 */ }
  }
}
```

### React Query hooks

```ts
import { usePayments, usePayment, useCreatePayment } from "@/lib/api/hooks";

// In a client component:
const { data, isLoading, error } = usePayments({ status: "completed", page: 1 });
const { data: payment } = usePayment("pay_123");
const { mutate: createPayment } = useCreatePayment();
```

### Query key factories

```ts
import { paymentKeys, dashboardKeys } from "@/lib/api/keys";

queryClient.invalidateQueries({ queryKey: paymentKeys.all() });
queryClient.invalidateQueries({ queryKey: paymentKeys.detail("pay_123") });
```

---

## Stellar Integration

```ts
import { horizonServer, sorobanRpc, contracts } from "@/lib/stellar";

// Horizon — account info
const account = await horizonServer.loadAccount("G…");

// Soroban RPC — latest ledger
const ledger = await sorobanRpc.getLatestLedger();

// Contract helpers
if (contracts.payment.isConfigured) {
  const result = await contracts.payment.simulate("pay", args, signerKeypair);
}
```

Configure contract addresses via environment variables:

```env
NEXT_PUBLIC_PAYMENT_CONTRACT_ID=C...
NEXT_PUBLIC_ESCROW_CONTRACT_ID=C...
NEXT_PUBLIC_REFUND_CONTRACT_ID=C...
```

---

## Running the App

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (hot reload) at http://localhost:3000 |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | Run ESLint |

---

## Contribution

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit: `git commit -m "feat: description"`
4. Push: `git push origin feat/your-feature`
5. Open a pull request

Community: https://t.me/+afM9uh7GGtVkYmZk
