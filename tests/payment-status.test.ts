import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import {
  PAYMENT_STATUSES,
  REFUND_STATUSES,
  PAYOUT_STATUSES,
  isPaymentStatus,
} from "@/lib/types";
import {
  PAYMENT_STATUS_META,
  paymentStatusLabel,
} from "@/components/payments/payment-status";
import { PaymentStatusBadge } from "@/components/payments/PaymentStatusBadge";
import { normalizeStoredEndpoint } from "@/lib/webhook-data";

describe("unified status types", () => {
  it("uses the API's lowercase payment statuses", () => {
    for (const status of [
      "pending",
      "completed",
      "failed",
      "refunded",
      "partially_refunded",
      "expired",
    ]) {
      expect(PAYMENT_STATUSES).toContain(status);
    }
    for (const status of [...PAYMENT_STATUSES, ...REFUND_STATUSES, ...PAYOUT_STATUSES]) {
      expect(status).toBe(status.toLowerCase());
    }
  });

  it("narrows unknown values with isPaymentStatus", () => {
    expect(isPaymentStatus("completed")).toBe(true);
    expect(isPaymentStatus("COMPLETED")).toBe(false);
    expect(isPaymentStatus(undefined)).toBe(false);
  });

  it("has badge metadata for every payment status", () => {
    for (const status of PAYMENT_STATUSES) {
      const meta = PAYMENT_STATUS_META[status];
      expect(meta.label).toBeTruthy();
      expect(meta.chartColor).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("humanises unknown statuses instead of failing", () => {
    expect(paymentStatusLabel("partially_refunded")).toBe("Partially refunded");
    expect(paymentStatusLabel("on_hold")).toBe("On hold");
  });

  it("renders the same label for a status on any page", () => {
    render(createElement(PaymentStatusBadge, { status: "partially_refunded" }));
    expect(screen.getByText("Partially refunded")).toBeInTheDocument();
  });
});

describe("normalizeStoredEndpoint", () => {
  it("migrates endpoints saved with the legacy webhook shape", () => {
    const endpoint = normalizeStoredEndpoint({
      id: "ep_1",
      url: "https://example.com/hook",
      description: "Legacy",
      createdAt: "2026-01-01T00:00:00Z",
      status: "inactive",
      subscribedEvents: ["payment.completed"],
      lastTriggeredAt: "2026-01-02T00:00:00Z",
    });
    expect(endpoint.status).toBe("disabled");
    expect(endpoint.events).toEqual(["payment.completed"]);
    expect(endpoint.lastDeliveryAt).toBe("2026-01-02T00:00:00Z");
    expect(endpoint).not.toHaveProperty("subscribedEvents");
  });

  it("leaves current endpoints untouched", () => {
    const endpoint = normalizeStoredEndpoint({
      id: "ep_2",
      url: "https://example.com/hook",
      description: "",
      createdAt: "2026-01-01T00:00:00Z",
      status: "active",
      events: ["refund.created"],
    });
    expect(endpoint.status).toBe("active");
    expect(endpoint.events).toEqual(["refund.created"]);
  });
});
