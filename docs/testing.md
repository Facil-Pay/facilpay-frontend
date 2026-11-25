# Testing Guide

This repo has three kinds of tests. Pick the lowest layer that can prove what you need.

| Layer | Tool | Where | Run with |
| --- | --- | --- | --- |
| Unit (pure logic) | Vitest in jsdom | `tests/*.test.ts` | `npm test` |
| Component | Vitest + React Testing Library + user-event | `tests/components/*.test.tsx` | `npm test` |
| End-to-end (browser) | Playwright | `e2e/*.spec.ts` | `npm run test:e2e` |

`npm test` runs Vitest only. It excludes `e2e/` (see `vitest.config.ts`), so Playwright specs never run under Vitest.

Use Node 22, which matches CI. Node 26 ships an experimental `localStorage` global that shadows jsdom's, so storage tests fail there with `window.localStorage` undefined.

## Setup

```bash
npm install
```

Unit and component tests need no environment variables. E2E tests start the dev server themselves with mock mode on (see [End-to-end tests](#end-to-end-tests-playwright)).

## Unit tests (Vitest)

Vitest is configured in `vitest.config.ts`:

- `environment: "jsdom"`, so `window`, `localStorage` and the DOM exist.
- `globals: true`, but prefer importing from `vitest` explicitly, as the existing tests do.
- `setupFiles: ["./tests/setup.ts"]`, which runs before every file.
- The `@/` alias resolves to the repo root, so `@/lib/storage` works in tests.

Example from `tests/storage.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadFromStorage } from "@/lib/storage";

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

it("returns the fallback when storage throws", () => {
  vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
    throw new DOMException("blocked", "SecurityError");
  });
  expect(loadFromStorage("key", "fallback")).toBe("fallback");
});
```

Rules that keep unit tests reliable:

- Reset storage and mocks in `beforeEach` or `afterEach`. Never rely on test order.
- Use `vi.stubGlobal("window", undefined)` to test the SSR path, and `vi.unstubAllGlobals()` to restore it. Unstub before you touch `window` again.
- Spy on `Storage.prototype` when you need storage to throw.

## Component tests (React Testing Library)

Component tests live in `tests/components/` and render the real component tree. Query elements the way a user finds them: by role, accessible name, label or placeholder. Avoid CSS class selectors.

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "@/components/ui/copy-button";

it("copies the value on click", async () => {
  const user = userEvent.setup();
  render(<CopyButton value="abc" />);
  await user.click(screen.getByRole("button"));
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith("abc");
});
```

Conventions:

- Create `userEvent.setup()` in the test and `await` every interaction. Do not use `fireEvent` for user actions.
- Use `findBy*` or `waitFor` for anything that resolves asynchronously. Wrap state changes that you trigger yourself in `act` only if RTL does not do it for you.
- Mock app-level context and framework hooks with `vi.mock`. The onboarding wizard test is a good reference:
  - `next/navigation` (router), returned from `vi.hoisted` so the mock can share a spy with the assertions.
  - `@/lib/auth-context` (`useAuth`).
  - `next-intl` (`useTranslations`), returning real strings from `messages/en.json`.
  - `@/lib/stellar` (wallet and Horizon helpers). Stellar calls must never reach the network from a component test.
- Share spies between `vi.mock` factories and tests with `vi.hoisted`. A plain `const` at the top of the file is not available when `vi.mock` is hoisted.
- Reset storage in `beforeEach`, then seed it with the state a test needs. The onboarding wizard reads its progress from `localStorage` on mount.

## MSW (network mocking)

MSW (Mock Service Worker) intercepts `fetch` in Node tests. `tests/setup.ts` owns the server lifecycle for every test file:

```ts
export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

What this means for you:

- Any request that has no handler **fails the test**. A test cannot reach the real network by accident.
- Add a handler for one test with `server.use(...)`. It is removed automatically after that test.
- Do not add handlers at module scope in a test file. They would leak into the rest of the file.

To reuse the app's mock API in a test, pass its handlers to `server.use`:

```ts
// Import the shared server from tests/setup.ts (relative path from your test file)
import { server } from "./setup";
import { handlers } from "@/lib/mocks/handlers";

beforeEach(() => server.use(...handlers));
```

`lib/mocks/handlers.ts` imports `lib/env.ts`, which validates every `NEXT_PUBLIC_*` variable from `.env.example` when the module loads. Set those variables in the test environment (for example with `vi.stubEnv`) before importing it, or mock `@/lib/env` in the test.

For Stellar Horizon and other non-`fetch` clients, mock the module (as the wizard test does) rather than relying on MSW.

## End-to-end tests (Playwright)

E2E specs live in `e2e/` and are configured by `playwright.config.ts`. The config starts `npm run dev` with `NEXT_PUBLIC_USE_MOCKS=true` and `NEXT_PUBLIC_STELLAR_NETWORK=testnet`, so you do not need a running backend. Locally it reuses an existing dev server on port 3000.

First-time setup installs the browser:

```bash
npx playwright install chromium
```

Run the suite:

```bash
npm run test:e2e
```

Useful variants:

```bash
npx playwright test e2e/payments.spec.ts       # one file
npx playwright test -g "creates a payment"     # one test by title
npx playwright test --headed                   # watch the browser
npx playwright test --ui                       # interactive runner with time travel
npx playwright test --debug                    # step through with the inspector
npx playwright show-report                     # open the last HTML report
```

On failure Playwright keeps a screenshot, and a trace on the first retry. Open a trace with `npx playwright show-trace <path-to-trace.zip>`.

## Running a single test

| Goal | Command |
| --- | --- |
| One Vitest file | `npx vitest run tests/storage.test.ts` |
| One Vitest test by name | `npx vitest run -t "returns the fallback"` |
| Watch mode (re-runs on save) | `npx vitest` (interactive; `npx vitest watch` also works) |
| Full unit and component suite | `npm test` |
| One Playwright spec | `npx playwright test e2e/auth.spec.ts` |
| Debug a Playwright test | `npx playwright test --debug e2e/auth.spec.ts` |

Watch mode is interactive. Press `a` in the Vitest watcher to run all tests, or `q` to quit.

## File location and naming

- Unit tests: `tests/<area>.test.ts`, e.g. `tests/storage.test.ts`, `tests/csvExport.test.ts`.
- Component tests: `tests/components/<component-name>.test.tsx`, kebab-case, e.g. `copy-button.test.tsx`.
- E2E specs: `e2e/<flow>.spec.ts`, e.g. `e2e/api-keys.spec.ts`.
- Shared setup: `tests/setup.ts` only. Put reusable test helpers next to the tests that use them, not in a shared folder that grows without limit.
- Use the `@/` alias for imports from the app, and relative paths only for test-local helpers.
- Name `describe` blocks after the unit under test and `it` blocks after the behaviour, for example `it("keeps the in-memory value when setItem throws")`.

## Checklist for a new test

- [ ] Placed in the right folder and named `*.test.ts` or `*.test.tsx`
- [ ] Storage and mocks are reset before and after each test
- [ ] No real network: framework and Stellar calls are mocked, and anything else is handled by MSW
- [ ] Queries use roles, names, labels or placeholders
- [ ] Async assertions use `findBy*` or `waitFor`
- [ ] `npm test` passes on Node 22

See also `docs/adding-api-endpoints.md` for how API mocks and hooks fit together.
