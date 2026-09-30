"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { canAccessPath } from "@/lib/permissions";
import { useCurrentMember } from "@/lib/team";

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const member = useCurrentMember();
  const allowed = canAccessPath(member?.status === "active" ? member.role : null, pathname);

  useEffect(() => {
    if (!allowed) router.replace(`/no-access?from=${encodeURIComponent(pathname)}`);
  }, [allowed, pathname, router]);

  return allowed ? <>{children}</> : null;
}
