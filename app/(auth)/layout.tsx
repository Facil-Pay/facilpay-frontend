import type { ReactNode } from "react";

/** Unauthenticated pages (login, onboarding) render without the dashboard shell. */
export default function AuthGroupLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
