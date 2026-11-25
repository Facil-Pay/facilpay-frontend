# Architecture overview

This document explains how the app is structured so a new contributor can orient themselves before touching any code.

---

## Table of contents

- [Route groups](#route-groups)
- [Provider tree](#provider-tree)
- [Data flow](#data-flow)
- [MSW mock mode](#msw-mock-mode)
- [Diagram](#diagram)

---

## Route groups

Next.js App Router groups routes by wrapping folder names in parentheses. FacilPay uses three groups plus a set of ungrouped public pages.

```
app/
├── (auth)/           ← unauthenticated shell
├── (dashboard)/      ← authenticated shell
├── [locale]/         ← internationalised pages
└── (ungrouped)       ← public / standalone pages
```

### `(auth)` — unauthenticated shell

**Layout:** `app/(auth)/layout.tsx` renders its children directly with no dashboard shell.

| Route | Description |
|---|---|
| `/login` | Email + password form; calls `POST /auth/login`. On 2FA challenge returns a `challengeId` and routes to a TOTP step. |
| `/onboarding` | Multi-step wizard for new merchants: business profile → settlement Stellar address → first payment link. |

### `(dashboard)` — authenticated shell

**Layout:** `app/(dashboard)/layout.tsx` wraps children in `AppShell` (sidebar + topbar) and `RouteGuard` (redirects unauthenticated users to `/login`).

| Route | Description |
|---|---|
| `/overview` | Live payment stream, KPI stats cards, SEP-7 QR code, getting-started checklist. |
| `/payments` | Paginated payment list with filters. `/payments/[id]` shows the full detail view. |
| `/refunds` | Refund list with status filters. Retry goes through Freighter wallet signing. |
| `/escrow` | Escrow management and dispute resolution. |
| `/analytics` | Recharts visualisations of volume, revenue trend and asset breakdown. |
| `/customers` | Customer list and `/customers/[id]` purchase history. |
| `/notifications` | Notification centre backed by `lib/notifications.ts`. |
| `/reconciliation` | Reconciliation report view. |
| `/developers/api-keys` | API key list with roll/delete actions (step-up 2FA required). |
| `/developers/events` | Webhook delivery log. |
| `/settings/*` | Sub-pages: `profile`, `branding`, `api-keys`, `notifications`, `preferences`, `audit-log`. |

### `[locale]` — internationalised pages

**Layout:** `app/[locale]/layout.tsx` validates the locale against `i18n/routing.ts` (`en`, `es`, `pt`, `fr`) and calls `notFound()` for unknown values. It wraps children in `NextIntlClientProvider` with the matching messages file.

Currently contains locale-scoped escrow pages that require translated copy.

### Ungrouped public pages

These pages have no authentication shell and are served at the root.

| Route | Description |
|---|---|
| `/pay` | Public payment-link landing page (customer-facing). |
| `/checkout` | Checkout flow. |
| `/payment-link` | Payment link creation for merchants. |
| `/payouts` | Payout management. |
| `/balances` | Stellar balance viewer. |
| `/branding` | Public checkout theme preview. |
| `/invite` | Team invite acceptance. |
| `/no-access` | 403 page. |
| `/dev/components` | UI showcase — only accessible when `NODE_ENV=development`, returns 404 in production. |

---

## Provider tree

All providers are set up in `app/layout.tsx` and `app/providers.tsx`. The nesting order matters because inner providers can consume outer ones.

```
app/layout.tsx
  NextIntlClientProvider          ← translations + locale formatting
    WalletProviders               ← Freighter / Stellar wallet adapters
      Providers (providers.tsx)
        AuthProvider              ← simple isAuthenticated boolean
          QueryClientProvider     ← TanStack Query singleton
            {children}
            ReactQueryDevtools    ← dev only, tree-shaken in prod
```

### `AuthProvider` (`app/providers.tsx`)

Holds a single `{ isAuthenticated, setIsAuthenticated }` boolean in React state. Consumed via `useAuth()`. This is a lightweight session gate — the full merchant user object lives in `lib/auth-context.tsx`, which is backed by `localStorage` via `getMerchantUser()`.

### `QueryClientProvider`

Wraps a `QueryClient` created by `makeQueryClient()`. On the browser the same instance is reused across renders via a module-level `browserQueryClient` reference. On the server a fresh instance is created per request to prevent state leakage across concurrent requests.

Default options:
- `staleTime: 30_000` — data is fresh for 30 seconds
- `retry: 1` — retries failed queries once
- `refetchOnWindowFocus: true`
- mutations `retry: 0`

### `NetworkModeProvider` (`lib/network-mode-context.tsx`)

Exposes `{ mode, isTestnet, setMode, toggleMode }` to the dashboard. Persists the toggle in `localStorage` under the key `facilpay.network_mode`. Initialises to `"testnet"` on the server to prevent hydration mismatches, then reads the real stored value in `useEffect`.

### `PaymentStreamProvider` (`lib/payment-stream-context.tsx`)

Manages a singleton Horizon Server-Sent Events connection and exposes the full `payments` list, `latestPayment`, stream `status`, and control methods (`reconnect`, `simulateIncomingPayment`, `clearNewHighlights`). Components call `usePaymentStream()` to subscribe — no second SSE connection is opened.

---

## Data flow

```
User action
    │
    ▼
React component
    │  calls
    ▼
TanStack Query hook  (lib/api/hooks/*.ts)
    │  calls
    ▼
apiClient  (lib/api/client.ts)
    │  fetch()
    ▼
[MSW intercepts in mock mode]
    │  or
    ▼
Real API  (NEXT_PUBLIC_API_BASE_URL)
    │  JSON
    ▼
apiClient parses → returns TResponse | throws ApiError
    │
    ▼
TanStack Query caches + notifies subscribers
    │
    ▼
Component re-renders with fresh data
```

### API client (`lib/api/client.ts`)

`apiClient` is a thin, typed `fetch` wrapper. Every method (`get`, `post`, `put`, `patch`, `delete`) goes through the internal `request<TResponse>()` function which:

1. Builds the URL — prepends `NEXT_PUBLIC_API_BASE_URL` unless `absoluteUrl: true`.
2. Attaches `Authorization: Bearer <token>` from `sessionStorage` key `fp_access_token`.
3. On **401** calls `logout()` (clears token + redirects) before throwing.
4. Throws `ApiError(status, code, message, body)` for all non-2xx responses.

Errors carry typed getters: `isNotFound`, `isUnauthorized`, `isForbidden`, `isValidation`, `isServerError`.

### Query hooks (`lib/api/hooks/`)

Each domain has its own hook file. All hooks are thin `useQuery` / `useMutation` wrappers that call `apiClient` and return fully typed data. Query keys are generated by factories in `lib/api/keys.ts` following the convention `all() → lists() → list(params) → detail(id)` for precise invalidation.

```ts
// example
const { data, isLoading } = usePayments({ status: "completed", page: 1 });
const { mutate: createPayment } = useCreatePayment();
```

### Real-time payments (`lib/payment-stream-context.tsx`)

The overview page does not poll — it opens a Horizon SSE stream via native `EventSource`. New events are parsed in `handleIncomingPaymentData`, deduplicated by `id`, and prepended to the `payments` array in context state. `LiveIndicator` reads the same context to show stream health.

---

## MSW mock mode

When `NEXT_PUBLIC_USE_MOCKS=true`, the MSW browser service worker (`public/mockServiceWorker.js`) intercepts every `fetch` to `NEXT_PUBLIC_API_BASE_URL` and returns fixture data with 200 ms simulated latency. The `apiClient` is unaware of this — it calls `fetch` normally.

**Start-up gate:** `Providers` dynamically imports the handlers and worker, awaits `startWorker()`, then sets `mockReady = true`. Children are not rendered until `mockReady` is true, preventing any fetch from firing before MSW is intercepting.

**Node / test usage:**

```ts
import { server } from "@/lib/mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Adding a handler:**

```ts
// lib/mocks/handlers.ts
import { http, HttpResponse } from "msw";

http.get(`${base}/your-endpoint`, async () => {
  await delay(200);
  return HttpResponse.json({ data: [] });
}),
```

---

## Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Next.js App Router                                │    │
│  │                                                     │    │
│  │  app/layout.tsx                                     │    │
│  │    NextIntlClientProvider                           │    │
│  │      WalletProviders (Freighter)                    │    │
│  │        Providers (providers.tsx)                    │    │
│  │          AuthProvider                               │    │
│  │            QueryClientProvider ◄──────────────┐    │    │
│  │              [route group layout]              │    │    │
│  │                [page component]                │    │    │
│  │                  useXxx() hook ────────────────┘    │    │
│  └────────────────────────────────────────────────────┘    │
│                        │                                    │
│               fetch()  │  (intercepted by MSW in dev)       │
│                        ▼                                    │
│  ┌─────────────────────────────┐  ┌─────────────────────┐  │
│  │  MSW Service Worker         │  │  Real API            │  │
│  │  (mockServiceWorker.js)     │  │  NEXT_PUBLIC_API_... │  │
│  │  lib/mocks/handlers.ts      │  │                     │  │
│  └─────────────────────────────┘  └─────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Horizon SSE stream (EventSource)                    │  │
│  │  lib/payment-stream-context.tsx                      │  │
│  │  Pushes real-time payments to PaymentStreamProvider  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```
