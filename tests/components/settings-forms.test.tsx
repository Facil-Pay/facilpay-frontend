/**
 * tests/components/settings-forms.test.tsx
 *
 * Component and validation tests for the merchant settings forms (issue #143).
 * Covers the Zod schemas that drive form messages, the logo uploader's file
 * checks, regional preferences, and the unsaved-changes guard.
 *
 * The Business profile, Branding and Payment preference forms call the
 * settings query hooks, which import @tanstack/react-query. That package is
 * not declared in package.json, so those forms are not rendered here yet.
 */

import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import messages from "@/messages/en.json";
import { ToastProvider } from "@/components/ui/toast";
import { LogoUploader } from "@/components/settings/LogoUploader";
import { RegionalPreferencesForm } from "@/components/settings/RegionalPreferencesForm";
import { useUnsavedChangesWarning } from "@/components/settings/use-unsaved-changes-warning";
import {
  brandingSchema,
  businessProfileSchema,
  paymentPreferencesSchema,
} from "@/lib/validation/settings";

// Hoisted so the mock factories below can reach them.
const { routerRefresh, deviceZone } = vi.hoisted(() => ({
  routerRefresh: vi.fn(),
  deviceZone: { value: undefined as string | undefined },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: routerRefresh, push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/settings",
}));

vi.mock("@/lib/i18n/preferences", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/i18n/preferences")>();
  return { ...actual, detectTimeZone: () => deviceZone.value };
});

const VALID_G_ADDRESS = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

const validProfile = {
  businessName: "Acme Coffee",
  legalName: "Acme Coffee Ltd",
  website: "https://acme.example",
  supportEmail: "help@acme.example",
  country: "GB",
  category: "food_beverage",
  settlementAddress: VALID_G_ADDRESS,
};

/** Returns the first issue message for each failing field, keyed by field name. */
function fieldErrors(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  if (result.success || !result.error) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    out[key] ??= issue.message;
  }
  return out;
}

function renderWithProviders(ui: ReactNode) {
  return render(
    <NextIntlClientProvider locale="en" timeZone="UTC" messages={messages}>
      <ToastProvider>{ui}</ToastProvider>
    </NextIntlClientProvider>,
  );
}

beforeEach(() => {
  deviceZone.value = undefined;
  routerRefresh.mockReset();
  document.cookie = "FACILPAY_TZ=; max-age=0; path=/";
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Business profile schema ──────────────────────────────────────────────────

describe("businessProfileSchema", () => {
  it("accepts a complete, valid profile", () => {
    expect(businessProfileSchema.safeParse(validProfile).success).toBe(true);
  });

  it("trims whitespace around text fields before validating", () => {
    const parsed = businessProfileSchema.parse({ ...validProfile, businessName: "  Acme  ", legalName: " Acme Ltd " });
    expect(parsed.businessName).toBe("Acme");
    expect(parsed.legalName).toBe("Acme Ltd");
  });

  it("requires names of at least two characters", () => {
    const errors = fieldErrors(businessProfileSchema.safeParse({ ...validProfile, businessName: " A ", legalName: "" }));
    expect(errors.businessName).toBe("Business name is required");
    expect(errors.legalName).toBe("Legal name is required");
  });

  it("caps the business name at 80 characters", () => {
    const errors = fieldErrors(businessProfileSchema.safeParse({ ...validProfile, businessName: "x".repeat(81) }));
    expect(errors.businessName).toBeDefined();
  });

  it("allows an empty website but rejects a non-http value", () => {
    expect(businessProfileSchema.safeParse({ ...validProfile, website: "" }).success).toBe(true);
    const errors = fieldErrors(businessProfileSchema.safeParse({ ...validProfile, website: "acme.example" }));
    expect(errors.website).toBe("Enter a valid URL starting with http:// or https://");
  });

  it("rejects a malformed support email", () => {
    const errors = fieldErrors(businessProfileSchema.safeParse({ ...validProfile, supportEmail: "help@" }));
    expect(errors.supportEmail).toBe("Enter a valid email address");
  });

  it("requires a two-letter country code and a category", () => {
    const errors = fieldErrors(businessProfileSchema.safeParse({ ...validProfile, country: "GBR", category: "" }));
    expect(errors.country).toBe("Select a country");
    expect(errors.category).toBe("Select a business category");
  });

  it("rejects a settlement address that is not an Ed25519 public key", () => {
    const errors = fieldErrors(businessProfileSchema.safeParse({ ...validProfile, settlementAddress: "SABC" }));
    expect(errors.settlementAddress).toBe("Enter a valid Stellar public key (starts with G)");
  });
});

// ─── Branding schema ──────────────────────────────────────────────────────────

describe("brandingSchema", () => {
  it.each(["#20A7EE", "#20a7ee", "#000000"])("accepts the 6-digit colour %s", (color) => {
    expect(brandingSchema.safeParse({ brandColor: color, logo: null }).success).toBe(true);
  });

  it.each(["20A7EE", "#20A7E", "#20A7EEFF", "#GGGGGG", ""])("rejects the colour %j", (color) => {
    const errors = fieldErrors(brandingSchema.safeParse({ brandColor: color, logo: null }));
    expect(errors.brandColor).toBe("Use a 6-digit hex colour, e.g. #20A7EE");
  });

  it("accepts a logo as either a URL, a data URL or null", () => {
    expect(brandingSchema.safeParse({ brandColor: "#20A7EE", logo: "https://cdn.example/logo.png" }).success).toBe(true);
    expect(brandingSchema.safeParse({ brandColor: "#20A7EE", logo: "data:image/png;base64,AAAA" }).success).toBe(true);
    expect(brandingSchema.safeParse({ brandColor: "#20A7EE", logo: null }).success).toBe(true);
  });
});

// ─── Payment preferences schema ───────────────────────────────────────────────

describe("paymentPreferencesSchema", () => {
  const base = {
    acceptedAssets: ["XLM"],
    defaultLinkExpiryHours: 24,
    defaultRedirectUrl: "",
    memoPrefix: "ACME-1",
  };

  it("accepts a valid preference set", () => {
    expect(paymentPreferencesSchema.safeParse(base).success).toBe(true);
  });

  it("requires at least one accepted asset", () => {
    const errors = fieldErrors(paymentPreferencesSchema.safeParse({ ...base, acceptedAssets: [] }));
    expect(errors.acceptedAssets).toBe("Accept at least one asset");
  });

  it("rejects an asset outside the supported settlement list", () => {
    const result = paymentPreferencesSchema.safeParse({ ...base, acceptedAssets: ["BTC"] });
    expect(result.success).toBe(false);
  });

  it("rejects a non-integer or negative link expiry", () => {
    expect(paymentPreferencesSchema.safeParse({ ...base, defaultLinkExpiryHours: 1.5 }).success).toBe(false);
    expect(paymentPreferencesSchema.safeParse({ ...base, defaultLinkExpiryHours: -1 }).success).toBe(false);
  });

  it("limits the memo prefix to 12 characters and a safe character set", () => {
    expect(fieldErrors(paymentPreferencesSchema.safeParse({ ...base, memoPrefix: "A".repeat(13) })).memoPrefix)
      .toBe("Keep the prefix to 12 characters so it fits in a Stellar memo");
    expect(fieldErrors(paymentPreferencesSchema.safeParse({ ...base, memoPrefix: "ACME$" })).memoPrefix)
      .toBe("Use letters, numbers, spaces, - or _");
  });

  it("bounds the slippage tolerance between 0.1% and 50%", () => {
    expect(fieldErrors(paymentPreferencesSchema.safeParse({ ...base, maxSlippagePercent: 0.05 })).maxSlippagePercent)
      .toBe("Minimum slippage is 0.1%");
    expect(fieldErrors(paymentPreferencesSchema.safeParse({ ...base, maxSlippagePercent: 51 })).maxSlippagePercent)
      .toBe("Maximum slippage is 50%");
    expect(paymentPreferencesSchema.safeParse({ ...base, maxSlippagePercent: 0.1 }).success).toBe(true);
  });
});

// ─── Logo uploader ────────────────────────────────────────────────────────────

describe("LogoUploader", () => {
  /** applyAccept is off so the component's own type check runs instead of the browser filter. */
  function chooseFile(file: File) {
    const input = screen.getByLabelText("Logo file");
    return userEvent.setup({ applyAccept: false }).upload(input, file);
  }

  it("shows an upload prompt when there is no logo", () => {
    renderWithProviders(<LogoUploader value={null} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Upload logo" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /remove/i })).not.toBeInTheDocument();
    expect(screen.getByText("PNG or SVG, up to 1 MB. PNGs can be cropped to a square.")).toBeInTheDocument();
  });

  it("shows the current logo with replace and remove actions", () => {
    renderWithProviders(<LogoUploader value="https://cdn.example/logo.png" onChange={vi.fn()} />);

    expect(screen.getByAltText("Current logo")).toHaveAttribute("src", "https://cdn.example/logo.png");
    expect(screen.getByRole("button", { name: "Replace logo" })).toBeInTheDocument();
  });

  it("clears the logo when Remove is pressed", async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUploader value="https://cdn.example/logo.png" onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: /remove/i }));

    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("rejects files that are neither PNG nor SVG without calling onChange", async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUploader value={null} onChange={onChange} />);

    await chooseFile(new File(["plain text"], "notes.txt", { type: "text/plain" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Upload a PNG or SVG file.");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("rejects an image over 1 MB and reports both sizes", async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUploader value={null} onChange={onChange} />);

    const oversized = new File([new Uint8Array(1024 * 1024 + 1)], "huge.svg", { type: "image/svg+xml" });
    await chooseFile(oversized);

    expect(await screen.findByRole("alert")).toHaveTextContent(/That file is .+\. The maximum is .+\./);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("passes an SVG through as a data URL with its file name", async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUploader value={null} onChange={onChange} />);

    await chooseFile(new File(["<svg xmlns='http://www.w3.org/2000/svg'/>"], "logo.svg", { type: "image/svg+xml" }));

    expect(onChange).toHaveBeenCalledWith(expect.stringMatching(/^data:image\/svg\+xml;base64,/), "logo.svg");
  });

  it("clears the previous error once a valid file is chosen", async () => {
    const onChange = vi.fn();
    renderWithProviders(<LogoUploader value={null} onChange={onChange} />);

    await chooseFile(new File(["plain text"], "notes.txt", { type: "text/plain" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();

    await chooseFile(new File(["<svg/>"], "logo.svg", { type: "image/svg+xml" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

// ─── Regional preferences ─────────────────────────────────────────────────────

describe("RegionalPreferencesForm", () => {
  it("shows the active time zone and a formatted preview line", () => {
    renderWithProviders(<RegionalPreferencesForm />);

    expect(screen.getByLabelText(messages.settings.timeZoneTitle)).toHaveValue("UTC");
    expect(screen.getByText(messages.settings.preview)).toBeInTheDocument();
  });

  it("persists a newly chosen time zone, refreshes the route and confirms", async () => {
    renderWithProviders(<RegionalPreferencesForm />);

    await userEvent.selectOptions(screen.getByLabelText(messages.settings.timeZoneTitle), "Europe/Madrid");

    expect(document.cookie).toContain("FACILPAY_TZ=Europe%2FMadrid");
    expect(routerRefresh).toHaveBeenCalled();
    expect(await screen.findByText(messages.settings.timeZoneSaved)).toBeInTheDocument();
  });

  it("ignores a change event that repeats the active zone", async () => {
    renderWithProviders(<RegionalPreferencesForm />);

    const select = screen.getByLabelText(messages.settings.timeZoneTitle);
    await act(async () => {
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });

    expect(document.cookie).not.toContain("FACILPAY_TZ");
    expect(routerRefresh).not.toHaveBeenCalled();
    expect(screen.queryByText(messages.settings.timeZoneSaved)).not.toBeInTheDocument();
  });

  it("offers the device time zone when it differs from the saved one", async () => {
    deviceZone.value = "Europe/Madrid";
    renderWithProviders(<RegionalPreferencesForm />);

    await userEvent.click(await screen.findByRole("button", { name: /device's time zone/ }));

    expect(document.cookie).toContain("FACILPAY_TZ=Europe%2FMadrid");
    expect(routerRefresh).toHaveBeenCalled();
  });

  it("hides the device suggestion when it matches the saved zone", () => {
    deviceZone.value = "UTC";
    renderWithProviders(<RegionalPreferencesForm />);

    expect(screen.queryByRole("button", { name: /device's time zone/ })).not.toBeInTheDocument();
  });
});

// ─── Unsaved changes guard ────────────────────────────────────────────────────

describe("useUnsavedChangesWarning", () => {
  function dispatchBeforeUnload() {
    const event = new Event("beforeunload", { cancelable: true }) as BeforeUnloadEvent;
    window.dispatchEvent(event);
    return event;
  }

  it("does not block leaving the page when the form is clean", () => {
    renderHook(() => useUnsavedChangesWarning(false));

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it("blocks reload or tab close while the form is dirty", () => {
    renderHook(() => useUnsavedChangesWarning(true));

    expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
  });

  it("removes its listeners once the form is no longer dirty", () => {
    const { rerender } = renderHook(({ dirty }: { dirty: boolean }) => useUnsavedChangesWarning(dirty), {
      initialProps: { dirty: true },
    });
    rerender({ dirty: false });

    expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
  });

  it("asks before following an in-app link and cancels the click when declined", () => {
    renderHook(() => useUnsavedChangesWarning(true));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const anchor = document.createElement("a");
    anchor.href = `${window.location.origin}/payments`;
    document.body.appendChild(anchor);

    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    anchor.dispatchEvent(click);

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("unsaved changes"));
    expect(click.defaultPrevented).toBe(true);
    anchor.remove();
  });

  it("lets the navigation through when the user confirms", () => {
    renderHook(() => useUnsavedChangesWarning(true));
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const anchor = document.createElement("a");
    anchor.href = `${window.location.origin}/payouts`;
    document.body.appendChild(anchor);

    const click = new MouseEvent("click", { bubbles: true, cancelable: true, button: 0 });
    anchor.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(false);
    anchor.remove();
  });

  it.each([
    ["a same-page anchor", `${window.location.origin}${window.location.pathname}#section`, {}],
    ["a new-tab anchor", `${window.location.origin}/reports`, { target: "_blank" }],
    ["a modified click", `${window.location.origin}/reports`, { metaKey: true }],
    ["a non-primary button", `${window.location.origin}/reports`, { button: 1 }],
  ])("does not prompt for %s", (_label, href, init) => {
    renderHook(() => useUnsavedChangesWarning(true));
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const anchor = document.createElement("a");
    anchor.href = href;
    if ("target" in init) anchor.target = init.target;
    document.body.appendChild(anchor);

    anchor.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, button: 0, ...init }));

    expect(confirm).not.toHaveBeenCalled();
    anchor.remove();
  });
});
