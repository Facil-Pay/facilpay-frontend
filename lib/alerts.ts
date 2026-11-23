"use client";

import { createLocalStore } from "./local-store";

export type AlertProvider = "slack" | "discord";

export const PROVIDER_LABELS: Record<AlertProvider, string> = {
  slack: "Slack",
  discord: "Discord",
};

/** Incoming-webhook hosts accepted for each provider. */
const PROVIDER_HOSTS: Record<AlertProvider, readonly string[]> = {
  slack: ["hooks.slack.com"],
  discord: ["discord.com", "discordapp.com", "canary.discord.com", "ptb.discord.com"],
};

/** Path prefix every incoming-webhook URL for a provider starts with. */
const PROVIDER_PATH_PREFIX: Record<AlertProvider, string> = {
  slack: "/services/",
  discord: "/api/webhooks/",
};

export const ALERT_CATEGORIES = {
  payment: { label: "Payments", description: "Payments received, completed and failed." },
  refund: { label: "Refunds", description: "Refunds created, completed and failed." },
  payout: { label: "Payouts", description: "Payouts sent to external accounts." },
} as const;

export type AlertCategory = keyof typeof ALERT_CATEGORIES;

export const ALERT_CATEGORY_LIST = Object.keys(ALERT_CATEGORIES) as AlertCategory[];

export interface AlertIntegration {
  id: string;
  provider: AlertProvider;
  /** Incoming webhook URL copied from the Slack or Discord app. */
  webhookUrl: string;
  /** Friendly name shown in the dashboard. */
  label: string;
  enabled: boolean;
  categories: AlertCategory[];
  /** ISO 8601 timestamp of the last alert (or test alert) delivered. */
  lastDeliveryAt: string | null;
}

export const DEFAULT_ALERT_INTEGRATIONS: AlertIntegration[] = [];

/** Persisted in localStorage, matching the notification preferences store. */
export const alertStore = createLocalStore<AlertIntegration[]>(
  "facilpay_alert_integrations",
  DEFAULT_ALERT_INTEGRATIONS
);

export const useAlertIntegrations = alertStore.useStore;

/** Generates an id for a new integration. */
export function newAlertIntegrationId(): string {
  return `alert_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export interface AlertUrlValidation {
  valid: boolean;
  provider: AlertProvider | null;
  normalized: string;
  error?: string;
}

/** Detects the provider from an incoming-webhook URL, or null when unrecognised. */
export function detectAlertProvider(raw: string): AlertProvider | null {
  let host: string;
  try {
    host = new URL(raw.trim()).hostname.toLowerCase();
  } catch {
    return null;
  }
  return (
    (Object.keys(PROVIDER_HOSTS) as AlertProvider[]).find((provider) =>
      PROVIDER_HOSTS[provider].includes(host)
    ) ?? null
  );
}

/**
 * Validates a Slack/Discord incoming webhook URL. When `expected` is provided the
 * URL must belong to that provider (e.g. the selected provider).
 */
export function validateAlertWebhookUrl(raw: string, expected?: AlertProvider): AlertUrlValidation {
  const value = raw.trim();
  if (!value) {
    return { valid: false, provider: null, normalized: value, error: "Enter an incoming webhook URL." };
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { valid: false, provider: null, normalized: value, error: "That doesn't look like a valid URL." };
  }

  if (url.protocol !== "https:") {
    return { valid: false, provider: null, normalized: value, error: "Webhook URLs must start with https://." };
  }

  const provider = detectAlertProvider(value);
  if (!provider) {
    return {
      valid: false,
      provider: null,
      normalized: value,
      error: "Only Slack and Discord incoming webhook URLs are supported.",
    };
  }

  if (!url.pathname.startsWith(PROVIDER_PATH_PREFIX[provider])) {
    return {
      valid: false,
      provider,
      normalized: value,
      error: `A ${PROVIDER_LABELS[provider]} webhook URL looks like https://${PROVIDER_HOSTS[provider][0]}${PROVIDER_PATH_PREFIX[provider]}…`,
    };
  }

  if (expected && expected !== provider) {
    return {
      valid: false,
      provider,
      normalized: value,
      error: `This is a ${PROVIDER_LABELS[provider]} URL, but ${PROVIDER_LABELS[expected]} is selected.`,
    };
  }

  return { valid: true, provider, normalized: value };
}

/** Masks the secret part of a webhook URL so it is safe to render on screen. */
export function maskWebhookUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length === 0) return url.origin;
    const masked = segments.map((segment, index) =>
      index === segments.length - 1 ? maskSegment(segment) : segment
    );
    return `${url.origin}/${masked.join("/")}`;
  } catch {
    return raw;
  }
}

function maskSegment(segment: string): string {
  if (segment.length <= 4) return "•".repeat(segment.length);
  return `••••••••${segment.slice(-4)}`;
}

export interface AlertPayload {
  category: AlertCategory;
  title: string;
  message: string;
  /** Formatted amount, e.g. "250.00 USDC". */
  amount?: string;
  /** Payment / refund / payout reference. */
  reference?: string;
  /** Deep link back into the dashboard. */
  url?: string;
  /** ISO 8601 timestamp of the underlying event. */
  timestamp: string;
}

export interface SlackMessage {
  text: string;
  blocks: Record<string, unknown>[];
}

export interface DiscordMessage {
  content: string;
  embeds: Record<string, unknown>[];
}

const CATEGORY_COLORS: Record<AlertCategory, number> = {
  payment: 0x20a7ee,
  refund: 0xf59e0b,
  payout: 0x10b981,
};

/** Builds a Slack Block Kit payload for an incoming webhook. */
export function buildSlackPayload(alert: AlertPayload, merchant = "FacilPay"): SlackMessage {
  const fields: Record<string, unknown>[] = [
    { type: "mrkdwn", text: `*Category:*\n${ALERT_CATEGORIES[alert.category].label}` },
  ];
  if (alert.amount) fields.unshift({ type: "mrkdwn", text: `*Amount:*\n${alert.amount}` });
  if (alert.reference) fields.push({ type: "mrkdwn", text: `*Reference:*\n${alert.reference}` });

  const blocks: Record<string, unknown>[] = [
    { type: "section", text: { type: "mrkdwn", text: `*${alert.title}*\n${alert.message}` } },
    { type: "section", fields },
  ];

  if (alert.url) {
    blocks.push({
      type: "actions",
      elements: [
        { type: "button", text: { type: "plain_text", text: "View in dashboard" }, url: alert.url },
      ],
    });
  }

  return { text: `${merchant}: ${alert.title} — ${alert.message}`, blocks };
}

/** Builds a Discord webhook payload with a single rich embed. */
export function buildDiscordPayload(alert: AlertPayload, merchant = "FacilPay"): DiscordMessage {
  const fields: { name: string; value: string; inline: boolean }[] = [
    { name: "Category", value: ALERT_CATEGORIES[alert.category].label, inline: true },
  ];
  if (alert.amount) fields.unshift({ name: "Amount", value: alert.amount, inline: true });
  if (alert.reference) fields.push({ name: "Reference", value: alert.reference, inline: true });

  const embed: Record<string, unknown> = {
    title: alert.title,
    description: alert.message,
    color: CATEGORY_COLORS[alert.category],
    fields,
    timestamp: alert.timestamp,
    footer: { text: merchant },
  };
  if (alert.url) embed.url = alert.url;

  return { content: `${merchant} · ${alert.title}`, embeds: [embed] };
}

export function buildAlertPayload(
  provider: AlertProvider,
  alert: AlertPayload,
  merchant?: string
): SlackMessage | DiscordMessage {
  return provider === "slack" ? buildSlackPayload(alert, merchant) : buildDiscordPayload(alert, merchant);
}

/** Representative sample alert used by the "Send test alert" action. */
export function sampleAlertFor(category: AlertCategory, now: Date = new Date()): AlertPayload {
  const timestamp = now.toISOString();

  if (category === "refund") {
    return {
      category,
      title: "Refund completed",
      message: "A 40.00 USDC refund settled on-chain.",
      amount: "40.00 USDC",
      reference: "rf_2b9x1k",
      url: "https://dashboard.facilpay.io/refunds",
      timestamp,
    };
  }

  if (category === "payout") {
    return {
      category,
      title: "Payout sent",
      message: "A 1,200.00 USDC payout was sent to your bank account.",
      amount: "1,200.00 USDC",
      reference: "po_77d0qz",
      url: "https://dashboard.facilpay.io/payouts",
      timestamp,
    };
  }

  return {
    category,
    title: "Payment received",
    message: "You received 250.00 USDC from a customer.",
    amount: "250.00 USDC",
    reference: "pay_8f3k2m",
    url: "https://dashboard.facilpay.io/payments",
    timestamp,
  };
}

export interface AlertDeliveryResult {
  ok: boolean;
  provider: AlertProvider;
  payload: SlackMessage | DiscordMessage;
  sentAt: string;
}

/**
 * Mocked delivery. There is no backend endpoint for chat alerts yet, so we build
 * the exact payload that would be POSTed and resolve it locally.
 */
export async function deliverAlert(
  integration: AlertIntegration,
  alert: AlertPayload
): Promise<AlertDeliveryResult> {
  const payload = buildAlertPayload(integration.provider, alert);
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { ok: true, provider: integration.provider, payload, sentAt: new Date().toISOString() };
}
