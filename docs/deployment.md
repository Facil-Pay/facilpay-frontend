# Deployment Guide

This guide takes you from a fresh clone to a deployed FacilPay merchant dashboard. It covers two options:

- [Vercel](#option-a--vercel) (recommended for previews)
- [Docker / self-hosted](#option-b--docker--self-hosted)

It also lists the [environment variables each environment needs](#environment-variables-per-environment), explains the [security headers and CSP](#security-headers--csp), and ends with a [mainnet go-live checklist](#mainnet-checklist).

---

## 1. Before you start

You need:

- **Node.js 22** (CI uses 22; Node 18 or later works) and **npm 9 or later**
- **Git**
- A **Vercel account** (Option A) or a host with **Docker** (Option B)
- For staging and production: a running FacilPay backend API. A preview can run without one by using mock mode.

Clone and install:

```bash
git clone https://github.com/Facil-Pay/facilpay-frontend.git
cd facilpay-frontend
npm ci
cp .env.example .env.local
```

Check that the project builds locally with the same settings CI uses:

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm start            # serves the production build at http://localhost:3000
```

> **`NEXT_PUBLIC_*` values are baked in at build time.** Next.js inlines every `NEXT_PUBLIC_*` variable into the client bundle when you run `next build`. If you change one, you must **rebuild and redeploy**. Restarting the server is not enough. Never put secrets in a `NEXT_PUBLIC_*` variable, because anyone can read them in the browser.

---

## 2. Environment variables per environment

Every variable is validated with Zod in [`lib/env.ts`](../lib/env.ts). If a required variable is missing or malformed, the build or startup fails with a clear message. [`.env.example`](../.env.example) is the template.

| Variable | Required | Preview (mock mode) | Staging (testnet) | Production (mainnet) |
|---|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | `http://localhost:4000/api/v1` (intercepted by mocks) | `https://api-staging.<your-domain>/api/v1` | `https://api.<your-domain>/api/v1` |
| `NEXT_PUBLIC_AUTH_LOGOUT_URL` | ✅ | `https://<preview-url>/login` | `https://staging.<your-domain>/login` | `https://dashboard.<your-domain>/login` |
| `NEXT_PUBLIC_STELLAR_NETWORK` | ✅ | `testnet` | `testnet` | `mainnet` |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | ✅ | `https://horizon-testnet.stellar.org` | `https://horizon-testnet.stellar.org` | `https://horizon.stellar.org` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | ✅ | `https://soroban-testnet.stellar.org` | `https://soroban-testnet.stellar.org` | your mainnet Soroban RPC provider |
| `NEXT_PUBLIC_PAYMENT_CONTRACT_ID` | optional | empty | testnet contract `C…` | mainnet contract `C…` |
| `NEXT_PUBLIC_ESCROW_CONTRACT_ID` | optional | empty | testnet contract `C…` | mainnet contract `C…` |
| `NEXT_PUBLIC_REFUND_CONTRACT_ID` | optional | empty | testnet contract `C…` | mainnet contract `C…` |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://<preview-url>` | `https://staging.<your-domain>` | `https://dashboard.<your-domain>` |
| `NEXT_PUBLIC_USE_MOCKS` | optional (default `false`) | `true` | `false` | **`false`** |

Notes:

- **Preview** deployments with `NEXT_PUBLIC_USE_MOCKS=true` need no backend. MSW serves fixture data from [`lib/mocks/handlers.ts`](../lib/mocks/handlers.ts) through `public/mockServiceWorker.js`. The CI build job uses exactly these values (see [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)).
- An empty contract ID disables that Soroban feature, so leave a contract ID blank until it is deployed on the target network.
- `NEXT_PUBLIC_APP_URL` is used for absolute links and QR codes on payment links, so it must be the public URL customers will open.

---

## Option A — Vercel

### Deploy a preview

1. Push your branch to GitHub (a fork is fine).
2. In Vercel, choose **Add New… → Project** and import the repository.
3. Vercel detects **Next.js** automatically. Keep the defaults:
   - Install command: `npm ci` (or the default `npm install`)
   - Build command: `npm run build`
   - Output: Next.js default
   - Node.js version: **22.x** (Project → Settings → General)
4. Under **Environment Variables**, add every variable from the **Preview (mock mode)** column in [section 2](#2-environment-variables-per-environment). Scope them to **Preview**. For `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_AUTH_LOGOUT_URL`, use your project's stable preview domain (for example `https://facilpay-frontend-git-<branch>-<team>.vercel.app`) or the production domain you will assign.
5. Click **Deploy**. When the build finishes, open the URL. You should see the dashboard with mock data, and the network banner should show test mode.

From then on, every pull request gets its own preview deployment.

### Promote to staging and production

1. Add a second set of variables scoped to **Production**, using the **Production (mainnet)** column. You can use a separate Vercel project, or the Preview scope with testnet values, for staging.
2. Assign your custom domain under **Settings → Domains**.
3. Redeploy after any change to a `NEXT_PUBLIC_*` variable, because the values are compiled into the build.

`next.config.ts` already sends the security headers on Vercel. No `vercel.json` is required.

---

## Option B — Docker / self-hosted

The app runs as a standard Node server (`next build` followed by `next start`) on port 3000.

### Dockerfile

Create a `Dockerfile` in the repository root:

```dockerfile
# ---- deps ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts skips the husky "prepare" hook, which needs .git
RUN npm ci --ignore-scripts

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* values are inlined at build time, so pass them as build args
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_AUTH_LOGOUT_URL
ARG NEXT_PUBLIC_STELLAR_NETWORK=testnet
ARG NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
ARG NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
ARG NEXT_PUBLIC_PAYMENT_CONTRACT_ID=
ARG NEXT_PUBLIC_ESCROW_CONTRACT_ID=
ARG NEXT_PUBLIC_REFUND_CONTRACT_ID=
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_USE_MOCKS=false
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_AUTH_LOGOUT_URL=$NEXT_PUBLIC_AUTH_LOGOUT_URL \
    NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK \
    NEXT_PUBLIC_STELLAR_HORIZON_URL=$NEXT_PUBLIC_STELLAR_HORIZON_URL \
    NEXT_PUBLIC_SOROBAN_RPC_URL=$NEXT_PUBLIC_SOROBAN_RPC_URL \
    NEXT_PUBLIC_PAYMENT_CONTRACT_ID=$NEXT_PUBLIC_PAYMENT_CONTRACT_ID \
    NEXT_PUBLIC_ESCROW_CONTRACT_ID=$NEXT_PUBLIC_ESCROW_CONTRACT_ID \
    NEXT_PUBLIC_REFUND_CONTRACT_ID=$NEXT_PUBLIC_REFUND_CONTRACT_ID \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    NEXT_PUBLIC_USE_MOCKS=$NEXT_PUBLIC_USE_MOCKS \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---- run ----
FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000
# Copy the full build output. Dev dependencies are kept so `next start` can load next.config.ts.
COPY --from=build --chown=node:node /app ./
USER node
EXPOSE 3000
CMD ["npm", "start"]
```

Add a `.dockerignore` so local files stay out of the image:

```
node_modules
.next
.git
.env*
!.env.example
coverage
playwright-report
test-results
```

### Build and run a preview

```bash
docker build -t facilpay-dashboard \
  --build-arg NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1 \
  --build-arg NEXT_PUBLIC_AUTH_LOGOUT_URL=http://localhost:3000/login \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  --build-arg NEXT_PUBLIC_USE_MOCKS=true \
  .

docker run --rm -p 3000:3000 facilpay-dashboard
```

Open http://localhost:3000. For staging or production, build a separate image with that environment's values from [section 2](#2-environment-variables-per-environment).

### Without Docker

On any Linux host with Node 22:

```bash
npm ci --ignore-scripts
# export the NEXT_PUBLIC_* variables for this environment first, or put them in .env.production.local
npm run build
PORT=3000 npm start
```

Keep the process running with a supervisor such as systemd or pm2.

### Reverse proxy

Put the Node server behind a TLS-terminating proxy (nginx, Caddy, Traefik or a cloud load balancer):

- Serve **HTTPS only**. The app sends `Strict-Transport-Security` with `preload`.
- Forward `Host` and `X-Forwarded-*` headers, and proxy WebSocket upgrades.
- Don't strip or override the security headers set by Next.js (see below). If the proxy adds its own CSP, the browser enforces both policies, which usually breaks the app.

---

## Security headers / CSP

Headers are defined in [`next.config.ts`](../next.config.ts) and apply on every host.

| Route | Policy |
|---|---|
| `/:path*` (dashboard) | `X-Frame-Options: DENY`, `frame-ancestors 'none'`. The dashboard cannot be embedded. |
| `/checkout/:path*`, `/pay/:path*` | `frame-ancestors *`, so merchants can embed the hosted checkout in an iframe. There is no `X-Frame-Options` header. |

Both policies send HSTS (2 years, `includeSubDomains; preload`), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a restrictive `Permissions-Policy`.

**`connect-src` must allow every origin the browser calls.** The default list covers Stellar's public Horizon and Soroban endpoints, Friendbot, stellar.expert, DiceBear and the Albedo and xBull wallets. When you deploy, make these changes:

- **Add your API origin** (`NEXT_PUBLIC_API_BASE_URL`) to `connect-src` in **both** header lists. Otherwise every API call is blocked by CSP in staging and production. Mock mode is unaffected because MSW intercepts requests inside the page.
- If you use a third-party Horizon or Soroban RPC provider, add its origin as well.
- For mainnet, remove testnet-only origins (`horizon-testnet.stellar.org`, `soroban-testnet.stellar.org`, `friendbot.stellar.org`) if you want the tightest policy.
- `script-src` currently allows `'unsafe-eval'` and `'unsafe-inline'`, which Next.js dev tooling and some wallet SDKs need. Moving to a nonce-based CSP is recommended hardening for production.

Check the headers on a deployment with:

```bash
curl -sI https://<your-deployment>/overview | grep -iE 'content-security|strict-transport|x-frame'
curl -sI https://<your-deployment>/pay/test | grep -iE 'content-security|x-frame'
```

---

## Mainnet checklist

Work through this list before pointing production at mainnet:

- [ ] `NEXT_PUBLIC_STELLAR_NETWORK=mainnet`
- [ ] `NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon.stellar.org` (or your mainnet Horizon provider)
- [ ] `NEXT_PUBLIC_SOROBAN_RPC_URL` points at a **mainnet** RPC provider
- [ ] `NEXT_PUBLIC_USE_MOCKS=false`, so no fixture data is served in production
- [ ] Payment, escrow and refund contract IDs are the **mainnet** deployments. Confirm the ABI against the deployed contracts, as described in the README's refund flow section.
- [ ] `NEXT_PUBLIC_API_BASE_URL` is the production API over HTTPS, and its origin is in CSP `connect-src`
- [ ] `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_AUTH_LOGOUT_URL` use the production domain over HTTPS
- [ ] The production build was rebuilt after the final environment change
- [ ] Security headers are present on `/overview` and `/pay/*` (see the `curl` checks above)
- [ ] The test-mode banner is not shown, and the Friendbot funding button is hidden on Balances
- [ ] A small real payment end-to-end succeeds, and its transaction appears on [stellar.expert](https://stellar.expert/explorer/public)
- [ ] A refund on that payment succeeds
- [ ] 2FA is enabled for every owner and admin account (Settings → Security)
- [ ] Webhook endpoints use HTTPS, and their signing secrets are stored on the receiving server
- [ ] Error monitoring and uptime checks are in place for the dashboard URL

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| Build fails with `NEXT_PUBLIC_… must be a valid URL` | A required variable is missing or malformed. Compare against [section 2](#2-environment-variables-per-environment). |
| The page shows "Starting mock service…" forever | `public/mockServiceWorker.js` is not being served. Check that `public/` is deployed and not blocked by the proxy. |
| API calls fail with a CSP error in the console | Add the API origin to `connect-src` in `next.config.ts`, then rebuild. |
| A changed variable has no effect | `NEXT_PUBLIC_*` values are build-time. Rebuild and redeploy. |
| The checkout won't load inside a merchant iframe | Embed `/pay/…` or `/checkout`, not dashboard routes, which send `frame-ancestors 'none'`. |
