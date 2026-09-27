/**
 * lib/mocks/browser.ts
 *
 * MSW browser worker initialiser.
 *
 * This file intentionally does NOT import msw/browser at the top level.
 * Turbopack in Next.js 16 cannot resolve the "browser" export condition of
 * msw even inside client components, so we use a runtime-only dynamic import
 * that is genuinely deferred to browser execution.
 *
 * `startWorker()` is called from app/providers.tsx inside useEffect — it
 * will never run during SSR, so the dynamic import is safe.
 */

import type { handlers } from "./handlers";

type SetupWorkerFn = typeof import("msw/browser")["setupWorker"];
type WorkerInstance = ReturnType<SetupWorkerFn>;

let _worker: WorkerInstance | null = null;

/**
 * Lazily initialise and start the MSW service worker.
 * Must only be called from a browser context (e.g. inside useEffect).
 */
export async function startWorker(
  workerHandlers: typeof handlers
): Promise<void> {
  if (typeof window === "undefined") return;

  if (!_worker) {
    // True runtime import — not statically analysed by Turbopack
    const mod = await (Function('return import("msw/browser")')() as Promise<typeof import("msw/browser")>);
    _worker = mod.setupWorker(...workerHandlers);
  }

  await _worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}

export function stopWorker(): void {
  _worker?.stop();
}
