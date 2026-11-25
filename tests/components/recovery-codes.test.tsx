/**
 * tests/components/recovery-codes.test.tsx
 *
 * Unit tests for RecoveryCodes.
 *
 * Covers:
 *  - Renders all codes in the list
 *  - Copy button writes all codes to the clipboard
 *  - Download button triggers a file download (blob URL + click)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecoveryCodes } from "@/components/security/RecoveryCodes";

// RecoveryCodes uses useFormat() → useLocale() / useTimeZone() from next-intl.
// Provide a minimal stub so the component renders in Vitest (no Next.js runtime).
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTimeZone: () => "UTC",
}));

const SAMPLE_CODES = [
  "ABCD-1234",
  "EFGH-5678",
  "IJKL-9012",
  "MNOP-3456",
  "QRST-7890",
  "UVWX-1234",
  "YZAB-5678",
  "CDEF-9012",
  "GHIJ-3456",
  "KLMN-7890",
];

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
  // Reset URL stubs
  global.URL.createObjectURL = vi.fn().mockReturnValue("blob:http://localhost/fake");
  global.URL.revokeObjectURL = vi.fn();
});

describe("RecoveryCodes", () => {
  it("renders every recovery code", () => {
    render(<RecoveryCodes codes={SAMPLE_CODES} />);
    for (const code of SAMPLE_CODES) {
      expect(screen.getByText(code)).toBeInTheDocument();
    }
  });

  it("renders exactly as many list items as codes provided", () => {
    render(<RecoveryCodes codes={SAMPLE_CODES} />);
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(SAMPLE_CODES.length);
  });

  it("copy button writes all codes joined by newlines to the clipboard", async () => {
    render(<RecoveryCodes codes={SAMPLE_CODES} />);
    const copyBtn = screen.getByRole("button", { name: /copy recovery codes/i });
    await userEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      SAMPLE_CODES.join("\n"),
    );
  });

  it("download button creates and revokes a blob URL", async () => {
    // Stub document.createElement to intercept the anchor click
    const clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const anchor = originalCreateElement("a") as HTMLAnchorElement;
        anchor.click = clickSpy;
        return anchor;
      }
      return originalCreateElement(tag);
    });

    render(<RecoveryCodes codes={SAMPLE_CODES} />);
    const downloadBtn = screen.getByRole("button", { name: /download/i });
    await userEvent.click(downloadBtn);

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(clickSpy).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/fake");

    vi.restoreAllMocks();
  });

  it("download file is named facilpay-recovery-codes.txt", async () => {
    let capturedHref = "";
    let capturedDownload = "";
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const anchor = originalCreateElement("a") as HTMLAnchorElement;
        // Capture the properties before click
        const origClick = anchor.click.bind(anchor);
        anchor.click = () => {
          capturedHref = anchor.href;
          capturedDownload = anchor.download;
          origClick();
        };
        return anchor;
      }
      return originalCreateElement(tag);
    });

    render(<RecoveryCodes codes={SAMPLE_CODES} />);
    await userEvent.click(screen.getByRole("button", { name: /download/i }));

    expect(capturedDownload).toBe("facilpay-recovery-codes.txt");

    vi.restoreAllMocks();
  });
});
