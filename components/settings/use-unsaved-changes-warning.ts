"use client";

import { useEffect } from "react";

const MESSAGE = "You have unsaved changes. Leave this page and discard them?";

/**
 * Warns before leaving the page while a form has pending edits:
 *  - browser reload / tab close via `beforeunload`
 *  - in-app navigation by intercepting link clicks in the capture phase,
 *    before Next.js <Link> handles them (the App Router has no route events)
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank") return;

      const url = new URL(anchor.href, window.location.href);
      const samePage = url.origin === window.location.origin && url.pathname === window.location.pathname;
      if (samePage) return;

      if (!window.confirm(MESSAGE)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [isDirty]);
}
