# Adding an API Resource End to End

This guide walks through adding a new REST resource to the dashboard: types, query keys, a React Query hook, MSW mocks, and error handling in the UI. It follows the Payments domain in `lib/api/hooks/usePayments.ts`, so when in doubt, copy the shape of that file.

The worked example adds a **disputes** resource:

- `GET /disputes` (paginated list, optional status filter)
- `GET /disputes/:id` (detail)
- `POST /disputes/:id/respond` (mutation)

## Overview

| Step | File(s) | Purpose |
| --- | --- | --- |
| 1 | `lib/types/<resource>.ts`, `lib/types/index.ts` | API contract types |
| 2 | `lib/api/keys.ts` | Query key factory |
| 3 | `lib/api/hooks/use<Resource>.ts`, `lib/api/hooks/index.ts` | Data hooks |
| 4 | `lib/mocks/fixtures.ts`, `lib/mocks/handlers.ts` | MSW fixtures and handlers |
| 5 | Feature component under `components/<feature>/` | Loading, empty, error and data states |
| 6 | `tests/` | Tests for the hook and the UI |

## Step 1: Define the types

API contracts live in `lib/types/`, one file per domain. Use `interface` for resources, string-literal unions for enumerations, and `Paginated<T>` from `lib/types/pagination.ts` for list responses.

```ts
// lib/types/dispute.ts
export type DisputeStatus = "open" | "under_review" | "resolved" | "rejected";

export interface Dispute {
  id: string;
  paymentId: string;
  status: DisputeStatus;
  reason: string;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

export interface DisputeListParams {
  status?: DisputeStatus;
  page?: number;
  pageSize?: number;
}

export interface RespondToDisputeRequest {
  message: string;
}
```

Re-export the file from the barrel so consumers can import from `@/lib/types`:

```ts
// lib/types/index.ts
export * from "./dispute";
```

Do not add API contracts to `app/lib/types/` or the top-level `types/` directory. Those are for legacy code and app-only state.

## Step 2: Add a query key factory

Every domain gets a factory in `lib/api/keys.ts`. Each factory returns a readonly tuple, and nested keys build on their parent, so invalidating `all()` also matches everything below it.

```ts
// lib/api/keys.ts
import type { DisputeListParams } from "@/lib/types/dispute";

export const disputeKeys = {
  /** Matches every dispute query */
  all: () => ["disputes"] as const,
  /** Matches all dispute list queries (any filter) */
  lists: () => [...disputeKeys.all(), "list"] as const,
  /** Matches one specific list query */
  list: (params: DisputeListParams) => [...disputeKeys.lists(), params] as const,
  /** Matches one dispute by ID */
  detail: (id: string) => [...disputeKeys.all(), "detail", id] as const,
} as const;
```

## Step 3: Write the hook

Hooks live in `lib/api/hooks/`, one file per domain, and are re-exported from `lib/api/hooks/index.ts`. Follow these conventions from `usePayments.ts`:

- Start the file with the doc comment, then `"use client";`.
- Call `apiClient.get`, `apiClient.post`, or `apiClient.patch` with a type argument. Do not call `fetch` directly, because `apiClient` handles the base URL, auth token, and error mapping.
- Type every query and mutation with `ApiError` as the error type.
- Accept `options` on query hooks and spread them last so callers can override defaults.
- Guard detail queries with `enabled: Boolean(id)`.
- Invalidate with the key factory after a mutation. Use `setQueryData` when the response is the updated resource.

```ts
// lib/api/hooks/useDisputes.ts
"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import { apiClient, type ApiError } from "@/lib/api/client";
import { disputeKeys, paymentKeys } from "@/lib/api/keys";
import type { Paginated } from "@/lib/types/pagination";
import type {
  Dispute,
  DisputeListParams,
  RespondToDisputeRequest,
} from "@/lib/types/dispute";

// ─── List ─────────────────────────────────────────────────────────────────────

export function useDisputes(
  params: DisputeListParams = {},
  options?: Partial<UseQueryOptions<Paginated<Dispute>, ApiError>>
) {
  return useQuery<Paginated<Dispute>, ApiError>({
    queryKey: disputeKeys.list(params),
    queryFn: () =>
      apiClient.get<Paginated<Dispute>>("/disputes", {
        params: params as Record<string, string | number | boolean>,
      }),
    staleTime: 30_000,
    ...options,
  });
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export function useDispute(
  id: string | undefined,
  options?: Partial<UseQueryOptions<Dispute, ApiError>>
) {
  return useQuery<Dispute, ApiError>({
    queryKey: disputeKeys.detail(id ?? ""),
    queryFn: () => apiClient.get<Dispute>(`/disputes/${id}`),
    enabled: Boolean(id),
    staleTime: 60_000,
    ...options,
  });
}

// ─── Respond ──────────────────────────────────────────────────────────────────

export function useRespondToDispute(id: string) {
  const qc = useQueryClient();
  return useMutation<Dispute, ApiError, RespondToDisputeRequest>({
    mutationFn: (body) =>
      apiClient.post<Dispute>(`/disputes/${id}/respond`, { body }),
    onSuccess: (updated) => {
      qc.setQueryData(disputeKeys.detail(id), updated);
      void qc.invalidateQueries({ queryKey: disputeKeys.lists() });
      // A dispute can change the payment it belongs to
      void qc.invalidateQueries({ queryKey: paymentKeys.detail(updated.paymentId) });
    },
  });
}
```

Then export it from the barrel:

```ts
// lib/api/hooks/index.ts
export * from "./useDisputes";
```

## Step 4: Add MSW fixtures and handlers

When `NEXT_PUBLIC_USE_MOCKS=true`, MSW intercepts `apiClient` requests and answers from `lib/mocks/`. The same handlers are used by tests, so a mock that is wrong here will be wrong in tests too.

Fixtures go in `lib/mocks/fixtures.ts`:

```ts
// lib/mocks/fixtures.ts
import type { Dispute } from "@/lib/types/dispute";

export const DISPUTE_FIXTURES: Dispute[] = [
  {
    id: "dsp_01",
    paymentId: "pay_01",
    status: "open",
    reason: "Customer reports a duplicate charge",
    createdAt: "2026-10-01T09:00:00.000Z",
    updatedAt: "2026-10-01T09:00:00.000Z",
  },
  {
    id: "dsp_02",
    paymentId: "pay_07",
    status: "resolved",
    reason: "Goods not delivered",
    createdAt: "2026-09-20T14:30:00.000Z",
    updatedAt: "2026-09-25T10:00:00.000Z",
  },
];
```

Handlers go in `lib/mocks/handlers.ts`. Use the same conventions as the payments handlers:

- Build paths from `base` (`env.NEXT_PUBLIC_API_BASE_URL`).
- Simulate latency with `await delay(LATENCY)`.
- Honour `page`, `pageSize`, and filter params, then return `paginate(...)`.
- Return `HttpResponse.json({ code, message }, { status: 404 })` for unknown IDs, matching the `code` field that `ApiError` reads.
- Return the updated resource for mutations.

```ts
// lib/mocks/handlers.ts  (add to the handler list)
import { DISPUTE_FIXTURES } from "./fixtures";
import type { DisputeStatus } from "@/lib/types/dispute";

const disputeHandlers = [
  // GET /disputes
  http.get(`${base}/disputes`, async ({ request }) => {
    await delay(LATENCY);
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const status = url.searchParams.get("status") as DisputeStatus | null;

    let items = DISPUTE_FIXTURES;
    if (status) items = items.filter((d) => d.status === status);

    return HttpResponse.json(paginate(items, page, pageSize));
  }),

  // GET /disputes/:id
  http.get(`${base}/disputes/:id`, async ({ params }) => {
    await delay(LATENCY);
    const dispute = DISPUTE_FIXTURES.find((d) => d.id === params.id);
    if (!dispute) {
      return HttpResponse.json(
        { code: "dispute_not_found", message: "Dispute not found." },
        { status: 404 }
      );
    }
    return HttpResponse.json(dispute);
  }),

  // POST /disputes/:id/respond
  http.post(`${base}/disputes/:id/respond`, async ({ params }) => {
    await delay(LATENCY);
    const dispute = DISPUTE_FIXTURES.find((d) => d.id === params.id);
    if (!dispute) {
      return HttpResponse.json(
        { code: "dispute_not_found", message: "Dispute not found." },
        { status: 404 }
      );
    }
    return HttpResponse.json({
      ...dispute,
      status: "under_review",
      updatedAt: new Date().toISOString(),
    });
  }),
];
```

Add `...disputeHandlers` to the array that `handlers.ts` exports, next to the other domain groups.

Do not mutate fixture arrays in handlers. Build new objects instead, so one test cannot change the data another test reads.

## Step 5: Handle errors in the UI

Every hook error is an `ApiError` with three fields that matter to the UI:

- `status`: HTTP status. Helpers include `isNotFound`, `isUnauthorized`, `isForbidden`, `isValidation` and `isServerError`.
- `code`: machine-readable code from the API, such as `dispute_not_found`. Falls back to `api_error`.
- `message`: human-readable text. Safe to show in the UI.

On a 401, `apiClient` clears the session token, redirects to the logout URL, and throws an `ApiError` with status 401. Components do not need their own redirect logic for that case.

The UI should show four states: loading, error, empty, and data. Example:

```tsx
// components/disputes/DisputesList.tsx
"use client";

import { useDisputes } from "@/lib/api/hooks";

export function DisputesList() {
  const query = useDisputes({ status: "open" });

  if (query.isPending) {
    return <p role="status">Loading disputes…</p>;
  }

  if (query.isError) {
    return (
      <div role="alert">
        <p>Could not load disputes.</p>
        <p className="text-xs text-zinc-500">{query.error.message}</p>
        <button type="button" onClick={() => query.refetch()}>
          Try again
        </button>
      </div>
    );
  }

  if (query.data.data.length === 0) {
    return <p>No open disputes.</p>;
  }

  return (
    <ul>
      {query.data.data.map((dispute) => (
        <li key={dispute.id}>
          {dispute.reason} ({dispute.status})
        </li>
      ))}
    </ul>
  );
}
```

For mutations, show the error next to the action that failed rather than in a global toast, and disable the submit button while `isPending`.

Map `code` to specific copy only when the UI needs different wording for a known case. Otherwise show `error.message`.

## Step 6: Test it

- Hook and handler behaviour: see `docs/testing.md` for where tests go and how MSW is set up in `tests/setup.ts`.
- Component states: render the component with the query client and assert the loading, error, empty and data states.
- Never let a test reach the network. Unmocked requests fail by design.

## Checklist

- [ ] Types live in `lib/types/<resource>.ts` and are re-exported from `lib/types/index.ts`
- [ ] Query keys are added to `lib/api/keys.ts` with `all`, `lists`, `list` and `detail`
- [ ] Hooks use `apiClient`, type `ApiError` and accept `options`
- [ ] Mutations invalidate or update the matching keys
- [ ] Hooks are re-exported from `lib/api/hooks/index.ts`
- [ ] Fixtures and handlers exist in `lib/mocks/`, including a 404 path
- [ ] Every query shows loading, error, empty and data states
- [ ] Tests cover the hook and at least one UI state
