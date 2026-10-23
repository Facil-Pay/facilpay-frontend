# Contributing to FacilPay Frontend

Thanks for helping improve the FacilPay merchant dashboard. Keep changes focused, follow the conventions below, and include enough context for reviewers to verify behavior.

## Local Setup

Prerequisites: Node.js 18 or newer, npm 9 or newer, and Git.

```bash
git clone https://github.com/Facil-Pay/facilpay-frontend.git
cd facilpay-frontend
npm install
cp .env.example .env.local
npm run dev
```

The app is available at <http://localhost:3000>. Review `.env.example` before changing environment values. For normal frontend development, keep `NEXT_PUBLIC_USE_MOCKS=true`; this starts the MSW browser worker and serves fixture data without a backend. The example configures Stellar Testnet. Contract IDs may remain blank unless you are working on contract interactions. Never commit `.env.local`, API credentials, wallet secrets, or other private values.

Set `NEXT_PUBLIC_USE_MOCKS=false` only when you have a reachable backend configured through `NEXT_PUBLIC_API_BASE_URL`.

## Branches and Commits

Create a short, descriptive branch from the current default branch:

```bash
git switch -c feat/payment-search
```

Use these branch prefixes where practical:

- `feat/` for a user-facing capability
- `fix/` for a bug fix
- `docs/` for documentation
- `test/` for test-only changes
- `chore/` for maintenance

Use Conventional Commits, with an optional scope:

```text
feat(payments): add customer search
fix(refunds): preserve filters after retry
docs: explain local mock mode
```

Keep commits small and imperative. Breaking changes should use `!` (for example, `feat(api)!: rename payment status`) and include a `BREAKING CHANGE:` footer explaining the migration.

## Code Placement

- Route pages and route-specific layouts belong under `app/`, using the existing App Router route groups and URL structure.
- Reusable UI belongs in `components/<feature>/` (for example, `components/payments/` or `components/webhooks/`). Shared primitives belong in `components/ui/`.
- React Query request hooks belong in `lib/api/hooks/`; request/query-key logic belongs with the existing API client and key factories under `lib/api/`.
- Shared API/domain contracts belong in `lib/types/`. Use the top-level `types/` directory for app-specific state types that are not API contracts. Avoid introducing new types in the legacy `app/lib/types/` area unless extending code that already uses it.
- MSW response fixtures and handlers belong in `lib/mocks/fixtures.ts` and `lib/mocks/handlers.ts` respectively.
- Tests belong in `tests/` and follow the existing `*.test.ts` / `*.test.tsx` naming and Vitest setup.

Prefer extending a nearby feature module over creating a second implementation of an existing pattern. Keep presentation components focused and move reusable behavior into a hook only when it has more than one meaningful use or substantial lifecycle logic.

## Checks

Run these before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

`npm test` runs the Vitest unit and component suite in jsdom. You can run one test file with:

```bash
npx vitest run tests/payouts.test.ts
```

### End-to-End Checks

This repository does not currently define an automated browser E2E runner or an `e2e` package script. Do not treat `npm test` as an E2E run. For a manual browser smoke check, start the app with mock mode enabled (`NEXT_PUBLIC_USE_MOCKS=true`), then verify the affected user flow in the browser, including its loading, empty/error, success, and narrow-screen states where applicable. For flows that require signing or network access, use Stellar Testnet and a test wallet only.

If you add an automated E2E suite, include the runner, a documented setup command, and a package script (such as `npm run e2e`) in the same change.

## Pull Requests

Open a pull request against the default branch. Describe the user-visible change, link related issues, and list the checks you ran. Include screenshots or a short recording for UI changes. Call out environment or migration requirements, and note any checks you could not run. Use the repository pull request template as a checklist.
