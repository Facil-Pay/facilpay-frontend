/**
 * lib/hooks/useSavedViews.ts
 *
 * Hook for managing saved payment list views with localStorage persistence.
 * Allows merchants to save, rename, delete, and set default filter combinations.
 */

import { useCallback, useEffect, useState } from "react";

export interface SavedView {
  id: string;
  name: string;
  description?: string;
  filters: PaymentFilters;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentFilters {
  status?: string[];
  method?: string[];
  network?: string[];
  dateFrom?: string;
  dateTo?: string;
}

const BUILT_IN_VIEWS: Record<string, SavedView> = {
  all: {
    id: "all",
    name: "All Payments",
    description: "View all payments",
    filters: {},
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
    isDefault: true,
  },
  pending: {
    id: "pending",
    name: "Pending",
    description: "Payments awaiting processing",
    filters: { status: ["pending", "processing"] },
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  failed: {
    id: "failed",
    name: "Failed",
    description: "Failed or cancelled payments",
    filters: { status: ["failed", "cancelled"] },
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
  refunded: {
    id: "refunded",
    name: "Refunded",
    description: "Refunded or partially refunded payments",
    filters: { status: ["refunded", "partially_refunded"] },
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  },
};

const STORAGE_KEY = "facilpay:saved-views:v1";

export function useSavedViews(merchantId: string) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [defaultViewId, setDefaultViewId] = useState<string>("all");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load views from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const data = stored ? JSON.parse(stored) : {};
      const merchantViews = data[merchantId] || {};
      const loadedViews = Object.values(merchantViews) as SavedView[];
      const defaultId = (data[`${merchantId}:default`] as string) || "all";
      setViews([Object.values(BUILT_IN_VIEWS)[0], ...loadedViews]);
      setDefaultViewId(defaultId);
    } catch (error) {
      console.error("Failed to load saved views:", error);
      setViews(Object.values(BUILT_IN_VIEWS));
    }
    setIsLoaded(true);
  }, [merchantId]);

  // Persist views to localStorage
  const persistViews = useCallback(
    (updatedViews: SavedView[], defaultId: string) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const data = stored ? JSON.parse(stored) : {};
        const customViews = updatedViews.filter((v) => !BUILT_IN_VIEWS[v.id]);
        data[merchantId] = Object.fromEntries(
          customViews.map((v) => [v.id, v])
        );
        data[`${merchantId}:default`] = defaultId;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch (error) {
        console.error("Failed to persist saved views:", error);
      }
    },
    [merchantId]
  );

  const saveView = useCallback(
    (name: string, filters: PaymentFilters, sortField?: string, sortOrder?: "asc" | "desc", search?: string) => {
      const id = `view-${Date.now()}`;
      const newView: SavedView = {
        id,
        name,
        filters,
        sortField,
        sortOrder,
        search,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...views, newView];
      setViews(updated);
      persistViews(updated, defaultViewId);
      return newView;
    },
    [views, defaultViewId, persistViews]
  );

  const updateView = useCallback(
    (id: string, updates: Partial<SavedView>) => {
      const updated = views.map((v) =>
        v.id === id
          ? {
              ...v,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : v
      );
      setViews(updated);
      persistViews(updated, defaultViewId);
    },
    [views, defaultViewId, persistViews]
  );

  const deleteView = useCallback(
    (id: string) => {
      if (BUILT_IN_VIEWS[id]) return; // Cannot delete built-in views
      const updated = views.filter((v) => v.id !== id);
      const newDefaultId = defaultViewId === id ? "all" : defaultViewId;
      setViews(updated);
      setDefaultViewId(newDefaultId);
      persistViews(updated, newDefaultId);
    },
    [views, defaultViewId, persistViews]
  );

  const setDefault = useCallback(
    (id: string) => {
      setDefaultViewId(id);
      persistViews(views, id);
    },
    [views, persistViews]
  );

  const getView = useCallback(
    (id: string) => views.find((v) => v.id === id),
    [views]
  );

  const getDefaultView = useCallback(
    () => views.find((v) => v.id === defaultViewId) || views[0],
    [views, defaultViewId]
  );

  return {
    views,
    defaultViewId,
    isLoaded,
    saveView,
    updateView,
    deleteView,
    setDefault,
    getView,
    getDefaultView,
  };
}
