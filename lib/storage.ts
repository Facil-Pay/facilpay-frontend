import { OnboardingState, GettingStartedTasks, MerchantUser } from '@/types/onboarding';

export const STORAGE_KEYS = {
  ONBOARDING_DATA: 'facilpay_onboarding_state',
  GETTING_STARTED: 'facilpay_getting_started',
  MERCHANT_USER: 'facilpay_merchant_user',
  WEBHOOKS: 'facilpay_webhooks',
  API_KEYS: 'facilpay_api_keys',
  TEAMMATES: 'facilpay_teammates',
} as const;

export const DEFAULT_CONNECTED_WALLET = 'GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF';

export const INITIAL_ONBOARDING_STATE: OnboardingState = {
  currentStep: 1,
  completedSteps: [],
  isCompleted: false,
  business: {
    name: '',
    country: '',
    category: '',
    website: '',
    supportEmail: '',
  },
  settlement: {
    type: 'connected',
    address: DEFAULT_CONNECTED_WALLET,
    connectedWalletAddress: DEFAULT_CONNECTED_WALLET,
  },
  trustlines: {
    usdc: false,
    eurc: false,
    accountFunded: false,
    accountBalanceXlm: '0.0000000',
  },
  branding: {
    logoUrl: '',
    brandColor: '#55C2FF', // FacilPay primary color
    brandName: '',
    skipped: false,
  },
  paymentLink: {
    id: '',
    title: '',
    amount: '',
    currency: 'USDC',
    description: '',
    paymentUrl: '',
    createdAt: '',
    status: 'active',
  },
};

export const INITIAL_GETTING_STARTED: GettingStartedTasks = {
  addWebhook: false,
  createApiKey: false,
  inviteTeammate: false,
  receiveFirstPayment: false,
  dismissed: false,
};

export const INITIAL_USER: MerchantUser = {
  id: 'usr_merch_01',
  email: 'merchant@example.com',
  name: 'New Merchant',
  isLoggedIn: true,
  isProfileCompleted: false,
};

// Safe localStorage accessor for SSR
export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (err) {
    console.warn(`Error reading localStorage key "${key}":`, err);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Error writing to localStorage key "${key}":`, err);
  }
}

export function getOnboardingState(): OnboardingState {
  return loadFromStorage<OnboardingState>(STORAGE_KEYS.ONBOARDING_DATA, INITIAL_ONBOARDING_STATE);
}

export function saveOnboardingState(state: OnboardingState): void {
  saveToStorage(STORAGE_KEYS.ONBOARDING_DATA, state);
  
  // If completed, update merchant profile status
  if (state.isCompleted) {
    const user = getMerchantUser();
    saveMerchantUser({
      ...user,
      isProfileCompleted: true,
      name: state.business.name || user.name,
    });
  }
}

export function getGettingStartedTasks(): GettingStartedTasks {
  return loadFromStorage<GettingStartedTasks>(STORAGE_KEYS.GETTING_STARTED, INITIAL_GETTING_STARTED);
}

export function saveGettingStartedTasks(tasks: GettingStartedTasks): void {
  saveToStorage(STORAGE_KEYS.GETTING_STARTED, tasks);
}

export function getMerchantUser(): MerchantUser {
  return loadFromStorage<MerchantUser>(STORAGE_KEYS.MERCHANT_USER, INITIAL_USER);
}

export function saveMerchantUser(user: MerchantUser): void {
  saveToStorage(STORAGE_KEYS.MERCHANT_USER, user);
}

export function removeFromStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable (private mode) — ignore
  }
}

export function resetOnboardingProgress(): void {
  removeFromStorage(STORAGE_KEYS.ONBOARDING_DATA);
  removeFromStorage(STORAGE_KEYS.GETTING_STARTED);
  removeFromStorage(STORAGE_KEYS.MERCHANT_USER);
}
