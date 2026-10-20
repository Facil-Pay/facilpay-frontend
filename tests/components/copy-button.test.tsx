/**
 * tests/components/copy-button.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CopyButton } from "@/components/ui/copy-button";

describe("CopyButton", () => {
  beforeEach(() => {
    // Provide a minimal clipboard stub
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders a button with the default label", () => {
    render(<CopyButton value="hello" />);
    expect(screen.getByRole("button", { name: /copy to clipboard/i })).toBeInTheDocument();
  });

  it("calls clipboard.writeText with the correct value on click", async () => {
    render(<CopyButton value="test-value" />);
    await userEvent.click(screen.getByRole("button"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("test-value");
  });

  it("accepts a custom label", () => {
    render(<CopyButton value="x" label="Copy API key" />);
    expect(screen.getByRole("button", { name: "Copy API key" })).toBeInTheDocument();
  });
});
