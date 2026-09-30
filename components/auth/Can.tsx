"use client";

import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import { hasPermission, PERMISSIONS, type Permission } from "@/lib/permissions";
import { useCurrentMember } from "@/lib/team";

export function usePermission(permission: Permission): boolean {
  const member = useCurrentMember();
  return hasPermission(member?.status === "active" ? member.role : null, permission);
}

interface CanProps {
  permission: Permission;
  children: ReactNode;
  /** "hide" (default) removes the element; "disable" renders it disabled with a tooltip. */
  mode?: "hide" | "disable";
  fallback?: ReactNode;
}

export function Can({ permission, children, mode = "hide", fallback = null }: CanProps) {
  const allowed = usePermission(permission);
  if (allowed) return <>{children}</>;
  if (mode === "hide" || !isValidElement(children)) return <>{fallback}</>;
  const child = children as ReactElement<{ disabled?: boolean; "aria-disabled"?: boolean }>;
  return (
    <Tooltip content={`Your role doesn't allow: ${PERMISSIONS[permission]}`}>
      <span tabIndex={0} className="inline-flex">
        {cloneElement(child, { disabled: true, "aria-disabled": true })}
      </span>
    </Tooltip>
  );
}
