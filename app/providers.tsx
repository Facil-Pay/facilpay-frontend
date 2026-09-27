"use client";

/**
 * app/providers.tsx
 *
 * Root client-side provider tree. Rendered once in app/layout.tsx.
 *
 * Responsibilities:
 *  1. Provides TanStack Query (QueryClientProvider) to the entire app
 *  2. Starts MSW browser mock worker when NEXT_PUBLIC_USE_MOCKS=true
 *  3. Mounts React Query Devtools in development only (tree-shaken in prod)
 *
 * MSW strategy:
 *  - The browser worker must be started before any fetch fires, so we
 *    use a `useSyncExternalStore`-compatible ready-state pattern:
 *    children are not rendered until the worker reports "ready".
 *  - The worker is imported dynamically so it is never bundled in
 *    production or when mocks are disabled.
 */

import {
  useState,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

// ─── Query client singleton ───────────────────────────────────────────────────

function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Data is considered fresh for 30 s before a background refetch fires
        staleTime: 30_000,
        // Retry once on failure (not three times — reduces noise during dev)
        retry: 1,
        // Show cached data immediately while fetching in the background
        refetchOnWindowFocus: true,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

// Keep a single client reference per browser tab (SSR creates a new one each render)
let browserQueryClient: QueryClient | undefined;

function getQueryClient(): QueryClient {
  if (typeof window === "undefined") {
    // Server: always create a fresh client so request state doesn't leak
    return makeQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }
  return browserQueryClient;
}

// ─── MSW initialiser ──────────────────────────────────────────────────────────

const MOCKS_ENABLED = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

async function startMockWorker(): Promise<void> {
  if (!MOCKS_ENABLED) return;
  // Import handlers (plain TS module, no browser APIs — safe to trace)
  const { handlers } = await import("@/lib/mocks/handlers");
  // startWorker uses Function('return import(...)') internally to avoid
  // Turbopack's static module trace reaching msw/browser
  const { startWorker } = await import("@/lib/mocks/browser");
  await startWorker(handlers);
}

// ─── Provider component ───────────────────────────────────────────────────────

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  const queryClient = getQueryClient();
  // Track whether the MSW worker has started so we don't render before it's
  // intercepting requests. When mocks are disabled this flips to true immediately.
  const [mockReady, setMockReady] = useState(!MOCKS_ENABLED);
  const workerStarted = useRef(false);

  useEffect(() => {
    if (workerStarted.current) return;
    workerStarted.current = true;

    startMockWorker()
      .then(() => setMockReady(true))
      .catch((err: unknown) => {
        console.error("[MSW] Failed to start mock worker:", err);
        // Unblock rendering even if the worker fails to start
        setMockReady(true);
      });
  }, []);

  if (!mockReady) {
    // Minimal loading state — avoids flash of un-mocked requests
    return (
      <div
        aria-label="Initialising mock service…"
        className="flex min-h-screen items-center justify-center bg-[#F5F7FA]"
      >
        <div className="flex flex-col items-center gap-3">
          <svg
            className="h-6 w-6 animate-spin text-[#55C2FF]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="currentColor" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <p className="text-xs text-zinc-400">Starting mock service…</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Devtools are tree-shaken in production builds automatically */}
      <ReactQueryDevtools
        initialIsOpen={false}
        buttonPosition="bottom-right"
      />
    </QueryClientProvider>
  );
}
