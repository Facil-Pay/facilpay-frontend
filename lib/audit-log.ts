"use client";

import { createLocalStore } from "./local-store";
import type { Role } from "./permissions";

export type AuditCategory =
  | "all"
  | "auth"
  | "api_key"
  | "webhook"
  | "team"
  | "payout"
  | "settings";

export type AuditActionType =
  | "auth.login"
  | "auth.logout"
  | "api_key.created"
  | "api_key.rolled"
  | "api_key.revoked"
  | "webhook.created"
  | "webhook.updated"
  | "webhook.deleted"
  | "webhook.test_sent"
  | "team.member_invited"
  | "team.member_removed"
  | "team.role_updated"
  | "payout.created"
  | "payout.approved"
  | "settings.branding_updated"
  | "settings.preferences_updated"
  | "settings.security_updated";

export interface AuditActor {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuditEvent {
  id: string;
  actor: AuditActor;
  action: AuditActionType;
  actionLabel: string;
  category: AuditCategory;
  target: string;
  ipAddress: string;
  timestamp: string;
  details?: string;
}

export interface AuditFilterState {
  searchQuery: string;
  category: AuditCategory;
  dateRange: "all" | "today" | "7d" | "30d";
}

const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: "evt_01JAD4K92M8V2R7F8Q01A",
    actor: {
      id: "u_owner",
      name: "Merchant Owner",
      email: "owner@facilpay.io",
      role: "owner",
    },
    action: "payout.created",
    actionLabel: "Payout Initiated",
    category: "payout",
    target: "$2,450.00 USDC to GDQP...RVSQF",
    ipAddress: "198.51.100.42",
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
    details: "Initiated automated Soroban escrow settlement release",
  },
  {
    id: "evt_01JAD3H81N7C1Q6E7P90B",
    actor: {
      id: "u_admin",
      name: "Alex Administrator",
      email: "alex@facilpay.io",
      role: "admin",
    },
    action: "api_key.rolled",
    actionLabel: "API Key Rolled",
    category: "api_key",
    target: "pk_live_89f...2d (Production Main)",
    ipAddress: "203.0.113.15",
    timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(), // ~1.8h ago
    details: "Rotated live key with 48h expiration grace period",
  },
  {
    id: "evt_01JAD2A70M6B0P5D6O89C",
    actor: {
      id: "u_owner",
      name: "Merchant Owner",
      email: "owner@facilpay.io",
      role: "owner",
    },
    action: "team.role_updated",
    actionLabel: "Team Role Changed",
    category: "team",
    target: "dana@facilpay.io -> Developer",
    ipAddress: "198.51.100.42",
    timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(), // 4h ago
    details: "Promoted team member permissions from viewer to developer",
  },
  {
    id: "evt_01JAD1Z69L5A9O4C5N78D",
    actor: {
      id: "u_admin",
      name: "Alex Administrator",
      email: "alex@facilpay.io",
      role: "admin",
    },
    action: "webhook.updated",
    actionLabel: "Webhook Endpoint Updated",
    category: "webhook",
    target: "https://api.merchant.com/v1/payments/webhook",
    ipAddress: "203.0.113.15",
    timestamp: new Date(Date.now() - 1000 * 60 * 380).toISOString(), // 6.3h ago
    details: "Subscribed to payment.completed, refund.created, payout.failed",
  },
  {
    id: "evt_01JAC9Y58K4Z8N3B4M67E",
    actor: {
      id: "u_owner",
      name: "Merchant Owner",
      email: "owner@facilpay.io",
      role: "owner",
    },
    action: "settings.branding_updated",
    actionLabel: "Branding Settings Updated",
    category: "settings",
    target: "Checkout Theme & Accent Color",
    ipAddress: "198.51.100.42",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(), // 18h ago
    details: "Updated logo asset and set brand primary to #55C2FF",
  },
  {
    id: "evt_01JAC8X47J3Y7M2A3L56F",
    actor: {
      id: "u_owner",
      name: "Merchant Owner",
      email: "owner@facilpay.io",
      role: "owner",
    },
    action: "auth.login",
    actionLabel: "Successful Login",
    category: "auth",
    target: "Web Dashboard Session",
    ipAddress: "198.51.100.42",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(), // 22h ago
    details: "Freighter wallet signature authentication (Stellar account verified)",
  },
  {
    id: "evt_01JAC7W36I2X6L1Z2K45G",
    actor: {
      id: "u_admin",
      name: "Alex Administrator",
      email: "alex@facilpay.io",
      role: "admin",
    },
    action: "api_key.created",
    actionLabel: "New API Key Created",
    category: "api_key",
    target: "pk_live_staging_77a...9c",
    ipAddress: "203.0.113.15",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), // 1.5 days ago
    details: "Generated restricted API key for automated CI/CD pipeline",
  },
  {
    id: "evt_01JAC6V25H1W5K0Y1J34H",
    actor: {
      id: "u_owner",
      name: "Merchant Owner",
      email: "owner@facilpay.io",
      role: "owner",
    },
    action: "team.member_invited",
    actionLabel: "Team Member Invited",
    category: "team",
    target: "sam@facilpay.io (Support)",
    ipAddress: "198.51.100.42",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    details: "Dispatched invitation link with support role permissions",
  },
  {
    id: "evt_01JAC5U14G0V4J9X0I23I",
    actor: {
      id: "u_admin",
      name: "Alex Administrator",
      email: "alex@facilpay.io",
      role: "admin",
    },
    action: "webhook.created",
    actionLabel: "Webhook Endpoint Created",
    category: "webhook",
    target: "https://ops.merchant.com/stellar-events",
    ipAddress: "203.0.113.15",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    details: "Registered new webhook destination with SHA-256 HMAC secret",
  },
  {
    id: "evt_01JAC4T03F9U3I8W9H12J",
    actor: {
      id: "u_owner",
      name: "Merchant Owner",
      email: "owner@facilpay.io",
      role: "owner",
    },
    action: "settings.security_updated",
    actionLabel: "Security Policy Updated",
    category: "settings",
    target: "Session Timeout & IP Allowlist",
    ipAddress: "198.51.100.42",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(), // 4 days ago
    details: "Enforced strict 2-hour idle session timeout policy across team",
  },
  {
    id: "evt_01JAC3S92E8T2H7V8G01K",
    actor: {
      id: "u_owner",
      name: "Merchant Owner",
      email: "owner@facilpay.io",
      role: "owner",
    },
    action: "api_key.revoked",
    actionLabel: "API Key Revoked",
    category: "api_key",
    target: "pk_test_legacy_31b...aa",
    ipAddress: "198.51.100.42",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(), // 5 days ago
    details: "Permanently revoked deprecated testnet key",
  },
];

interface AuditLogState {
  events: AuditEvent[];
}

export const auditLogStore = createLocalStore<AuditLogState>("facilpay_audit_log", {
  events: INITIAL_AUDIT_EVENTS,
});

export function useAuditLog() {
  return auditLogStore.useStore();
}

/**
 * Filter audit events based on search query, category, and date range.
 */
export function filterAuditEvents(
  events: AuditEvent[],
  filters: AuditFilterState,
  now: number = Date.now(),
): AuditEvent[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return events.filter((evt) => {
    // Filter by category
    if (filters.category !== "all" && evt.category !== filters.category) {
      return false;
    }

    // Filter by date range
    if (filters.dateRange !== "all") {
      const eventTime = new Date(evt.timestamp).getTime();
      const diffMs = now - eventTime;
      const oneDayMs = 24 * 60 * 60 * 1000;

      if (filters.dateRange === "today" && diffMs > oneDayMs) {
        return false;
      }
      if (filters.dateRange === "7d" && diffMs > 7 * oneDayMs) {
        return false;
      }
      if (filters.dateRange === "30d" && diffMs > 30 * oneDayMs) {
        return false;
      }
    }

    // Filter by text search (actor name, email, role, action, target, IP)
    if (query) {
      const matchName = evt.actor.name.toLowerCase().includes(query);
      const matchEmail = evt.actor.email.toLowerCase().includes(query);
      const matchRole = evt.actor.role.toLowerCase().includes(query);
      const matchAction = evt.actionLabel.toLowerCase().includes(query);
      const matchTarget = evt.target.toLowerCase().includes(query);
      const matchIp = evt.ipAddress.toLowerCase().includes(query);

      if (!matchName && !matchEmail && !matchRole && !matchAction && !matchTarget && !matchIp) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Format events as CSV string
 */
export function generateAuditLogCsv(events: AuditEvent[]): string {
  const headers = ["Timestamp", "Actor Name", "Actor Email", "Actor Role", "Action", "Target", "IP Address", "Details"];

  const escapeCell = (val: string | undefined | null) => {
    if (val === undefined || val === null) return '""';
    const clean = String(val).replace(/"/g, '""');
    return `"${clean}"`;
  };

  const rows = events.map((e) => [
    escapeCell(e.timestamp),
    escapeCell(e.actor.name),
    escapeCell(e.actor.email),
    escapeCell(e.actor.role),
    escapeCell(e.actionLabel),
    escapeCell(e.target),
    escapeCell(e.ipAddress),
    escapeCell(e.details ?? ""),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Trigger browser download of CSV file
 */
export function exportAuditLogsToCsv(events: AuditEvent[], filename?: string): void {
  const csvContent = generateAuditLogCsv(events);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `facilpay_audit_log_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
