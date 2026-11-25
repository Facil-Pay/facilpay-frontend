"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { canAccessPath, hasPermission, type Permission, type Role } from "@/lib/permissions";
import type { Paginated, Payment, Refund } from "@/lib/types";

// ─── Commands ─────────────────────────────────────────────────────────────────

export type CommandGroup = "navigation" | "actions" | "payments" | "refunds" | "customers";

export interface PaletteCommand {
  id: string;
  group: CommandGroup;
  label: string;
  /** Secondary text shown under the label */
  hint?: string;
  /** Extra words that should match, e.g. synonyms */
  keywords?: string[];
  href: string;
}

export interface NavEntry {
  label: string;
  href: string;
}

/** Query parameter a page reads to open a quick action on arrival. */
export const QUICK_ACTION_PARAM = "action";

export type QuickActionId = "create-payment-link" | "new-payout" | "create-api-key";

interface QuickActionDef {
  id: QuickActionId;
  label: string;
  keywords: string[];
  permission: Permission;
  href: string;
}

export const QUICK_ACTIONS: readonly QuickActionDef[] = [
  {
    id: "create-payment-link",
    label: "Create payment link",
    keywords: ["checkout", "invoice", "request", "link"],
    permission: "payment-links:create",
    href: "/onboarding",
  },
  {
    id: "new-payout",
    label: "New payout",
    keywords: ["withdraw", "settle", "transfer", "cash out"],
    permission: "escrow:manage",
    href: `/payouts?${QUICK_ACTION_PARAM}=new-payout`,
  },
  {
    id: "create-api-key",
    label: "Create API key",
    keywords: ["developer", "token", "secret", "key"],
    permission: "developers:manage",
    href: `/developers/api-keys?${QUICK_ACTION_PARAM}=create-api-key`,
  },
];

/**
 * Static commands the current role may use: every reachable page plus the
 * quick actions its permissions allow. Hidden, not disabled, when denied.
 */
export function buildStaticCommands(
  navItems: readonly NavEntry[],
  role: Role | null | undefined,
  translate: (label: string) => string = (label) => label,
): PaletteCommand[] {
  const navigation = navItems
    .filter((item) => canAccessPath(role, item.href))
    .map<PaletteCommand>((item) => ({
      id: `nav:${item.href}`,
      group: "navigation",
      label: translate(item.label),
      hint: item.href,
      keywords: [item.label],
      href: item.href,
    }));

  const actions = QUICK_ACTIONS.filter((action) => hasPermission(role, action.permission)).map<PaletteCommand>(
    (action) => ({
      id: `action:${action.id}`,
      group: "actions",
      label: action.label,
      keywords: action.keywords,
      href: action.href,
    }),
  );

  return [...navigation, ...actions];
}

/**
 * Ranks commands against a query: prefix matches on the label first, then
 * word-start matches, then substring matches on label, hint or keywords.
 */
export function filterCommands(commands: readonly PaletteCommand[], query: string): PaletteCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...commands];
  const scored: { command: PaletteCommand; score: number; index: number }[] = [];
  commands.forEach((command, index) => {
    const label = command.label.toLowerCase();
    const haystack = [command.hint, ...(command.keywords ?? [])].join(" ").toLowerCase();
    let score = 0;
    if (label.startsWith(q)) score = 3;
    else if (label.split(/\s+/).some((word) => word.startsWith(q))) score = 2;
    else if (label.includes(q) || haystack.includes(q)) score = 1;
    if (score > 0) scored.push({ command, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((s) => s.command);
}

// ─── Record lookup ────────────────────────────────────────────────────────────

export const MIN_LOOKUP_LENGTH = 2;
const LOOKUP_PAGE_SIZE = 5;

export interface LookupResult {
  commands: PaletteCommand[];
  /** Sources that failed, so the UI can say results may be partial */
  failed: Array<"payments" | "refunds">;
}

function paymentCommand(payment: Payment): PaletteCommand {
  const customer = payment.sender.email || payment.sender.walletAddress || payment.sender.name;
  return {
    id: `payment:${payment.id}`,
    group: "payments",
    label: payment.reference || payment.id,
    hint: [`${payment.amount} ${payment.currency}`, payment.status, customer].filter(Boolean).join(" · "),
    href: `/payments/${encodeURIComponent(payment.id)}`,
  };
}

function refundCommand(refund: Refund): PaletteCommand {
  return {
    id: `refund:${refund.id}`,
    group: "refunds",
    label: refund.reference || refund.id,
    hint: `${refund.amount} ${refund.currency} · ${refund.status} · payment ${refund.paymentId}`,
    href: `/refunds?q=${encodeURIComponent(refund.id)}`,
  };
}

/** Customers are the distinct payers among matching payments. */
function customerCommands(payments: Payment[], query: string): PaletteCommand[] {
  const q = query.trim().toLowerCase();
  const seen = new Set<string>();
  const commands: PaletteCommand[] = [];
  for (const payment of payments) {
    const { email, walletAddress, name } = payment.sender;
    const identifier = [email, walletAddress].find((value) => value && value.toLowerCase().includes(q));
    if (!identifier || seen.has(identifier)) continue;
    seen.add(identifier);
    commands.push({
      id: `customer:${identifier}`,
      group: "customers",
      label: name || identifier,
      hint: identifier,
      href: `/customers/${encodeURIComponent(identifier)}`,
    });
  }
  return commands;
}

/**
 * Looks a payment, refund or customer up by ID, transaction hash, email or
 * Stellar address. Payments and refunds are queried in parallel; one source
 * failing still returns the other's results.
 */
export async function lookupRecords(query: string, signal?: AbortSignal): Promise<LookupResult> {
  const q = query.trim();
  if (q.length < MIN_LOOKUP_LENGTH) return { commands: [], failed: [] };

  const [payments, refunds] = await Promise.allSettled([
    apiClient.get<Paginated<Payment>>("/payments", {
      params: { search: q, page: 1, pageSize: LOOKUP_PAGE_SIZE },
      signal,
    }),
    apiClient.get<Paginated<Refund>>("/refunds", {
      params: { q, page: 1, pageSize: LOOKUP_PAGE_SIZE },
      signal,
    }),
  ]);

  if (signal?.aborted) throw new DOMException("Lookup aborted", "AbortError");

  const failed: LookupResult["failed"] = [];
  const paymentItems = payments.status === "fulfilled" ? payments.value.data ?? [] : (failed.push("payments"), []);
  const refundItems = refunds.status === "fulfilled" ? refunds.value.data ?? [] : (failed.push("refunds"), []);

  return {
    commands: [
      ...paymentItems.map(paymentCommand),
      ...refundItems.map(refundCommand),
      ...customerCommands(paymentItems, q),
    ],
    failed,
  };
}

// ─── Quick action deep links ──────────────────────────────────────────────────

/**
 * Runs `open` once if the page was reached with ?action=<id>, then removes
 * the parameter so a refresh does not reopen the dialog.
 */
export function useQuickAction(id: QuickActionId, open: () => void) {
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get(QUICK_ACTION_PARAM) !== id) return;
    url.searchParams.delete(QUICK_ACTION_PARAM);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    open();
    // Only the arrival URL matters; later `open` identities are irrelevant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
}
