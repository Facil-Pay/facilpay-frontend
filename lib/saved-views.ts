"use client";

import { useSyncExternalStore } from "react";
import { ASSET_TYPES, isPaymentStatus, type AssetType, type PaymentStatus } from "@/lib/types";

// ─── Payment list URL state ───────────────────────────────────────────────────

export const PAYMENT_SORTS = ["date_desc", "date_asc", "amount_desc", "amount_asc"] as const;
export type PaymentSort = (typeof PAYMENT_SORTS)[number];
export const DEFAULT_PAYMENT_SORT: PaymentSort = "date_desc";

/** Filters, search and sort of the payments list, as stored in the URL. */
export interface PaymentListState {
  q: string;
  status: PaymentStatus | null;
  asset: AssetType | null;
  from: string;
  to: string;
  sort: PaymentSort;
}

export const EMPTY_PAYMENT_LIST_STATE: PaymentListState = {
  q: "",
  status: null,
  asset: null,
  from: "",
  to: "",
  sort: DEFAULT_PAYMENT_SORT,
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads list state from a query string, dropping anything invalid. */
export function parsePaymentListState(
  params: URLSearchParams | string,
): PaymentListState {
  const search = typeof params === "string" ? new URLSearchParams(params) : params;
  const status = search.get("status");
  const asset = search.get("asset");
  const sort = search.get("sort");
  const from = search.get("from") ?? "";
  const to = search.get("to") ?? "";
  return {
    q: (search.get("q") ?? "").slice(0, 200),
    status: isPaymentStatus(status) ? status : null,
    asset: (ASSET_TYPES as readonly string[]).includes(asset ?? "") ? (asset as AssetType) : null,
    from: ISO_DATE.test(from) ? from : "",
    to: ISO_DATE.test(to) ? to : "",
    sort: (PAYMENT_SORTS as readonly string[]).includes(sort ?? "")
      ? (sort as PaymentSort)
      : DEFAULT_PAYMENT_SORT,
  };
}

/**
 * Canonical query string for list state: fixed key order, defaults
 * omitted, so two equal states always produce the same string.
 */
export function serializePaymentListState(state: PaymentListState): string {
  const params = new URLSearchParams();
  const q = state.q.trim();
  if (q) params.set("q", q);
  if (state.status) params.set("status", state.status);
  if (state.asset) params.set("asset", state.asset);
  if (state.from) params.set("from", state.from);
  if (state.to) params.set("to", state.to);
  if (state.sort !== DEFAULT_PAYMENT_SORT) params.set("sort", state.sort);
  return params.toString();
}

/** Normalises any query string to its canonical form. */
export function canonicalQuery(query: string): string {
  return serializePaymentListState(parsePaymentListState(query));
}

// ─── Saved views ──────────────────────────────────────────────────────────────

export interface SavedView {
  id: string;
  name: string;
  /** Canonical query string restored when the view is opened */
  query: string;
  builtIn?: boolean;
}

export const BUILT_IN_VIEWS: readonly SavedView[] = [
  { id: "builtin:all", name: "All", query: "", builtIn: true },
  { id: "builtin:pending", name: "Pending", query: "status=pending", builtIn: true },
  { id: "builtin:failed", name: "Failed", query: "status=failed", builtIn: true },
  { id: "builtin:refunded", name: "Refunded", query: "status=refunded", builtIn: true },
];

export const VIEW_NAME_MAX_LENGTH = 40;
export const MAX_CUSTOM_VIEWS = 20;

export interface SavedViewsState {
  views: SavedView[];
  defaultViewId: string | null;
}

const EMPTY_STATE: SavedViewsState = { views: [], defaultViewId: null };

/** Returns an error message, or null when the name can be used. */
export function validateViewName(
  name: string,
  existing: readonly SavedView[],
  ignoreId?: string,
): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Enter a name for this view.";
  if (trimmed.length > VIEW_NAME_MAX_LENGTH) {
    return `Use ${VIEW_NAME_MAX_LENGTH} characters or fewer.`;
  }
  const taken = [...BUILT_IN_VIEWS, ...existing].some(
    (view) => view.id !== ignoreId && view.name.toLowerCase() === trimmed.toLowerCase(),
  );
  return taken ? "A view with this name already exists." : null;
}

/** All views to show as tabs: built-ins first, then the merchant's own. */
export function allViews(state: SavedViewsState): SavedView[] {
  return [...BUILT_IN_VIEWS, ...state.views];
}

/** The view whose query matches the current URL, if any. */
export function findActiveView(views: readonly SavedView[], query: string): SavedView | null {
  const current = canonicalQuery(query);
  return views.find((view) => canonicalQuery(view.query) === current) ?? null;
}

function sanitizeState(raw: unknown): SavedViewsState {
  if (!raw || typeof raw !== "object") return EMPTY_STATE;
  const candidate = raw as Partial<SavedViewsState>;
  const views = Array.isArray(candidate.views)
    ? candidate.views
        .filter(
          (v): v is SavedView =>
            !!v && typeof v.id === "string" && typeof v.name === "string" && typeof v.query === "string",
        )
        .map((v) => ({ id: v.id, name: v.name.slice(0, VIEW_NAME_MAX_LENGTH), query: canonicalQuery(v.query) }))
        .slice(0, MAX_CUSTOM_VIEWS)
    : [];
  const ids = new Set(allViews({ views, defaultViewId: null }).map((v) => v.id));
  const defaultViewId =
    typeof candidate.defaultViewId === "string" && ids.has(candidate.defaultViewId)
      ? candidate.defaultViewId
      : null;
  return { views, defaultViewId };
}

export function savedViewsStorageKey(merchantId: string): string {
  return `facilpay_payment_views:${merchantId}`;
}

// ─── Per-merchant store ───────────────────────────────────────────────────────

interface ViewStore {
  get: () => SavedViewsState;
  set: (next: SavedViewsState) => void;
  subscribe: (listener: () => void) => () => void;
}

const stores = new Map<string, ViewStore>();

function createViewStore(merchantId: string): ViewStore {
  const key = savedViewsStorageKey(merchantId);
  let state: SavedViewsState | null = null;
  const listeners = new Set<() => void>();

  const read = (): SavedViewsState => {
    if (typeof window === "undefined") return EMPTY_STATE;
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? sanitizeState(JSON.parse(raw)) : EMPTY_STATE;
    } catch {
      return EMPTY_STATE;
    }
  };

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    state = read();
    listeners.forEach((l) => l());
  };

  return {
    get: () => (state ??= read()),
    set: (next) => {
      state = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage full or unavailable: keep the in-memory copy */
      }
      listeners.forEach((l) => l());
    },
    subscribe: (listener) => {
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== "undefined") {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
  };
}

export function getViewStore(merchantId: string): ViewStore {
  let store = stores.get(merchantId);
  if (!store) {
    store = createViewStore(merchantId);
    stores.set(merchantId, store);
  }
  return store;
}

const uid = () => `view_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Pure state transitions, exported for tests. */
export const savedViewsReducer = {
  add(state: SavedViewsState, name: string, query: string): SavedViewsState {
    const view: SavedView = { id: uid(), name: name.trim(), query: canonicalQuery(query) };
    return { ...state, views: [...state.views, view] };
  },
  rename(state: SavedViewsState, id: string, name: string): SavedViewsState {
    return {
      ...state,
      views: state.views.map((v) => (v.id === id ? { ...v, name: name.trim() } : v)),
    };
  },
  remove(state: SavedViewsState, id: string): SavedViewsState {
    return {
      views: state.views.filter((v) => v.id !== id),
      defaultViewId: state.defaultViewId === id ? null : state.defaultViewId,
    };
  },
  setDefault(state: SavedViewsState, id: string | null): SavedViewsState {
    return { ...state, defaultViewId: id };
  },
};

/** Saved payment views for one merchant, persisted in localStorage. */
export function useSavedViews(merchantId: string) {
  const store = getViewStore(merchantId);
  const state = useSyncExternalStore(store.subscribe, store.get, () => EMPTY_STATE);
  const update = (fn: (s: SavedViewsState) => SavedViewsState) => store.set(fn(store.get()));

  return {
    state,
    views: allViews(state),
    canAddMore: state.views.length < MAX_CUSTOM_VIEWS,
    add: (name: string, query: string) => update((s) => savedViewsReducer.add(s, name, query)),
    rename: (id: string, name: string) => update((s) => savedViewsReducer.rename(s, id, name)),
    remove: (id: string) => update((s) => savedViewsReducer.remove(s, id)),
    setDefault: (id: string | null) => update((s) => savedViewsReducer.setDefault(s, id)),
  };
}
