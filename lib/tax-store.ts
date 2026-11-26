"use client";

/**
 * lib/tax-store.ts
 *
 * Merchant tax rates configured under Settings → Tax, persisted in
 * localStorage until the backend exposes a tax-rates endpoint.
 */

import { createLocalStore } from "@/lib/local-store";
import type { TaxRate } from "@/lib/tax";

export const taxRatesStore = createLocalStore<TaxRate[]>("facilpay.tax_rates", []);

export const useTaxRates = taxRatesStore.useStore;
