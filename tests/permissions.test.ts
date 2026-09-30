import { describe, expect, it } from "vitest";
import { canAccessPath, hasPermission, requiredPermissionForPath } from "@/lib/permissions";

describe("permissions", () => {
  it("matches the role matrix", () => {
    expect(hasPermission("owner", "team:manage")).toBe(true);
    expect(hasPermission("admin", "escrow:manage")).toBe(true);
    expect(hasPermission("developer", "refunds:create")).toBe(false);
    expect(hasPermission("developer", "developers:manage")).toBe(true);
    expect(hasPermission("support", "refunds:create")).toBe(true);
    expect(hasPermission("support", "developers:manage")).toBe(false);
    expect(hasPermission("viewer", "payment-links:create")).toBe(false);
    expect(hasPermission(null, "payments:view")).toBe(false);
  });

  it("guards routes by longest prefix", () => {
    expect(requiredPermissionForPath("/settings/api-keys")).toBe("developers:manage");
    expect(requiredPermissionForPath("/settings/team")).toBe("team:manage");
    expect(requiredPermissionForPath("/overview")).toBeNull();
    expect(canAccessPath("developer", "/escrow")).toBe(false);
    expect(canAccessPath("viewer", "/settings/notifications")).toBe(true);
  });
});
