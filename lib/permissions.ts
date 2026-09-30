/** Single source of truth for team roles and the permission matrix. */
export const ROLES = ["owner", "admin", "developer", "support", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = {
  "payments:view": "View payments & analytics",
  "payment-links:create": "Create payment links",
  "refunds:create": "Issue refunds",
  "escrow:manage": "Manage escrow & payouts",
  "developers:manage": "Manage webhooks & API keys",
  "team:manage": "Manage team & settings",
} as const;
export type Permission = keyof typeof PERMISSIONS;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: Object.keys(PERMISSIONS) as Permission[],
  admin: Object.keys(PERMISSIONS) as Permission[],
  developer: ["payments:view", "payment-links:create", "developers:manage"],
  support: ["payments:view", "payment-links:create", "refunds:create"],
  viewer: ["payments:view"],
};

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  developer: "Developer",
  support: "Support",
  viewer: "Viewer",
};

export function hasPermission(role: Role | null | undefined, permission: Permission): boolean {
  return !!role && ROLE_PERMISSIONS[role].includes(permission);
}

/** Route prefixes that require a permission. Longest match wins. */
export const ROUTE_PERMISSIONS: Record<string, Permission> = {
  "/escrow": "escrow:manage",
  "/payouts": "escrow:manage",
  "/refunds": "payments:view",
  "/webhooks": "developers:manage",
  "/developers": "developers:manage",
  "/settings/api-keys": "developers:manage",
  "/settings/webhooks": "developers:manage",
  "/settings": "team:manage",
  "/settings/notifications": "payments:view",
};

export function requiredPermissionForPath(pathname: string): Permission | null {
  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_PERMISSIONS[match] : null;
}

export function canAccessPath(role: Role | null | undefined, pathname: string): boolean {
  const permission = requiredPermissionForPath(pathname);
  return permission ? hasPermission(role, permission) : true;
}
