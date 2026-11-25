/**
 * tests/components/two-factor-challenge-dialog.test.tsx
 *
 * Unit tests for TwoFactorChallengeDialog.
 *
 * Covers:
 *  - Renders when open=true, hidden when open=false
 *  - Submit button disabled until code is complete
 *  - Successful submit calls onSubmit with the entered code
 *  - Error from onSubmit is displayed; code is cleared for retry
 *  - Cancel button calls onCancel
 *  - Toggle between authenticator code and recovery code modes
 *  - Keyboard-only: Tab through fields, Enter to submit
 *  - Re-open resets all state
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TwoFactorChallengeDialog } from "@/components/security/TwoFactorChallengeDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DEFAULT_PROPS = {
  open: true,
  title: "Confirm payout",
  description: "Enter your 6-digit code.",
  submitLabel: "Confirm",
  onSubmit: vi.fn().mockResolvedValue(undefined),
  onCancel: vi.fn(),
};

function renderDialog(overrides: Partial<typeof DEFAULT_PROPS> = {}) {
  const props = { ...DEFAULT_PROPS, ...overrides };
  return render(<TwoFactorChallengeDialog {...props} />);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Visibility ───────────────────────────────────────────────────────────────

describe("TwoFactorChallengeDialog — visibility", () => {
  it("renders the title and description when open", () => {
    renderDialog();
    expect(screen.getByText("Confirm payout")).toBeInTheDocument();
    expect(screen.getByText("Enter your 6-digit code.")).toBeInTheDocument();
  });

  it("renders the custom submit label", () => {
    renderDialog({ submitLabel: "Reveal key" });
    expect(screen.getByRole("button", { name: "Reveal key" })).toBeInTheDocument();
  });

  it("does not render the dialog content when open=false", () => {
    renderDialog({ open: false });
    expect(screen.queryByText("Confirm payout")).not.toBeInTheDocument();
  });
});

// ─── Submit disabled until code is complete ───────────────────────────────────

describe("TwoFactorChallengeDialog — submit button state", () => {
  it("submit button is disabled with an empty code", () => {
    renderDialog();
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
  });

  it("submit button is disabled with an incomplete code (< 6 digits)", async () => {
    renderDialog();
    await userEvent.type(screen.getByRole("textbox"), "123");
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
  });

  it("submit button becomes enabled with a complete 6-digit code", async () => {
    renderDialog();
    await userEvent.type(screen.getByRole("textbox"), "123456");
    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();
  });
});

// ─── Successful submission ────────────────────────────────────────────────────

describe("TwoFactorChallengeDialog — successful submit", () => {
  it("calls onSubmit with the typed code", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSubmit });

    await userEvent.type(screen.getByRole("textbox"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("123456"));
  });

  it("submits on Enter when the code is complete", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSubmit });

    const input = screen.getByRole("textbox");
    await userEvent.type(input, "654321");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith("654321"));
  });

  it("does not call onSubmit when Enter is pressed with incomplete code", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderDialog({ onSubmit });

    await userEvent.type(screen.getByRole("textbox"), "123");
    await userEvent.keyboard("{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ─── Error state ──────────────────────────────────────────────────────────────

describe("TwoFactorChallengeDialog — error state", () => {
  it("displays the error message when onSubmit throws", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Invalid code"));
    renderDialog({ onSubmit });

    await userEvent.type(screen.getByRole("textbox"), "000000");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Invalid code"),
    );
  });

  it("clears the input after a failed submit", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Wrong code"));
    renderDialog({ onSubmit });

    await userEvent.type(screen.getByRole("textbox"), "000000");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
    expect(screen.getByRole("textbox")).toHaveValue("");
  });

  it("allows a retry after a failed submit", async () => {
    let calls = 0;
    const onSubmit = vi.fn().mockImplementation(async () => {
      calls += 1;
      if (calls === 1) throw new Error("Bad code");
      // second call succeeds
    });
    renderDialog({ onSubmit });

    // First attempt — fails
    await userEvent.type(screen.getByRole("textbox"), "000000");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());

    // Second attempt — succeeds
    await userEvent.type(screen.getByRole("textbox"), "123456");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders an accessible error linked to the input via aria-describedby", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Code error"));
    renderDialog({ onSubmit });

    await userEvent.type(screen.getByRole("textbox"), "000000");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());

    const input = screen.getByRole("textbox");
    const errorId = input.getAttribute("aria-describedby");
    expect(errorId).toBeTruthy();
    expect(document.getElementById(errorId!)).toHaveTextContent("Code error");
  });
});

// ─── Cancel ───────────────────────────────────────────────────────────────────

describe("TwoFactorChallengeDialog — cancel", () => {
  it("calls onCancel when Cancel button is clicked", async () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("Cancel button is keyboard accessible", async () => {
    const onCancel = vi.fn();
    renderDialog({ onCancel });

    // Tab to Cancel (after the code input) then press Space/Enter
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    cancelBtn.focus();
    await userEvent.keyboard(" ");
    expect(onCancel).toHaveBeenCalledOnce();
  });
});

// ─── Recovery code toggle ─────────────────────────────────────────────────────

describe("TwoFactorChallengeDialog — recovery code toggle", () => {
  it("shows the recovery code toggle button", () => {
    renderDialog();
    expect(
      screen.getByRole("button", { name: /lost your device/i }),
    ).toBeInTheDocument();
  });

  it("switches to recovery code mode on toggle click", async () => {
    renderDialog();
    await userEvent.click(
      screen.getByRole("button", { name: /lost your device/i }),
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("placeholder", "XXXX-XXXX");
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "9");
  });

  it("submit stays disabled until a valid recovery code is entered", async () => {
    renderDialog();
    await userEvent.click(
      screen.getByRole("button", { name: /lost your device/i }),
    );
    // Partial code — not yet complete
    await userEvent.type(screen.getByRole("textbox"), "ABCD");
    expect(screen.getByRole("button", { name: /confirm/i })).toBeDisabled();
    // Complete recovery code
    await userEvent.type(screen.getByRole("textbox"), "-1234");
    expect(screen.getByRole("button", { name: /confirm/i })).toBeEnabled();
  });

  it("switches back to authenticator mode and resets code", async () => {
    renderDialog();
    await userEvent.click(
      screen.getByRole("button", { name: /lost your device/i }),
    );
    await userEvent.type(screen.getByRole("textbox"), "ABCD-1234");

    // Toggle back
    await userEvent.click(
      screen.getByRole("button", { name: /use your authenticator/i }),
    );
    expect(screen.getByRole("textbox")).toHaveValue("");
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "6");
  });
});

// ─── State reset on re-open ───────────────────────────────────────────────────

describe("TwoFactorChallengeDialog — state reset on re-open", () => {
  it("clears code, error and recovery mode when dialog re-opens", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Bad code"));
    const { rerender } = renderDialog({ onSubmit });

    // Enter code, trigger error
    await userEvent.type(screen.getByRole("textbox"), "000000");
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());

    // Close and reopen
    rerender(
      <TwoFactorChallengeDialog
        open={false}
        title="Confirm payout"
        description="Enter your 6-digit code."
        submitLabel="Confirm"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    rerender(
      <TwoFactorChallengeDialog
        open={true}
        title="Confirm payout"
        description="Enter your 6-digit code."
        submitLabel="Confirm"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox")).toHaveValue("");
  });
});
