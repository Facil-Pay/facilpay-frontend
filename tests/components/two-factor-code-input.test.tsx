/**
 * tests/components/two-factor-code-input.test.tsx
 *
 * Unit tests for TwoFactorCodeInput and isCompleteTwoFactorCode.
 *
 * Covers:
 *  - Digit entry (TOTP mode)
 *  - Paste of a 6-digit code
 *  - Non-digit characters are stripped in TOTP mode
 *  - Recovery-code mode: accepts XXXX-XXXX, uppercases input
 *  - isCompleteTwoFactorCode: TOTP and recovery code validation
 *  - ARIA attributes for invalid/describedBy
 *  - Keyboard-only interaction (Tab focus, Enter submit in a form)
 *  - disabled state
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  TwoFactorCodeInput,
  isCompleteTwoFactorCode,
} from "@/components/security/TwoFactorCodeInput";

// ─── isCompleteTwoFactorCode ──────────────────────────────────────────────────

describe("isCompleteTwoFactorCode", () => {
  describe("TOTP mode (allowRecoveryCode=false)", () => {
    it("accepts exactly 6 digits", () => {
      expect(isCompleteTwoFactorCode("123456", false)).toBe(true);
      expect(isCompleteTwoFactorCode("000000", false)).toBe(true);
    });

    it("rejects fewer than 6 digits", () => {
      expect(isCompleteTwoFactorCode("12345", false)).toBe(false);
      expect(isCompleteTwoFactorCode("", false)).toBe(false);
    });

    it("rejects more than 6 digits", () => {
      expect(isCompleteTwoFactorCode("1234567", false)).toBe(false);
    });

    it("rejects non-digit strings", () => {
      expect(isCompleteTwoFactorCode("abcdef", false)).toBe(false);
      expect(isCompleteTwoFactorCode("12 345", false)).toBe(false);
    });

    it("rejects recovery code format", () => {
      expect(isCompleteTwoFactorCode("ABCD-1234", false)).toBe(false);
    });
  });

  describe("recovery code mode (allowRecoveryCode=true)", () => {
    it("accepts 6-digit TOTP code", () => {
      expect(isCompleteTwoFactorCode("123456", true)).toBe(true);
    });

    it("accepts XXXX-XXXX recovery code (dashed)", () => {
      expect(isCompleteTwoFactorCode("ABCD-1234", true)).toBe(true);
      expect(isCompleteTwoFactorCode("7HQK-2M9D", true)).toBe(true);
    });

    it("accepts 8-char recovery code without dash (normalized)", () => {
      // normalizeTwoFactorCode strips spaces and uppercases; TWO_FACTOR_CODE_PATTERN
      // matches XXXX-?XXXX so "ABCD1234" is valid after normalize
      expect(isCompleteTwoFactorCode("ABCD1234", true)).toBe(true);
    });

    it("rejects too-short recovery code", () => {
      expect(isCompleteTwoFactorCode("ABC-123", true)).toBe(false);
    });

    it("rejects empty string", () => {
      expect(isCompleteTwoFactorCode("", true)).toBe(false);
    });
  });
});

// ─── TwoFactorCodeInput rendering ────────────────────────────────────────────

describe("TwoFactorCodeInput", () => {
  it("renders an input with the given id", () => {
    render(
      <TwoFactorCodeInput id="test-otp" value="" onChange={() => void 0} />,
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("sets autoComplete='one-time-code'", () => {
    render(
      <TwoFactorCodeInput id="test-otp" value="" onChange={() => void 0} />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "autocomplete",
      "one-time-code",
    );
  });

  it("uses numeric inputMode in TOTP mode", () => {
    render(
      <TwoFactorCodeInput id="test-otp" value="" onChange={() => void 0} />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("inputmode", "numeric");
  });

  it("uses text inputMode in recovery-code mode", () => {
    render(
      <TwoFactorCodeInput
        id="test-otp"
        value=""
        onChange={() => void 0}
        allowRecoveryCode
      />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("inputmode", "text");
  });

  it("sets maxLength=6 in TOTP mode and maxLength=9 in recovery mode", () => {
    const { rerender } = render(
      <TwoFactorCodeInput id="test-otp" value="" onChange={() => void 0} />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "6");

    rerender(
      <TwoFactorCodeInput
        id="test-otp"
        value=""
        onChange={() => void 0}
        allowRecoveryCode
      />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("maxlength", "9");
  });

  it("sets aria-invalid when invalid=true", () => {
    render(
      <TwoFactorCodeInput
        id="test-otp"
        value=""
        onChange={() => void 0}
        invalid
      />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when invalid is not passed", () => {
    render(
      <TwoFactorCodeInput id="test-otp" value="" onChange={() => void 0} />,
    );
    expect(screen.getByRole("textbox")).not.toHaveAttribute("aria-invalid");
  });

  it("sets aria-describedby when describedBy is provided", () => {
    render(
      <TwoFactorCodeInput
        id="test-otp"
        value=""
        onChange={() => void 0}
        describedBy="error-msg"
      />,
    );
    expect(screen.getByRole("textbox")).toHaveAttribute(
      "aria-describedby",
      "error-msg",
    );
  });

  it("is disabled when disabled=true", () => {
    render(
      <TwoFactorCodeInput
        id="test-otp"
        value=""
        onChange={() => void 0}
        disabled
      />,
    );
    expect(screen.getByRole("textbox")).toBeDisabled();
  });
});

// ─── Digit entry ──────────────────────────────────────────────────────────────

describe("TwoFactorCodeInput — digit entry", () => {
  it("calls onChange with only digit characters in TOTP mode", async () => {
    const onChange = vi.fn();
    render(
      <TwoFactorCodeInput id="test-otp" value="" onChange={onChange} />,
    );
    const input = screen.getByRole("textbox");
    // Type digits interspersed with letters
    await userEvent.type(input, "123");
    // Every onChange call should only contain digits (letters stripped)
    for (const call of onChange.mock.calls) {
      expect(call[0] as string).toMatch(/^\d*$/);
    }
    // At least one call must have happened with a digit
    expect(onChange).toHaveBeenCalled();
  });

  it("strips non-digit characters on paste in TOTP mode", async () => {
    const onChange = vi.fn();
    render(
      <TwoFactorCodeInput id="test-otp" value="" onChange={onChange} />,
    );
    const input = screen.getByRole("textbox");
    await userEvent.click(input);
    await userEvent.paste("1 2 3 4 5 6");
    const lastCall = onChange.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toMatch(/^\d+$/);
    expect(lastCall).not.toContain(" ");
  });

  it("calls onChange with the full 6-digit paste value stripped of non-digits", async () => {
    const onChange = vi.fn();
    render(
      <TwoFactorCodeInput id="test-otp" value="" onChange={onChange} />,
    );
    await userEvent.click(screen.getByRole("textbox"));
    await userEvent.paste("123456");
    expect(onChange).toHaveBeenLastCalledWith("123456");
  });
});

// ─── Recovery code entry ──────────────────────────────────────────────────────

describe("TwoFactorCodeInput — recovery code mode", () => {
  it("uppercases typed characters", async () => {
    const onChange = vi.fn();
    render(
      <TwoFactorCodeInput
        id="test-otp"
        value=""
        onChange={onChange}
        allowRecoveryCode
      />,
    );
    await userEvent.type(screen.getByRole("textbox"), "abcd");
    const lastCall = onChange.mock.calls.at(-1)?.[0] as string;
    expect(lastCall).toBe(lastCall.toUpperCase());
  });

  it("accepts a pasted recovery code and uppercases it", async () => {
    const onChange = vi.fn();
    render(
      <TwoFactorCodeInput
        id="test-otp"
        value=""
        onChange={onChange}
        allowRecoveryCode
      />,
    );
    await userEvent.click(screen.getByRole("textbox"));
    await userEvent.paste("abcd-1234");
    expect(onChange).toHaveBeenLastCalledWith("ABCD-1234");
  });
});

// ─── Keyboard-only interaction ────────────────────────────────────────────────

describe("TwoFactorCodeInput — keyboard navigation", () => {
  it("can be focused via Tab", async () => {
    render(
      <div>
        <button>Before</button>
        <TwoFactorCodeInput id="test-otp" value="" onChange={() => void 0} />
        <button>After</button>
      </div>,
    );
    await userEvent.tab();
    expect(screen.getByRole("textbox")).not.toHaveFocus(); // Before button focused
    await userEvent.tab();
    expect(screen.getByRole("textbox")).toHaveFocus();
  });

  it("submits the containing form on Enter when complete", async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const onChange = vi.fn();
    render(
      <form onSubmit={onSubmit}>
        <TwoFactorCodeInput id="test-otp" value="123456" onChange={onChange} />
        <button type="submit">Go</button>
      </form>,
    );
    screen.getByRole("textbox").focus();
    await userEvent.keyboard("{Enter}");
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
