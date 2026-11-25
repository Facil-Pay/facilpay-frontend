/**
 * tests/components/payment-status-badge.test.tsx
 *
 * Tests for PaymentStatusBadge covering:
 *  - Standard status rendering (completed, pending, failed, etc.)
 *  - Flagged status badge with reason display
 *  - aria-label accessibility
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  PaymentStatusBadge,
  PaymentStatusPill,
} from "@/components/payments/PaymentStatusBadge";

describe("PaymentStatusBadge — standard statuses", () => {
  it("renders 'Completed' for completed status", () => {
    render(<PaymentStatusBadge status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });

  it("renders 'Pending' for pending status", () => {
    render(<PaymentStatusBadge status="pending" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("renders 'Failed' for failed status", () => {
    render(<PaymentStatusBadge status="failed" />);
    expect(screen.getByText("Failed")).toBeInTheDocument();
  });

  it("renders 'Refunded' for refunded status", () => {
    render(<PaymentStatusBadge status="refunded" />);
    expect(screen.getByText("Refunded")).toBeInTheDocument();
  });

  it("renders 'Cancelled' for cancelled status", () => {
    render(<PaymentStatusBadge status="cancelled" />);
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
  });
});

describe("PaymentStatusBadge — flagged status", () => {
  it("renders a 'Flagged' badge when status is flagged (no reason)", () => {
    render(<PaymentStatusBadge status="flagged" />);
    expect(screen.getByText(/Flagged/)).toBeInTheDocument();
  });

  it("includes the trigger reason in the rendered text", () => {
    render(
      <PaymentStatusBadge status="flagged" flagReason="Blocklisted address" />,
    );
    expect(screen.getByText(/Blocklisted address/)).toBeInTheDocument();
  });

  it("sets aria-label to include the flag reason for accessibility", () => {
    render(
      <PaymentStatusBadge status="flagged" flagReason="Amount exceeds threshold" />,
    );
    const badge = screen.getByLabelText(/Amount exceeds threshold/);
    expect(badge).toBeInTheDocument();
  });

  it("sets title attribute for tooltip on hover", () => {
    const { container } = render(
      <PaymentStatusBadge status="flagged" flagReason="First-time payer over threshold" />,
    );
    const badge = container.querySelector('[title="First-time payer over threshold"]');
    expect(badge).not.toBeNull();
  });
});

describe("PaymentStatusPill", () => {
  it("renders a larger flagged pill with reason", () => {
    render(<PaymentStatusPill status="flagged" flagReason="Blocklisted address" />);
    expect(screen.getByText(/Blocklisted address/)).toBeInTheDocument();
  });

  it("renders standard completed pill", () => {
    render(<PaymentStatusPill status="completed" />);
    expect(screen.getByText("Completed")).toBeInTheDocument();
  });
});
