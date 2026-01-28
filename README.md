# facilpay-frontend
Merchant dashboard for FacilPay. Manage payments, view analytics, configure webhooks, and handle refunds through an intuitive web interface.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Development Workflow](#development-workflow)
- [Environment Variables](#environment-variables)
- [Running the App](#running-the-app)
- [Contribution](#contribution)
---

## Project Overview

This project is a **production-ready Next.js 14+ application** built with TypeScript and modern tooling.  
It serves as the foundation for:

- Payment management
- Analytics dashboards
- Webhooks handling
- Refund management

The frontend leverages:

- **Next.js 14+ App Router** for routing and server-side rendering
- **TypeScript** with strict mode for type safety
- **Tailwind CSS** for responsive and scalable styling


---

## Prerequisites

- **Node.js:** version 18 or higher  
- **Package manager:** npm or pnpm  
- **Git** for version control

---

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/facilpay-frontend.git
cd facilpay-frontend
````

2. Install dependencies:

```bash
npm install
# or
pnpm install
```

3. Create `.env.local` from the example:

```bash
cp .env.local.example .env.local
```

4. Fill in the required environment variables (see [Environment Variables](#environment-variables)).

---

## Development Workflow

Start the development server:

```bash
npm run dev
# or
pnpm dev
```

* Visit [http://localhost:3000](http://localhost:3000)
* Hot-reloading enabled for fast development
* TypeScript strict mode ensures early detection of errors

---

## Environment Variables

Create `.env.local` with the following content:

```env
# Stellar Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Contract Addresses (to be filled)
NEXT_PUBLIC_PAYMENT_CONTRACT_ID=
NEXT_PUBLIC_ESCROW_CONTRACT_ID=
NEXT_PUBLIC_REFUND_CONTRACT_ID=

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> ⚠️ **Do not commit `.env.local`**. Only commit `.env.local.example`.

---

## Running the App

* **Development:** `npm run dev` or `pnpm dev`
* **Production build:** `npm run build`
* **Start production server:** `npm start`

---


## Contribution

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch:

```bash
git checkout -b feat/your-feature
```

3. Make changes and commit:

```bash
git commit -m "feat: add feature description"
```

4. Push your branch:

```bash
git push origin feat/your-feature
```

5. Open a pull request.


- Telegram: https://t.me/+afM9uh7GGtVkYmZk
