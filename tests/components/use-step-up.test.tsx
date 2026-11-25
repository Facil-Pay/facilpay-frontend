/**
 * tests/components/use-step-up.test.tsx
 *
 * Tests for the useStepUp hook.
 *
 * Key behaviors:
 *  - When 2FA is disabled, requestStepUp resolves immediately with empty headers
 *  - When 2FA is enabled, requestStepUp shows the dialog and waits
 *  - Successful challenge resolves with the step-up token header
 *  - Cancelled challenge resolves with null
 *  - A second requestStepUp while one is pending cancels the first (resolves null)
 *  - Protected action is NOT called when grant is null (cancelled)
 *  - Protected action IS called with grant headers when 2FA succeeds
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock next-intl (used transitively by TwoFactorChallengeDialog)
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTimeZone: () => "UTC",
}));

// Mock the 2FA API hooks used inside use-step-up.
// Factory must not reference external variables (hoisting restriction).
vi.mock("@/lib/api/hooks/useTwoFactor", () => ({
  STEP_UP_HEADER: "X-FacilPay-2FA-Token",
  TWO_FACTOR_CODE_PATTERN: /^(\d{6}|[A-Z0-9]{4}-?[A-Z0-9]{4})$/i,
  normalizeTwoFactorCode: (code: string) =>
    code.replace(/\s+/g, "").toUpperCase(),
  fetchTwoFactorStatus: vi.fn(),
  useVerifyStepUp: vi.fn(),
}));

import {
  fetchTwoFactorStatus,
  useVerifyStepUp,
} from "@/lib/api/hooks/useTwoFactor";
import { useStepUp } from "@/components/security/use-step-up";
import type { StepUpGrant } from "@/components/security/use-step-up";

const STEP_UP_HEADER_NAME = "X-FacilPay-2FA-Token";

const mockFetchStatus = fetchTwoFactorStatus as ReturnType<typeof vi.fn>;
const mockUseVerifyStepUp = useVerifyStepUp as ReturnType<typeof vi.fn>;

// ─── Test harness component ───────────────────────────────────────────────────

function StepUpHarness({
  onGrant,
}: {
  onGrant: (g: StepUpGrant | null) => void;
}) {
  const { requestStepUp, stepUpDialog } = useStepUp();

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          const grant = await requestStepUp("reveal_api_key");
          onGrant(grant);
        }}
      >
        Trigger action
      </button>
      {stepUpDialog}
    </>
  );
}

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: 0 } } });
}

function renderHarness(onGrant: (g: StepUpGrant | null) => void) {
  const qc = makeQueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <StepUpHarness onGrant={onGrant} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("useStepUp — 2FA disabled", () => {
  beforeEach(() => {
    mockFetchStatus.mockResolvedValue({ enabled: false, recoveryCodesRemaining: 0 });
    mockUseVerifyStepUp.mockReturnValue({ mutateAsync: vi.fn() });
  });

  it("resolves immediately with empty headers when 2FA is off", async () => {
    const onGrant = vi.fn();
    renderHarness(onGrant);

    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));

    await waitFor(() => expect(onGrant).toHaveBeenCalledWith({ headers: {} }));
  });

  it("does not open the challenge dialog when 2FA is off", async () => {
    const onGrant = vi.fn();
    renderHarness(onGrant);

    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));
    await waitFor(() => expect(onGrant).toHaveBeenCalled());

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

describe("useStepUp — 2FA enabled", () => {
  const MOCK_TOKEN = "stepup_abc123";

  beforeEach(() => {
    mockFetchStatus.mockResolvedValue({ enabled: true, recoveryCodesRemaining: 8 });
    mockUseVerifyStepUp.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        token: MOCK_TOKEN,
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      }),
    });
  });

  it("opens the challenge dialog when 2FA is enabled", async () => {
    const onGrant = vi.fn();
    renderHarness(onGrant);

    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));

    await waitFor(() =>
      expect(screen.getByRole("dialog")).toBeInTheDocument(),
    );
  });

  it("resolves with the step-up token header after a successful challenge", async () => {
    const onGrant = vi.fn();
    renderHarness(onGrant);

    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await userEvent.type(screen.getByRole("textbox"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /reveal key/i }));

    await waitFor(() =>
      expect(onGrant).toHaveBeenCalledWith({
        headers: { [STEP_UP_HEADER_NAME]: MOCK_TOKEN },
      }),
    );
  });

  it("resolves with null when the user cancels", async () => {
    const onGrant = vi.fn();
    renderHarness(onGrant);

    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() => expect(onGrant).toHaveBeenCalledWith(null));
  });

  it("dialog closes after cancellation", async () => {
    const onGrant = vi.fn();
    renderHarness(onGrant);

    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
  });

  it("protected action runs only after a successful challenge", async () => {
    const protectedAction = vi.fn();
    const onGrant = vi.fn().mockImplementation((grant: StepUpGrant | null) => {
      if (grant) protectedAction(grant.headers);
    });

    renderHarness(onGrant);

    // Cancel — action should NOT run
    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    await waitFor(() => expect(onGrant).toHaveBeenCalledWith(null));
    expect(protectedAction).not.toHaveBeenCalled();

    // Trigger again — succeed this time
    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await userEvent.type(screen.getByRole("textbox"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /reveal key/i }));

    await waitFor(() =>
      expect(protectedAction).toHaveBeenCalledWith({
        [STEP_UP_HEADER_NAME]: MOCK_TOKEN,
      }),
    );
  });

  it("dialog shows the correct copy for the reveal_api_key action", async () => {
    renderHarness(vi.fn());

    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    expect(screen.getByText(/Reveal API key/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reveal key/i }),
    ).toBeInTheDocument();
  });
});

describe("useStepUp — concurrent requests", () => {
  beforeEach(() => {
    mockFetchStatus.mockResolvedValue({ enabled: true, recoveryCodesRemaining: 8 });
    mockUseVerifyStepUp.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        token: "tok_new",
        expiresAt: new Date(Date.now() + 300_000).toISOString(),
      }),
    });
  });

  it("cancels the first pending request when a second is made", async () => {
    const grants: (StepUpGrant | null)[] = [];
    renderHarness((g) => grants.push(g));

    // First request — opens dialog
    await userEvent.click(screen.getByRole("button", { name: "Trigger action" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());

    // Radix applies pointer-events:none to background when dialog is open.
    // Dispatch a click event directly to bypass the pointer-events guard.
    const triggerBtn = screen.getByRole("button", { name: "Trigger action", hidden: true });
    triggerBtn.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    // First caller gets null (cancelled by the second request)
    await waitFor(() => expect(grants).toContain(null));
  });
});
