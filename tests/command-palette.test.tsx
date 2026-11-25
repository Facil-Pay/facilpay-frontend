import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NextIntlClientProvider } from "next-intl";
import type { TeamMember } from "@/lib/team";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/team", () => ({ useCurrentMember: vi.fn() }));
vi.mock("@/lib/api/client", () => ({ apiClient: { get: vi.fn() } }));

import { useCurrentMember } from "@/lib/team";
import { apiClient } from "@/lib/api/client";
import { DASHBOARD_NAV_ITEMS } from "@/components/layout/nav-items";
import { CommandPaletteProvider } from "@/components/command-palette/CommandPalette";
import {
  buildStaticCommands,
  filterCommands,
  lookupRecords,
} from "@/lib/command-palette";

const nav = DASHBOARD_NAV_ITEMS.map(({ label, href }) => ({ label, href }));

function asRole(role: TeamMember["role"]) {
  vi.mocked(useCurrentMember).mockReturnValue({
    id: "m1",
    name: "Tester",
    role,
    status: "active",
  } as TeamMember);
}

const page = <T,>(data: T[]) => ({ data, meta: { total: data.length, page: 1, pageSize: 5, totalPages: 1, hasNextPage: false, hasPrevPage: false } });

const payment = {
  id: "pay_123",
  reference: "FP-2026-00123",
  status: "completed",
  amount: 25,
  currency: "USDC",
  sender: { name: "Alice", accountId: "acc_1", email: "alice@example.com", walletAddress: "GALICE" },
  recipient: { name: "Shop", accountId: "acc_2" },
};

beforeEach(() => {
  push.mockReset();
  vi.mocked(apiClient.get).mockReset();
});

describe("buildStaticCommands", () => {
  it("hides pages and actions the role cannot use", () => {
    const viewer = buildStaticCommands(nav, "viewer").map((c) => c.id);
    expect(viewer).toContain("nav:/payments");
    expect(viewer).not.toContain("nav:/webhooks");
    expect(viewer).not.toContain("nav:/settings");
    expect(viewer.filter((id) => id.startsWith("action:"))).toEqual([]);

    const developer = buildStaticCommands(nav, "developer").map((c) => c.id);
    expect(developer).toContain("action:create-api-key");
    expect(developer).toContain("action:create-payment-link");
    expect(developer).not.toContain("action:new-payout");

    const owner = buildStaticCommands(nav, "owner").map((c) => c.id);
    expect(owner).toEqual(expect.arrayContaining(["action:new-payout", "action:create-api-key", "nav:/settings"]));
  });

  it("shows nothing protected when there is no active member", () => {
    const ids = buildStaticCommands(nav, null).map((c) => c.id);
    expect(ids).not.toContain("nav:/escrow");
    expect(ids.some((id) => id.startsWith("action:"))).toBe(false);
  });
});

describe("filterCommands", () => {
  const commands = buildStaticCommands(nav, "owner");

  it("ranks label prefixes ahead of keyword matches", () => {
    const labels = filterCommands(commands, "pay").map((c) => c.label);
    expect(labels[0]).toBe("payments");
    expect(labels).toContain("New payout");
  });

  it("matches synonyms in keywords", () => {
    expect(filterCommands(commands, "withdraw").map((c) => c.id)).toEqual(["action:new-payout"]);
  });

  it("returns everything for an empty query and nothing for nonsense", () => {
    expect(filterCommands(commands, "  ")).toHaveLength(commands.length);
    expect(filterCommands(commands, "zzzz")).toEqual([]);
  });
});

describe("lookupRecords", () => {
  it("queries payments and refunds and derives customers", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (path: string) =>
      path === "/payments" ? page([payment]) : page([]),
    );
    const result = await lookupRecords("alice@");
    expect(apiClient.get).toHaveBeenCalledWith("/payments", expect.objectContaining({ params: expect.objectContaining({ search: "alice@" }) }));
    expect(apiClient.get).toHaveBeenCalledWith("/refunds", expect.objectContaining({ params: expect.objectContaining({ q: "alice@" }) }));
    expect(result.commands.map((c) => c.id)).toEqual(["payment:pay_123", "customer:alice@example.com"]);
    expect(result.failed).toEqual([]);
  });

  it("keeps partial results when one source fails", async () => {
    vi.mocked(apiClient.get).mockImplementation(async (path: string) => {
      if (path === "/refunds") throw new Error("boom");
      return page([payment]);
    });
    const result = await lookupRecords("FP-2026");
    expect(result.failed).toEqual(["refunds"]);
    expect(result.commands[0].href).toBe("/payments/pay_123");
  });

  it("skips the API for very short queries", async () => {
    await lookupRecords("a");
    expect(apiClient.get).not.toHaveBeenCalled();
  });
});

describe("<CommandPaletteProvider>", () => {
  function renderShell() {
    return render(
      <NextIntlClientProvider locale="en" messages={{}} onError={() => {}} getMessageFallback={({ key }) => key}>
        <CommandPaletteProvider>
          <p>app</p>
        </CommandPaletteProvider>
      </NextIntlClientProvider>,
    );
  }

  it("opens with Ctrl+K, filters and navigates by keyboard", async () => {
    asRole("owner");
    vi.mocked(apiClient.get).mockResolvedValue(page([]));
    const user = userEvent.setup();
    renderShell();

    await user.keyboard("{Control>}k{/Control}");
    const input = await screen.findByRole("combobox");
    expect(input).toHaveFocus();

    await user.type(input, "refunds");
    await user.keyboard("{Enter}");
    expect(push).toHaveBeenCalledWith("/refunds");
    await waitFor(() => expect(screen.queryByRole("combobox")).not.toBeInTheDocument());
  });

  it("moves the active option with arrow keys", async () => {
    asRole("owner");
    const user = userEvent.setup();
    renderShell();

    await user.keyboard("{Control>}k{/Control}");
    const input = await screen.findByRole("combobox");
    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAttribute("aria-selected", "true");
    await user.keyboard("{ArrowDown}");
    expect(input).toHaveAttribute("aria-activedescendant", options[1].id);
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(input).toHaveAttribute("aria-activedescendant", options[options.length - 1].id);
  });

  it("shows API record results for a lookup", async () => {
    asRole("support");
    vi.mocked(apiClient.get).mockImplementation(async (path: string) =>
      path === "/payments" ? page([payment]) : page([]),
    );
    const user = userEvent.setup();
    renderShell();

    await user.keyboard("{Control>}k{/Control}");
    await user.type(await screen.findByRole("combobox"), "FP-2026");
    expect(await screen.findByText("FP-2026-00123")).toBeInTheDocument();
    expect(screen.queryByText("Create API key")).not.toBeInTheDocument();
  });
});
