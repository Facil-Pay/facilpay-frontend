import type { TaxBreakdown } from '@/lib/tax';

export interface BusinessDetails {
  name: string;
  country: string;
  category: string;
  website: string;
  supportEmail: string;
}

export interface SettlementAccount {
  type: 'connected' | 'custom';
  address: string;
  connectedWalletAddress: string;
}

export interface TrustlinesState {
  usdc: boolean;
  eurc: boolean;
  accountFunded: boolean;
  accountBalanceXlm?: string;
  lastChecked?: string;
  txHash?: string;
}

export interface BrandingDetails {
  logoUrl?: string;
  brandColor: string;
  brandName?: string;
  skipped: boolean;
}

export interface PaymentLinkData {
  id: string;
  title: string;
  amount: string;
  currency: 'USDC' | 'EURC' | 'XLM';
  description: string;
  paymentUrl: string;
  createdAt: string;
  status: 'active' | 'paid' | 'expired';
  /**
   * Tax applied when the link was created. `amount` is always the total the
   * customer pays; links created without tax omit this field.
   */
  tax?: TaxBreakdown;
}

export interface OnboardingState {
  currentStep: number; // 1 to 7
  completedSteps: number[];
  isCompleted: boolean;
  business: BusinessDetails;
  settlement: SettlementAccount;
  trustlines: TrustlinesState;
  branding: BrandingDetails;
  paymentLink: PaymentLinkData;
}

export interface GettingStartedTasks {
  addWebhook: boolean;
  createApiKey: boolean;
  inviteTeammate: boolean;
  receiveFirstPayment: boolean;
  dismissed: boolean;
}

export interface MerchantUser {
  id: string;
  email: string;
  name: string;
  isLoggedIn: boolean;
  isProfileCompleted: boolean;
}

export interface WebhookConfig {
  id: string;
  url: string;
  events: string[];
  secret: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  key: string;
  type: 'live' | 'test';
  createdAt: string;
}

export interface TeammateItem {
  id: string;
  email: string;
  role: 'admin' | 'developer' | 'accountant' | 'viewer';
  status: 'pending' | 'active';
  invitedAt: string;
}
