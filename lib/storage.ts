import { OnboardingState, GettingStartedTasks, MerchantUser } from '@/types/onboarding';

export const STORAGE_KEYS = {
  ONBOARDING_DATA: 'facilpay_onboarding_state',
  GETTING_STARTED: 'facilpay_getting_started',
  MERCHANT_USER: 'facilpay_merchant_user',
  WEBHOOKS: 'facilpay_webhooks',
  API_KEYS: 'facilpay_api_keys',
  TEAMMATES: 'facilpay_teammates',
  DASHBOARD_LAYOUT: 'facilpay_dashboard_layout',
  AUDIT_EVENTS: 'facilpay_audit_events',
} as const;

export const DASHBOARD_WIDGETS = [
  'gettingStarted',
  'stats',
  'paymentLink',
  'recentPayments',
  'integrations',
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGETS)[number];

export interface DashboardLayout {
  order: DashboardWidgetId[];
  hidden: DashboardWidgetId[];
}

export interface StoredAuditEvent {
  id: string;
  actor: string;
  actionType: 'Webhooks';
  action: string;
  target: string;
  ip: string;
  timestamp: string;
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = {
  order: [...DASHBOARD_WIDGETS],
  hidden: [],
};

const dashboardLayoutSnapshots = new Map<string, DashboardLayout>();
const dashboardLayoutSubscribers = new Map<string, Set<() => void>>();
let auditEventsSnapshot: StoredAuditEvent[] | null = null;
const auditEventSubscribers = new Set<() => void>();

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

export function getDashboardLayout(userId: string): DashboardLayout {
  const saved = loadFromStorage<Partial<DashboardLayout> | null>(
    `${STORAGE_KEYS.DASHBOARD_LAYOUT}_${encodeURIComponent(userId)}`,
    null
  );
  if (!saved || !Array.isArray(saved.order) || !Array.isArray(saved.hidden)) {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  const valid = new Set<string>(DASHBOARD_WIDGETS);
  const order = saved.order.filter(
    (widget): widget is DashboardWidgetId =>
      typeof widget === 'string' && valid.has(widget)
  );
  const hidden = saved.hidden.filter(
    (widget): widget is DashboardWidgetId =>
      typeof widget === 'string' && valid.has(widget)
  );

  return {
    order: [...new Set([...order, ...DASHBOARD_WIDGETS])],
    hidden: [...new Set(hidden)],
  };
}

export function getDashboardLayoutSnapshot(userId: string): DashboardLayout {
  const key = `${STORAGE_KEYS.DASHBOARD_LAYOUT}_${encodeURIComponent(userId)}`;
  const cached = dashboardLayoutSnapshots.get(key);
  if (cached) return cached;
  const layout = getDashboardLayout(userId);
  dashboardLayoutSnapshots.set(key, layout);
  return layout;
}

export function subscribeToDashboardLayout(
  userId: string,
  listener: () => void
): () => void {
  if (typeof window === 'undefined') return () => {};
  const key = `${STORAGE_KEYS.DASHBOARD_LAYOUT}_${encodeURIComponent(userId)}`;
  let subscribers = dashboardLayoutSubscribers.get(key);
  if (!subscribers) {
    subscribers = new Set();
    dashboardLayoutSubscribers.set(key, subscribers);
  }
  subscribers.add(listener);

  const handleStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    dashboardLayoutSnapshots.delete(key);
    listener();
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    subscribers?.delete(listener);
    if (subscribers?.size === 0) dashboardLayoutSubscribers.delete(key);
    window.removeEventListener('storage', handleStorage);
  };
}

export function saveDashboardLayout(userId: string, layout: DashboardLayout): void {
  const key = `${STORAGE_KEYS.DASHBOARD_LAYOUT}_${encodeURIComponent(userId)}`;
  saveToStorage(key, layout);
  dashboardLayoutSnapshots.set(key, layout);
  dashboardLayoutSubscribers.get(key)?.forEach((listener) => listener());
}

export function saveAuditEvent(event: StoredAuditEvent): void {
  const events = getStoredAuditEvents();
  auditEventsSnapshot = [event, ...events];
  saveToStorage(STORAGE_KEYS.AUDIT_EVENTS, auditEventsSnapshot);
  auditEventSubscribers.forEach((listener) => listener());
}

export function getStoredAuditEvents(): StoredAuditEvent[] {
  if (auditEventsSnapshot) return auditEventsSnapshot;
  auditEventsSnapshot = loadFromStorage<StoredAuditEvent[]>(STORAGE_KEYS.AUDIT_EVENTS, []);
  return auditEventsSnapshot;
}

export function subscribeToAuditEvents(listener: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  auditEventSubscribers.add(listener);
  const handleStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEYS.AUDIT_EVENTS) return;
    auditEventsSnapshot = null;
    listener();
  };
  window.addEventListener('storage', handleStorage);

  return () => {
    auditEventSubscribers.delete(listener);
    window.removeEventListener('storage', handleStorage);
  };
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
