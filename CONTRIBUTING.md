# Contributing to FacilPay

Thank you for your interest in contributing to FacilPay! We welcome contributions from developers of all skill levels. Whether you're fixing a bug, adding a new feature, improving documentation, or participating in a community bounty, this guide will help you get started quickly.

---

## Table of Contents
1. [Code of Conduct](#code-of-conduct)
2. [Getting Started & Local Setup](#getting-started--local-setup)
3. [Mock Mode (Offline / Backend-Free Dev)](#mock-mode-offline--backend-free-dev)
4. [Branch Naming Guidelines](#branch-naming-guidelines)
5. [Commit Message Guidelines (Conventional Commits)](#commit-message-guidelines-conventional-commits)
6. [Project Structure & Architecture Guidelines](#project-structure--architecture-guidelines)
   - [Where New Components Belong](#where-new-components-belong)
   - [Where Hooks Belong](#where-hooks-belong)
   - [Where Types Belong](#where-types-belong)
7. [Running Quality Checks & Tests](#running-quality-checks--tests)
   - [Linting](#linting)
   - [Type Checking](#type-checking)
   - [Unit & Integration Tests](#unit--integration-tests)
   - [End-to-End (E2E) Testing](#end-to-end-e2e-testing)
   - [Production Build](#production-build)
8. [Pull Request Workflow](#pull-request-workflow)
9. [Bounties & Payouts](#bounties--payouts)

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and constructive in all issues, pull requests, discussions, and community channels.

---

## Getting Started & Local Setup

### Prerequisites
Ensure you have the following installed on your machine:
- **Node.js**: `v18.0.0` or higher (Node 20 LTS recommended)
- **npm**: `v9.0.0` or higher (or `pnpm` / `yarn`)
- **Git**

### Installation

1. **Fork the repository** on GitHub to your personal account.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/facilpay-frontend.git
   cd facilpay-frontend
   ```
3. **Add upstream remote** to keep your local branch in sync:
   ```bash
   git remote add upstream https://github.com/Facil-Pay/facilpay-frontend.git
   git fetch upstream
   ```
4. **Install dependencies**:
   ```bash
   npm install
   ```
5. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Inspect `.env.local` and adjust variables as necessary. All `NEXT_PUBLIC_*` environment variables are strictly validated by Zod schema at runtime (`lib/env.ts`).

6. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Mock Mode (Offline / Backend-Free Dev)

FacilPay includes Mock Service Worker (MSW) integration. This allows full frontend development, state testing, and UI validation without running a live backend or connecting to live Stellar nodes.

To enable Mock Mode, ensure the following is set in `.env.local`:
```env
NEXT_PUBLIC_USE_MOCKS=true
```

When enabled:
- Browser requests to API endpoints (e.g. `/api/v1/payments`, `/api/v1/balances`) are intercepted by MSW handlers defined in `lib/mocks/`.
- Mock data replicates real backend responses, error states, and pagination.

---

## Branch Naming Guidelines

Use descriptive branch names prefixed with the type of work being performed and referencing the associated GitHub issue number when applicable:

- `feat/<issue-number>-<short-description>`: New features or capabilities (e.g., `feat/44-ci-pipeline`)
- `fix/<issue-number>-<short-description>`: Bug fixes (e.g., `fix/32-login-redirect`)
- `docs/<issue-number>-<short-description>`: Documentation changes (e.g., `docs/51-contributing-guide`)
- `refactor/<issue-number>-<short-description>`: Code changes that neither fix bugs nor add features
- `test/<issue-number>-<short-description>`: Adding or improving tests
- `chore/<issue-number>-<short-description>`: Build tasks, package updates, tool configs

---

## Commit Message Guidelines (Conventional Commits)

We enforce the [Conventional Commits](https://www.conventionalcommits.org/) specification for clear, scannable git history.

### Commit Format
```text
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

### Allowed Types
- **`feat`**: A new feature for the user or developer
- **`fix`**: A bug fix
- **`docs`**: Documentation only changes
- **`style`**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc.)
- **`refactor`**: Code changes that neither fix a bug nor add a feature
- **`perf`**: Code changes that improve performance
- **`test`**: Adding missing tests or correcting existing tests
- **`build`**: Changes that affect the build system or external dependencies
- **`ci`**: Changes to CI configuration files and scripts (e.g. GitHub Actions)
- **`chore`**: Other changes that do not modify `src` or test files

### Examples
- `feat(payments): add multi-currency QR code generation`
- `fix(auth): prevent session timeout loop on token refresh`
- `docs(readme): add contributing guide and issue templates`
- `ci: add GitHub Actions workflow for lint, typecheck, tests and build`

---

## Project Structure & Architecture Guidelines

Understanding where files belong ensures clean separation of concerns and maintainability across the codebase:

```text
facilpay-frontend/
├── app/                  # Next.js App Router (pages, layouts, routes)
│   ├── (auth)/           # Authentication route group (login, register)
│   ├── (dashboard)/      # Merchant dashboard route group
│   └── api/              # Route handlers / proxy endpoints
├── components/           # UI components
│   ├── ui/               # Reusable primitives (buttons, dialogs, inputs, toasts)
│   ├── payments/         # Payment domain components (tables, details, modals)
│   ├── analytics/        # Charting & metrics visualizations
│   ├── webhooks/         # Webhook management and payload inspector components
│   └── layout/           # Header, sidebar, navigation, theme toggle
├── lib/                  # Shared libraries, utilities, clients
│   ├── api/              # API client, query key factories, and hooks
│   │   ├── client.ts     # Axios / fetch instance and interceptors
│   │   ├── keys.ts       # Query key factories for React Query
│   │   └── hooks/        # React Query hooks for fetching and mutations
│   ├── mocks/            # MSW mock server and handlers
│   ├── stellar/          # Stellar Horizon and Soroban smart contract bindings
│   └── validation/       # Zod schemas for input and API validation
├── types/                # Domain-wide TypeScript type definitions
└── tests/                # Unit and integration test suites
```

### Where New Components Belong
- **Reusable Primitives (`components/ui/`)**: Generic, headless or Radix-based UI building blocks (e.g., `badge.tsx`, `modal.tsx`).
- **Domain/Feature Components (`components/<feature>/`)**: Business-specific components grouped by domain:
  - `components/payments/`: Payment tables, receipts, status chips
  - `components/payouts/`: Escrow release, withdrawal triggers
  - `components/webhooks/`: Endpoint creation, delivery log viewers
  - `components/wallet/`: Freighter wallet connect modals, balance indicators

### Where Hooks Belong
- **API Data-Fetching & Mutation Hooks (`lib/api/hooks/`)**: Custom React Query hooks (e.g., `usePayments`, `useRefundPayment`). Pair queries with key factories in `lib/api/keys.ts`.
- **Utility / Browser Hooks (`lib/hooks/` or `lib/utils/`)**: Generic UI hooks (e.g., `useDebounce`, `useMediaQuery`, `useLocalStorage`).

### Where Types Belong
- **Cross-Cutting Domain Types (`types/`)**: Shared interfaces and data models (e.g., `types/payments.ts`, `types/webhooks.ts`, `types/onboarding.ts`).
- **Internal / Module-Specific Types (`lib/types/` or co-located with schemas)**: Types strictly coupled to a specific validation schema or API client module.

---

## Running Quality Checks & Tests

Before opening a pull request, verify that all local checks pass:

### Linting
Run ESLint to check for code style and syntax issues:
```bash
npm run lint
```

### Type Checking
Run the TypeScript compiler to ensure there are no typing errors:
```bash
npx tsc --noEmit
```

### Unit & Integration Tests
We use [Vitest](https://vitest.dev/) for fast unit and component testing:
```bash
# Run all unit tests
npm test

# Run tests in watch mode
npx vitest

# Run a specific test file
npx vitest tests/payments.test.ts
```

### End-to-End (E2E) Testing
For user workflow and browser automation testing:
- When writing E2E tests, place them under `tests/e2e/` (using Playwright / Vitest browser mode).
- Ensure your tests test end-to-end scenarios against Mock Mode (`NEXT_PUBLIC_USE_MOCKS=true`) to avoid external network dependencies.

### Production Build
Verify that the production Next.js bundle compiles cleanly:
```bash
npm run build
```

---

## Pull Request Workflow

1. **Keep PRs Focused**: Each pull request should address a single concern or issue.
2. **Sync with Upstream**: Before creating your PR, rebase against upstream:
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```
3. **Push to Your Fork**:
   ```bash
   git push origin <your-branch-name>
   ```
4. **Open Pull Request**:
   - Open a PR against `Facil-Pay/facilpay-frontend` `main` branch.
   - Fill out all sections of the [Pull Request Template](.github/pull_request_template.md).
   - Link the relevant issue (e.g., `Closes #51`).
   - Attach screenshots or GIFs for any UI changes.
5. **Review & Revisions**: Address review feedback promptly. Squash or fix commits as needed until CI passes green.

---

## Bounties & Payouts

If you are contributing under a Stellar Wave, GitHub bounty, or community grant:
- State the linked bounty issue in your PR description.
- Include your preferred payout address (Stellar Account G... or EVM / Base L2 0x...) in the pull request description using the PR template field.
- Ensure all CI tests pass and acceptance criteria are fully met.
