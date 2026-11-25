/** Single source of truth for team roles and the permission matrix. */
export const ROLES = ["owner", "admin", "developer", "support", "viewer"] as const;
/**
 * A team member's role. Derived from {@link ROLES}.
 */
export type Role = (typeof ROLES)[number];

/**
 * Permission keys mapped to the label shown in the team settings UI.
 */
export const PERMISSIONS = {
  "payments:view": "View payments & analytics",
  "payment-links:create": "Create payment links",
  "refunds:create": "Issue refunds",
  "escrow:manage": "Manage escrow & payouts",
  "developers:manage": "Manage webhooks & API keys",
  "team:manage": "Manage team & settings",
} as const;
/**
 * Key of {@link PERMISSIONS}.
 */
export type Permission = keyof typeof PERMISSIONS;

/**
 * Permissions granted to each role. Owner and admin receive every permission.
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: Object.keys(PERMISSIONS) as Permission[],
  admin: Object.keys(PERMISSIONS) as Permission[],
  developer: ["payments:view", "payment-links:create", "developers:manage"],
  support: ["payments:view", "payment-links:create", "refunds:create"],
  viewer: ["payments:view"],
};

/**
 * Display names for each role.
 */
export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  developer: "Developer",
  support: "Support",
  viewer: "Viewer",
};

/**
 * Returns whether a role grants a permission.
 *
 * @param role - Current user's role, or `null`/`undefined` when unknown. Unknown roles grant nothing.
 * @param permission - Permission to check.
 * @returns `true` when the role includes the permission.
 */
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

/**
 * Returns the permission needed to open a dashboard path, or `null` when the path is open to every role.
 *
 * The longest matching prefix in {@link ROUTE_PERMISSIONS} wins, so `/settings/api-keys` is governed by its own
 * entry rather than the broader `/settings` entry. A prefix matches itself and its sub-paths only, so `/payoutsX` does not match `/payouts`.
 *
 * @param pathname - Path to check, for example `/settings/api-keys`.
 * @returns The required permission, or `null` for unrestricted paths.
 *
 * @example
 * ```ts
 * requiredPermissionForPath("/settings/api-keys"); // "developers:manage"
 * requiredPermissionForPath("/dashboard"); // null
 * ```
 */
export function requiredPermissionForPath(pathname: string): Permission | null {
  const match = Object.keys(ROUTE_PERMISSIONS)
    .filter((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b.length - a.length)[0];
  return match ? ROUTE_PERMISSIONS[match] : null;
}

/**
 * Returns whether a role may open a dashboard path.
 *
 * Paths without a required permission are open to every role, including a missing role.
 *
 * @param role - Current user's role, or `null`/`undefined`.
 * @param pathname - Path to check.
 * @returns `true` when the path is unrestricted or the role has the required permission.
 */
export function canAccessPath(role: Role | null | undefined, pathname: string): boolean {
  const permission = requiredPermissionForPath(pathname);
  return permission ? hasPermission(role, permission) : true;
}
