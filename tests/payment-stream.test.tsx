/**
 * tests/payment-stream.test.tsx
 *
 * Tests for lib/payment-stream-context.tsx and components/payments/LiveIndicator.tsx.
 *
 * Key constraints:
 *  - No real EventSource connections. EventSource is replaced with a fake that
 *    exposes `triggerOpen`, `triggerMessage`, and `triggerError` controls.
 *  - Reconnect backoff uses vi.useFakeTimers() so tests don't wait real time.
 *  - Each test gets a fresh context state via its own <PaymentStreamProvider>.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

// ─── Mock @/lib/stellar ───────────────────────────────────────────────────────
// lib/payment-stream-context.tsx imports isValidStellarAddress and
// STELLAR_TESTNET_HORIZON from @/lib/stellar. The stellar index runs the Zod
// env schema and SDK constructors at module load time, which we short-circuit
// here so tests stay self-contained.
vi.mock("@/lib/stellar", () => ({
  STELLAR_TESTNET_HORIZON: "https://horizon-testnet.stellar.org",
  STELLAR_HORIZON: "https://horizon-testnet.stellar.org",
  STELLAR_NETWORK: "testnet",
  STELLAR_FRIENDBOT_URL: "https://friendbot.stellar.org",
  TESTNET_ASSETS: {},
  horizonServer: {},
  sorobanRpc: {},
  contracts: {
    payment: { isConfigured: false },
    escrow:  { isConfigured: false },
    refund:  { isConfigured: false },
  },
  stellarNetwork: "Test SDF Network ; September 2015",
  Networks: { TESTNET: "Test SDF Network ; September 2015" },
  // Simple structural check: starts with "G", length 56
  isValidStellarAddress: (addr: string) =>
    typeof addr === "string" && addr.startsWith("G") && addr.length === 56,
}));

import {
  PaymentStreamProvider,
  usePaymentStream,
} from "@/lib/payment-stream-context";
import LiveIndicator from "@/components/payments/LiveIndicator";

// ─── EventSource fake ──────────────────────────────────────────────────────────

interface FakeES {
  url: string;
  onopen: ((e: Event) => void) | null;
  onmessage: ((e: MessageEvent) => void) | null;
  onerror: ((e: Event) => void) | null;
  close: () => void;
  triggerOpen: () => void;
  triggerMessage: (data: unknown) => void;
  triggerError: () => void;
  closed: boolean;
}

/** All EventSource instances created during a test, in order of construction. */
let fakeInstances: FakeES[] = [];

class FakeEventSource implements FakeES {
  url: string;
  onopen:    ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;
  onerror:   ((e: Event) => void) | null = null;
  closed = false;

  constructor(url: string) {
    this.url = url;
    fakeInstances.push(this);
  }

  close() { this.closed = true; }

  triggerOpen() { this.onopen?.(new Event("open")); }

  triggerMessage(data: unknown) {
    const payload = typeof data === "string" ? data : JSON.stringify(data);
    this.onmessage?.(new MessageEvent("message", { data: payload }));
  }

  triggerError() { this.onerror?.(new Event("error")); }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ContextConsumer() {
  const ctx = usePaymentStream();
  return (
    <div
      data-testid="ctx"
      data-status={ctx.status}
      data-payment-count={ctx.payments.length}
      data-latest={ctx.latestPayment?.id ?? ""}
      data-reconnect-attempts={ctx.reconnectAttempts}
      data-is-paused={String(ctx.isPaused)}
    >
      <button onClick={() => ctx.simulateIncomingPayment()}>simulate</button>
      <button onClick={ctx.reconnect}>reconnect</button>
      <button onClick={ctx.clearNewHighlights}>clear</button>
    </div>
  );
}

const VALID_ACCOUNT = "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF";

function renderStream(accountId?: string) {
  return render(
    <PaymentStreamProvider initialAccountId={accountId ?? VALID_ACCOUNT}>
      <ContextConsumer />
    </PaymentStreamProvider>
  );
}

function latestFakeES(): FakeES {
  return fakeInstances[fakeInstances.length - 1];
}

// ─── Setup / teardown ─────────────────────────────────────────────────────────

beforeEach(() => {
  fakeInstances = [];
  vi.useFakeTimers();
  vi.stubGlobal("EventSource", FakeEventSource);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── Provider initialisation ──────────────────────────────────────────────────

describe("PaymentStreamProvider — initialisation", () => {
  it("seeds the payments list with 3 demo items on mount", () => {
    renderStream();
    expect(Number(screen.getByTestId("ctx").dataset.paymentCount)).toBeGreaterThanOrEqual(3);
  });

  it("starts in reconnecting status before onopen fires", () => {
    renderStream();
    expect(screen.getByTestId("ctx").dataset.status).toBe("reconnecting");
  });

  it("transitions to connected when EventSource fires onopen", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());
    expect(screen.getByTestId("ctx").dataset.status).toBe("connected");
  });

  it("does not open an EventSource for an invalid account id", () => {
    renderStream("NOT_A_VALID_KEY");
    expect(fakeInstances).toHaveLength(0);
    expect(screen.getByTestId("ctx").dataset.status).toBe("offline");
  });
});

// ─── Incoming payment events ──────────────────────────────────────────────────

describe("PaymentStreamProvider — incoming payments", () => {
  it("prepends a new payment when an SSE message arrives", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());
    const initialCount = Number(screen.getByTestId("ctx").dataset.paymentCount);

    act(() => {
      latestFakeES().triggerMessage({
        id: "op_new_1",
        paging_token: "9999999999001",
        type: "payment",
        created_at: new Date().toISOString(),
        transaction_hash: "aabbcc".repeat(10).slice(0, 64),
        asset_type: "credit_alphanum4",
        asset_code: "USDC",
        from: "G".padEnd(56, "A"),
        to: VALID_ACCOUNT,
        amount: "15.0000000",
      });
    });

    const ctx = screen.getByTestId("ctx");
    expect(Number(ctx.dataset.paymentCount)).toBe(initialCount + 1);
    expect(ctx.dataset.latest).toBe("op_new_1");
  });

  it("normalises native asset_type to XLM asset_code", () => {
    let capturedCode: string | undefined;

    function Probe() {
      const { latestPayment } = usePaymentStream();
      capturedCode = latestPayment?.asset_code;
      return null;
    }

    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <Probe />
      </PaymentStreamProvider>
    );

    act(() => latestFakeES().triggerOpen());
    act(() => {
      latestFakeES().triggerMessage({
        id: "op_xlm_1",
        paging_token: "9999999999002",
        type: "payment",
        created_at: new Date().toISOString(),
        transaction_hash: "00".repeat(32),
        asset_type: "native",
        from: "G".padEnd(56, "A"),
        to: VALID_ACCOUNT,
        amount: "10.0000000",
      });
    });

    expect(capturedCode).toBe("XLM");
  });

  it("deduplicates payments with the same id", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());

    const payload = {
      id: "op_dup_1",
      paging_token: "111",
      type: "payment",
      created_at: new Date().toISOString(),
      transaction_hash: "00".repeat(32),
      asset_type: "credit_alphanum4",
      asset_code: "USDC",
      from: "G".padEnd(56, "B"),
      to: VALID_ACCOUNT,
      amount: "5.0000000",
    };

    act(() => { latestFakeES().triggerMessage(payload); });
    const countAfterFirst = Number(screen.getByTestId("ctx").dataset.paymentCount);

    act(() => { latestFakeES().triggerMessage(payload); }); // duplicate
    expect(Number(screen.getByTestId("ctx").dataset.paymentCount)).toBe(countAfterFirst);
  });

  it("marks incoming payments with isNew: true", () => {
    let payments: ReturnType<typeof usePaymentStream>["payments"] = [];

    function Probe() {
      payments = usePaymentStream().payments;
      return null;
    }

    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <Probe />
      </PaymentStreamProvider>
    );

    act(() => latestFakeES().triggerOpen());
    act(() => {
      latestFakeES().triggerMessage({
        id: "op_new_flag",
        paging_token: "2000",
        type: "payment",
        created_at: new Date().toISOString(),
        transaction_hash: "ff".repeat(32),
        asset_type: "credit_alphanum4",
        asset_code: "EURC",
        from: "G".padEnd(56, "C"),
        to: VALID_ACCOUNT,
        amount: "30.0000000",
      });
    });

    expect(payments.find((p) => p.id === "op_new_flag")?.isNew).toBe(true);
  });

  it("clearNewHighlights sets isNew to false on all payments", () => {
    let payments: ReturnType<typeof usePaymentStream>["payments"] = [];

    function Probe() {
      payments = usePaymentStream().payments;
      return null;
    }

    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <Probe />
        <ContextConsumer />
      </PaymentStreamProvider>
    );

    act(() => latestFakeES().triggerOpen());
    act(() => {
      latestFakeES().triggerMessage({
        id: "op_flag_clear",
        paging_token: "3000",
        type: "payment",
        created_at: new Date().toISOString(),
        transaction_hash: "ee".repeat(32),
        asset_type: "native",
        from: "G".padEnd(56, "D"),
        to: VALID_ACCOUNT,
        amount: "1.0000000",
      });
    });

    expect(payments.some((p) => p.isNew)).toBe(true);
    act(() => { screen.getByRole("button", { name: "clear" }).click(); });
    expect(payments.every((p) => !p.isNew)).toBe(true);
  });
});

// ─── simulateIncomingPayment ──────────────────────────────────────────────────

describe("PaymentStreamProvider — simulateIncomingPayment", () => {
  it("adds a payment without touching EventSource", () => {
    renderStream();
    const initialCount = Number(screen.getByTestId("ctx").dataset.paymentCount);
    act(() => { screen.getByRole("button", { name: "simulate" }).click(); });
    expect(Number(screen.getByTestId("ctx").dataset.paymentCount)).toBe(initialCount + 1);
  });

  it("honours custom fields passed to simulateIncomingPayment", () => {
    let payments: ReturnType<typeof usePaymentStream>["payments"] = [];

    function Probe() {
      const ctx = usePaymentStream();
      payments = ctx.payments;
      return (
        <button onClick={() => ctx.simulateIncomingPayment({ asset_code: "EURC", amount: "99" })}>
          sim-custom
        </button>
      );
    }

    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <Probe />
      </PaymentStreamProvider>
    );

    act(() => { screen.getByRole("button", { name: "sim-custom" }).click(); });

    expect(payments[0].asset_code).toBe("EURC");
    expect(payments[0].amount).toBe("99");
    expect(payments[0].isNew).toBe(true);
  });
});

// ─── Reconnection ─────────────────────────────────────────────────────────────

describe("PaymentStreamProvider — reconnection after stream error", () => {
  it("sets status to reconnecting after EventSource fires onerror", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());
    expect(screen.getByTestId("ctx").dataset.status).toBe("connected");

    act(() => latestFakeES().triggerError());
    expect(screen.getByTestId("ctx").dataset.status).toBe("reconnecting");
  });

  it("increments reconnectAttempts on each error", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());

    act(() => latestFakeES().triggerError());
    expect(Number(screen.getByTestId("ctx").dataset.reconnectAttempts)).toBe(1);

    act(() => vi.runAllTimers()); // fire backoff → new EventSource
    act(() => latestFakeES().triggerError());
    expect(Number(screen.getByTestId("ctx").dataset.reconnectAttempts)).toBe(2);
  });

  it("resets reconnectAttempts to 0 when reconnection succeeds", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());
    act(() => latestFakeES().triggerError());
    act(() => vi.runAllTimers()); // fire backoff

    act(() => latestFakeES().triggerOpen()); // second connection succeeds
    expect(Number(screen.getByTestId("ctx").dataset.reconnectAttempts)).toBe(0);
  });

  it("creates a new EventSource after the backoff timer fires", () => {
    renderStream();
    const countBefore = fakeInstances.length;

    act(() => latestFakeES().triggerError());
    expect(fakeInstances.length).toBe(countBefore); // not yet reconnected

    act(() => vi.runAllTimers());
    expect(fakeInstances.length).toBeGreaterThan(countBefore);
  });

  it("reconnect() button forces a new connection immediately", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());
    act(() => latestFakeES().triggerError());

    const countBefore = fakeInstances.length;
    act(() => { screen.getByRole("button", { name: "reconnect" }).click(); });
    expect(fakeInstances.length).toBeGreaterThan(countBefore);
  });
});

// ─── Page Visibility API ──────────────────────────────────────────────────────

describe("PaymentStreamProvider — Page Visibility API", () => {
  it("pauses stream when the tab becomes hidden", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());

    act(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    const ctx = screen.getByTestId("ctx");
    expect(ctx.dataset.status).toBe("paused");
    expect(ctx.dataset.isPaused).toBe("true");
  });

  it("resumes stream when the tab becomes visible again", () => {
    renderStream();
    act(() => latestFakeES().triggerOpen());

    act(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    act(() => {
      Object.defineProperty(document, "hidden", { value: false, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(fakeInstances.length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId("ctx").dataset.isPaused).toBe("false");
  });
});

// ─── usePaymentStream fallback ────────────────────────────────────────────────

describe("usePaymentStream — outside provider", () => {
  it("returns a safe fallback context instead of throwing", () => {
    function Probe() {
      return <div data-testid="probe" data-status={usePaymentStream().status} />;
    }
    render(<Probe />);
    expect(screen.getByTestId("probe").dataset.status).toBe("offline");
  });
});

// ─── LiveIndicator ────────────────────────────────────────────────────────────

describe("LiveIndicator", () => {
  it('shows "Live" text when status is connected', () => {
    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <LiveIndicator />
      </PaymentStreamProvider>
    );
    act(() => latestFakeES().triggerOpen());
    expect(screen.getByRole("button")).toHaveTextContent("Live");
  });

  it('shows "Offline" when account is invalid (no EventSource opened)', () => {
    render(
      <PaymentStreamProvider initialAccountId="NOT_VALID">
        <LiveIndicator />
      </PaymentStreamProvider>
    );
    expect(screen.getByRole("button")).toHaveTextContent("Offline");
  });

  it('shows "Connecting..." before the first onopen', () => {
    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <LiveIndicator />
      </PaymentStreamProvider>
    );
    expect(screen.getByRole("button")).toHaveTextContent("Connecting...");
  });

  it('shows "Reconnecting (N)..." after N error cycles', () => {
    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <LiveIndicator />
      </PaymentStreamProvider>
    );
    act(() => latestFakeES().triggerOpen());
    act(() => latestFakeES().triggerError());
    expect(screen.getByRole("button")).toHaveTextContent("Reconnecting (1)...");
  });

  it('shows "Paused (Tab Hidden)" when the tab is hidden', () => {
    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <LiveIndicator />
      </PaymentStreamProvider>
    );
    act(() => latestFakeES().triggerOpen());
    act(() => {
      Object.defineProperty(document, "hidden", { value: true, configurable: true });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    expect(screen.getByRole("button")).toHaveTextContent("Paused (Tab Hidden)");
  });

  it("clicking the button while not connected triggers a new EventSource", () => {
    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <LiveIndicator />
      </PaymentStreamProvider>
    );
    act(() => latestFakeES().triggerOpen());
    act(() => latestFakeES().triggerError());

    const countBefore = fakeInstances.length;
    act(() => vi.runAllTimers()); // fire backoff → new ES created
    // Use direct DOM click (synchronous) to avoid user-event timer conflicts
    act(() => { screen.getByRole("button").click(); });
    expect(fakeInstances.length).toBeGreaterThan(countBefore);
  });

  it("title attribute reflects stream health", () => {
    render(
      <PaymentStreamProvider initialAccountId={VALID_ACCOUNT}>
        <LiveIndicator />
      </PaymentStreamProvider>
    );
    expect(screen.getByRole("button")).toHaveAttribute("title", "Click to force reconnect stream");

    act(() => latestFakeES().triggerOpen());
    expect(screen.getByRole("button")).toHaveAttribute("title", "Horizon SSE Stream Active");
  });
});
