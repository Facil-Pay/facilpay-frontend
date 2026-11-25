/**
 * tests/components/onboarding-wizard.test.tsx
 *
 * React Testing Library coverage for the merchant onboarding wizard:
 * step navigation, per-step validation, Back preserving data, the trustlines
 * and settlement steps (wallet and Horizon mocked), and completion landing on
 * StepDone. Interactions use user-event. No network call is allowed: the
 * Stellar helpers are mocked and the shared MSW server fails any other request.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import {
  STORAGE_KEYS,
  INITIAL_ONBOARDING_STATE,
  DEFAULT_CONNECTED_WALLET,
  getOnboardingState,
  getMerchantUser,
} from "@/lib/storage";
import type { OnboardingState } from "@/types/onboarding";

const { pushMock, completeProfileMock, stellar } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  completeProfileMock: vi.fn(),
  stellar: {
    checkStellarAccount: vi.fn(),
    fundWithFriendbot: vi.fn(),
    requestAddTrustline: vi.fn(),
  },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/lib/auth-context", () => ({
  useAuth: () => ({ completeProfile: completeProfileMock }),
}));

// Render real English copy from messages/en.json without a NextIntl provider.
vi.mock("next-intl", async () => {
  const en = (await import("../../messages/en.json")).default as Record<
    string,
    Record<string, string>
  >;
  return {
    useTranslations: (namespace: string) =>
      (key: string, values?: Record<string, string | number>) => {
        const template = en[namespace]?.[key] ?? key;
        return template.replace(/\{(\w+)\}/g, (_, name: string) =>
          String(values?.[name] ?? `{${name}}`)
        );
      },
  };
});

vi.mock("@/lib/i18n/use-format", () => ({
  useFormat: () => ({
    amount: (value: string | number, asset: string) => `${value} ${asset}`,
  }),
}));

vi.mock("@/lib/stellar", () => ({
  STELLAR_FRIENDBOT_URL: "https://friendbot.example.test",
  TESTNET_ASSETS: {
    USDC: { code: "USDC", name: "USD Coin" },
    EURC: { code: "EURC", name: "Euro Coin" },
  },
  truncateAddress: (address: string, chars = 4) =>
    `${address.slice(0, chars)}…${address.slice(-4)}`,
  isValidStellarAddress: (address: string) => /^G[A-Z2-7]{55}$/.test(address),
  checkStellarAccount: (...args: unknown[]) => stellar.checkStellarAccount(...args),
  fundWithFriendbot: (...args: unknown[]) => stellar.fundWithFriendbot(...args),
  requestAddTrustline: (...args: unknown[]) => stellar.requestAddTrustline(...args),
}));

const VALID_CUSTOM_ADDRESS = "G" + "A".repeat(55);
const BUSINESS_NAME = "Acme Store";

function seedOnboarding(overrides: Partial<OnboardingState>) {
  window.localStorage.setItem(
    STORAGE_KEYS.ONBOARDING_DATA,
    JSON.stringify({ ...INITIAL_ONBOARDING_STATE, ...overrides })
  );
}

async function fillBusinessDetails(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByPlaceholderText("e.g. Acme Tech Store"), BUSINESS_NAME);
  const [country, category] = screen.getAllByRole("combobox");
  await user.selectOptions(country, "United States");
  await user.selectOptions(category, "E-commerce & Retail");
  await user.type(screen.getByPlaceholderText("https://example.com"), "acme.com");
  await user.type(screen.getByPlaceholderText("support@acme.com"), "Support@Acme.com");
}

/** Walks from the welcome screen to the settlement step with valid business details. */
async function reachSettlementStep(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Begin Merchant Setup" }));
  await fillBusinessDetails(user);
  await user.click(screen.getByRole("button", { name: "Next: Settlement Account" }));
  await screen.findByText(/Step 3 of 7/);
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();

  stellar.checkStellarAccount.mockResolvedValue({
    funded: false,
    xlmBalance: "0.0000000",
    hasUsdcTrustline: false,
    hasEurcTrustline: false,
  });
  stellar.fundWithFriendbot.mockResolvedValue({
    success: true,
    message: "Account funded with 10,000 test XLM.",
  });
  stellar.requestAddTrustline.mockResolvedValue({
    success: true,
    txHash: "0123456789abcdef0123456789abcdef",
    message: "ok",
  });
});

describe("OnboardingWizard", () => {
  it("step indicator reflects the current step", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);

    expect(screen.getByText(/Step 1 of 7/)).toHaveTextContent("Welcome");
    expect(screen.getByRole("button", { name: /wallet address/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Begin Merchant Setup" }));

    expect(await screen.findByText(/Step 2 of 7/)).toHaveTextContent("Business Details");
    expect(screen.getByRole("button", { name: /welcome/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /wallet address/i })).toBeDisabled();
  });

  it("resumes saved progress from localStorage on mount", async () => {
    seedOnboarding({
      currentStep: 2,
      completedSteps: [1],
      business: { ...INITIAL_ONBOARDING_STATE.business, name: "Saved Co" },
    });
    render(<OnboardingWizard />);

    expect(await screen.findByText(/Step 2 of 7/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Acme Tech Store")).toHaveValue("Saved Co");
  });

  it("blocks Next on business details until required fields are valid", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);
    await user.click(screen.getByRole("button", { name: "Begin Merchant Setup" }));
    await screen.findByText(/Step 2 of 7/);

    await user.click(screen.getByRole("button", { name: "Next: Settlement Account" }));

    expect(screen.getByText("Business name is required")).toBeInTheDocument();
    expect(screen.getByText("Website URL is required")).toBeInTheDocument();
    expect(screen.getByText("Support email is required")).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 7/)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText("e.g. Acme Tech Store"), BUSINESS_NAME);
    const [country, category] = screen.getAllByRole("combobox");
    await user.selectOptions(country, "United States");
    await user.selectOptions(category, "E-commerce & Retail");
    await user.type(screen.getByPlaceholderText("https://example.com"), "not a url!!");
    await user.type(screen.getByPlaceholderText("support@acme.com"), "support@acme.com");
    await user.click(screen.getByRole("button", { name: "Next: Settlement Account" }));

    expect(
      screen.getByText("Please enter a valid website URL (e.g. https://example.com)")
    ).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 7/)).toBeInTheDocument();

    await user.clear(screen.getByPlaceholderText("https://example.com"));
    await user.type(screen.getByPlaceholderText("https://example.com"), "acme.com");
    await user.click(screen.getByRole("button", { name: "Next: Settlement Account" }));

    expect(await screen.findByText(/Step 3 of 7/)).toBeInTheDocument();
    expect(getOnboardingState().business).toMatchObject({
      name: BUSINESS_NAME,
      website: "https://acme.com",
      supportEmail: "support@acme.com",
    });
  });

  it("blocks settlement Next until a custom address is a valid Stellar key", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);
    await user.click(screen.getByRole("button", { name: "Begin Merchant Setup" }));
    await fillBusinessDetails(user);
    await user.click(screen.getByRole("button", { name: "Next: Settlement Account" }));
    await screen.findByText(/Step 3 of 7/);

    await user.click(screen.getAllByRole("radio")[1]);
    const addressInput = screen.getByPlaceholderText(/^GXXXX/);

    await user.click(screen.getByRole("button", { name: "Next: Trustlines Setup" }));
    expect(screen.getByText("Please enter a Stellar public key address")).toBeInTheDocument();

    await user.type(addressInput, "GBAD");
    await user.click(screen.getByRole("button", { name: "Next: Trustlines Setup" }));
    expect(screen.getByText(/Invalid Stellar address/)).toBeInTheDocument();
    expect(screen.getByText(/Step 3 of 7/)).toBeInTheDocument();

    await user.clear(addressInput);
    await user.type(addressInput, VALID_CUSTOM_ADDRESS);
    await user.click(screen.getByRole("button", { name: "Next: Trustlines Setup" }));

    expect(await screen.findByText(/Step 4 of 7/)).toBeInTheDocument();
    expect(getOnboardingState().settlement).toEqual({
      type: "custom",
      address: VALID_CUSTOM_ADDRESS,
      connectedWalletAddress: DEFAULT_CONNECTED_WALLET,
    });
  });

  it("Back preserves data entered on earlier steps", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);
    await reachSettlementStep(user);

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByText(/Step 2 of 7/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. Acme Tech Store")).toHaveValue(BUSINESS_NAME);
    expect(screen.getByPlaceholderText("support@acme.com")).toHaveValue("support@acme.com");

    await user.click(screen.getByRole("button", { name: "Next: Settlement Account" }));
    await screen.findByText(/Step 3 of 7/);
    await user.click(screen.getAllByRole("radio")[1]);
    await user.type(screen.getByPlaceholderText(/^GXXXX/), VALID_CUSTOM_ADDRESS);
    await user.click(screen.getByRole("button", { name: "Next: Trustlines Setup" }));
    await screen.findByText(/Step 4 of 7/);

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(await screen.findByText(/Step 3 of 7/)).toBeInTheDocument();
    expect(screen.getAllByRole("radio")[1]).toBeChecked();
    expect(screen.getByPlaceholderText(/^GXXXX/)).toHaveValue(VALID_CUSTOM_ADDRESS);
  });

  describe("trustlines step", () => {
    beforeEach(() => {
      seedOnboarding({
        currentStep: 4,
        completedSteps: [1, 2, 3],
        business: {
          ...INITIAL_ONBOARDING_STATE.business,
          name: BUSINESS_NAME,
          country: "United States",
          category: "E-commerce & Retail",
          website: "https://acme.com",
          supportEmail: "support@acme.com",
        },
        settlement: {
          type: "connected",
          address: DEFAULT_CONNECTED_WALLET,
          connectedWalletAddress: DEFAULT_CONNECTED_WALLET,
        },
      });
    });

    it("checks the settlement account against Horizon on mount", async () => {
      render(<OnboardingWizard />);

      expect(await screen.findByText("Unfunded")).toBeInTheDocument();
      expect(stellar.checkStellarAccount).toHaveBeenCalledWith(DEFAULT_CONNECTED_WALLET);
    });

    it("shows already-funded accounts and existing trustlines from Horizon", async () => {
      stellar.checkStellarAccount.mockResolvedValue({
        funded: true,
        xlmBalance: "10000.0000000",
        hasUsdcTrustline: true,
        hasEurcTrustline: false,
      });
      render(<OnboardingWizard />);

      expect(await screen.findByText("Funded (Active)")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Already Funded/ })).toBeDisabled();
      expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
    });

    it("requires funding before a trustline can be added", async () => {
      const user = userEvent.setup();
      render(<OnboardingWizard />);
      await screen.findByText("Unfunded");

      const addButtons = screen.getAllByRole("button", { name: "+ Add Trustline" });
      await user.click(addButtons[0]);

      expect(
        screen.getByText(/Account must be funded with XLM before adding trustlines/)
      ).toBeInTheDocument();
      expect(stellar.requestAddTrustline).not.toHaveBeenCalled();
    });

    it("funds via Friendbot, adds USDC, and surfaces wallet rejections", async () => {
      const user = userEvent.setup();
      render(<OnboardingWizard />);
      await screen.findByText("Unfunded");

      await user.click(screen.getByRole("button", { name: /Fund via Friendbot/ }));

      expect(stellar.fundWithFriendbot).toHaveBeenCalledWith(DEFAULT_CONNECTED_WALLET);
      expect(await screen.findByText("Funded (Active)")).toBeInTheDocument();
      expect(screen.getByText("Account funded with 10,000 test XLM.")).toBeInTheDocument();

      const addButtons = screen.getAllByRole("button", { name: "+ Add Trustline" });
      await user.click(addButtons[0]);
      expect(stellar.requestAddTrustline).toHaveBeenLastCalledWith("USDC", DEFAULT_CONNECTED_WALLET);
      expect(
        await screen.findByText(/USDC trustline successfully established/)
      ).toBeInTheDocument();

      stellar.requestAddTrustline.mockResolvedValueOnce({
        success: false,
        message: "Trustline rejected by wallet.",
      });
      await user.click(screen.getAllByRole("button", { name: "+ Add Trustline" })[0]);
      expect(await screen.findByText("Trustline rejected by wallet.")).toBeInTheDocument();
    });

    it("saves trustline results and continues to branding", async () => {
      const user = userEvent.setup();
      render(<OnboardingWizard />);
      await screen.findByText("Unfunded");

      await user.click(screen.getByRole("button", { name: "+ Add All Trustlines" }));
      await waitFor(() =>
        expect(screen.getByText(/USDC & EURC trustlines established/)).toBeInTheDocument()
      );
      expect(stellar.fundWithFriendbot).toHaveBeenCalledTimes(1);

      await user.click(screen.getByRole("button", { name: "Next: Branding" }));

      expect(await screen.findByText(/Step 5 of 7/)).toBeInTheDocument();
      expect(getOnboardingState().trustlines).toMatchObject({
        usdc: true,
        eurc: true,
        accountFunded: true,
        txHash: "0123456789abcdef0123456789abcdef",
      });
    });
  });

  it("walks every step and completion lands on StepDone", async () => {
    const user = userEvent.setup();
    render(<OnboardingWizard />);
    await reachSettlementStep(user);

    await user.click(screen.getByRole("button", { name: "Next: Trustlines Setup" }));
    await screen.findByText("Unfunded");
    await user.click(screen.getByRole("button", { name: "Next: Branding" }));
    await screen.findByText(/Step 5 of 7/);

    await user.click(screen.getByRole("button", { name: "Skip for now" }));
    await screen.findByText(/Step 6 of 7/);

    await user.click(screen.getByRole("button", { name: "Next: Review & Summary" }));
    expect(await screen.findByText(/Step 7 of 7/)).toBeInTheDocument();
    expect(screen.getByText("Merchant Profile Configured")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(BUSINESS_NAME))).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Complete Onboarding & Go to Overview" })
    );

    expect(completeProfileMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/overview");
    expect(getOnboardingState()).toMatchObject({ isCompleted: true });
    expect(getOnboardingState().completedSteps).toEqual(
      expect.arrayContaining([1, 2, 3, 4, 5, 6, 7])
    );
    expect(getMerchantUser()).toMatchObject({
      isProfileCompleted: true,
      name: BUSINESS_NAME,
    });
  });
});
