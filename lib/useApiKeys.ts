"use client";

import { useState, useEffect, useCallback } from "react";
import { type ApiKeyItem, type NetworkMode, INITIAL_API_KEYS } from "./apiKeys";

const STORAGE_KEY = "facilpay_api_keys";

function loadKeys(): ApiKeyItem[] {
  if (typeof window === "undefined") return INITIAL_API_KEYS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ApiKeyItem[];
  } catch {
    // ignore parse errors
  }
  return INITIAL_API_KEYS;
}

function saveKeys(keys: ApiKeyItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // ignore storage errors
  }
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyItem[]>(INITIAL_API_KEYS);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setKeys(loadKeys());
  }, []);

  const addKey = useCallback((key: ApiKeyItem) => {
    setKeys((prev) => {
      const next = [key, ...prev];
      saveKeys(next);
      return next;
    });
  }, []);

  const revokeKey = useCallback((keyId: string) => {
    setKeys((prev) => {
      const next = prev.map((k) => (k.id === keyId ? { ...k, status: "revoked" as const } : k));
      saveKeys(next);
      return next;
    });
  }, []);

  const rollKey = useCallback(
    (oldKeyId: string, newKey: ApiKeyItem, gracePeriod: "now" | "1h" | "24h" | "7d") => {
      const now = new Date();
      let rollingExpiresAt = now.toISOString();
      if (gracePeriod === "1h") rollingExpiresAt = new Date(now.getTime() + 3600 * 1000).toISOString();
      else if (gracePeriod === "24h") rollingExpiresAt = new Date(now.getTime() + 86400 * 1000).toISOString();
      else if (gracePeriod === "7d") rollingExpiresAt = new Date(now.getTime() + 7 * 86400 * 1000).toISOString();

      setKeys((prev) => {
        const next = [
          newKey,
          ...prev.map((k) =>
            k.id === oldKeyId
              ? {
                  ...k,
                  status: gracePeriod === "now" ? ("revoked" as const) : ("rolling" as const),
                  rollingExpiresAt,
                  gracePeriod,
                }
              : k,
          ),
        ];
        saveKeys(next);
        return next;
      });
    },
    [],
  );

  const filterByNetwork = useCallback(
    (network: NetworkMode) => keys.filter((k) => k.network === network),
    [keys],
  );

  return { keys, addKey, revokeKey, rollKey, filterByNetwork };
}
