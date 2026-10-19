import { describe, expect, it } from "vitest";
import { canAccessPath, requiredPermissionForPath } from "@/lib/permissions";
import {
  filterAuditEvents,
  generateAuditLogCsv,
  type AuditEvent,
  type AuditFilterState,
} from "@/lib/audit-log";

describe("audit log permissions and route guard", () => {
  it("restricts /settings/audit-log to owners and admins", () => {
    expect(requiredPermissionForPath("/settings/audit-log")).toBe("team:manage");
    expect(canAccessPath("owner", "/settings/audit-log")).toBe(true);
    expect(canAccessPath("admin", "/settings/audit-log")).toBe(true);
    expect(canAccessPath("developer", "/settings/audit-log")).toBe(false);
    expect(canAccessPath("support", "/settings/audit-log")).toBe(false);
    expect(canAccessPath("viewer", "/settings/audit-log")).toBe(false);
    expect(canAccessPath(null, "/settings/audit-log")).toBe(false);
  });
});

describe("audit log filtering", () => {
  const baseNow = new Date("2026-10-19T12:00:00Z").getTime();

  const mockEvents: AuditEvent[] = [
    {
      id: "evt_1",
      actor: { id: "u_1", name: "Alice Owner", email: "alice@facilpay.io", role: "owner" },
      action: "auth.login",
      actionLabel: "Successful Login",
      category: "auth",
      target: "Session Token",
      ipAddress: "192.168.1.10",
      timestamp: new Date("2026-10-19T11:00:00Z").toISOString(), // 1 hour ago
      details: "Freighter login",
    },
    {
      id: "evt_2",
      actor: { id: "u_2", name: "Bob Admin", email: "bob@facilpay.io", role: "admin" },
      action: "api_key.rolled",
      actionLabel: "API Key Rolled",
      category: "api_key",
      target: "pk_live_xyz123",
      ipAddress: "10.0.0.5",
      timestamp: new Date("2026-10-18T10:00:00Z").toISOString(), // ~26 hours ago
      details: "Live key rolled",
    },
    {
      id: "evt_3",
      actor: { id: "u_1", name: "Alice Owner", email: "alice@facilpay.io", role: "owner" },
      action: "payout.created",
      actionLabel: "Payout Initiated",
      category: "payout",
      target: "$5,000 USDC",
      ipAddress: "192.168.1.10",
      timestamp: new Date("2026-10-10T08:00:00Z").toISOString(), // ~9 days ago
      details: "Escrow release",
    },
  ];

  it("filters by category", () => {
    const filters: AuditFilterState = {
      searchQuery: "",
      category: "api_key",
      dateRange: "all",
    };
    const results = filterAuditEvents(mockEvents, filters, baseNow);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("evt_2");
  });

  it("filters by search query matching actor, action, or target", () => {
    const filterByName: AuditFilterState = {
      searchQuery: "Bob",
      category: "all",
      dateRange: "all",
    };
    expect(filterAuditEvents(mockEvents, filterByName, baseNow)).toHaveLength(1);

    const filterByTarget: AuditFilterState = {
      searchQuery: "USDC",
      category: "all",
      dateRange: "all",
    };
    expect(filterAuditEvents(mockEvents, filterByTarget, baseNow)).toHaveLength(1);

    const filterByIp: AuditFilterState = {
      searchQuery: "192.168.1.10",
      category: "all",
      dateRange: "all",
    };
    expect(filterAuditEvents(mockEvents, filterByIp, baseNow)).toHaveLength(2);
  });

  it("filters by date range", () => {
    const todayFilter: AuditFilterState = {
      searchQuery: "",
      category: "all",
      dateRange: "today",
    };
    const todayResults = filterAuditEvents(mockEvents, todayFilter, baseNow);
    expect(todayResults).toHaveLength(1);
    expect(todayResults[0].id).toBe("evt_1");

    const sevenDaysFilter: AuditFilterState = {
      searchQuery: "",
      category: "all",
      dateRange: "7d",
    };
    const sevenDaysResults = filterAuditEvents(mockEvents, sevenDaysFilter, baseNow);
    expect(sevenDaysResults).toHaveLength(2); // evt_1 and evt_2
  });
});

describe("audit log CSV generation", () => {
  it("formats CSV correctly with headers and escaped content", () => {
    const testEvents: AuditEvent[] = [
      {
        id: "evt_test",
        actor: { id: "u_test", name: "Tester", email: "test@example.com", role: "admin" },
        action: "settings.security_updated",
        actionLabel: "Security Updated",
        category: "settings",
        target: 'Policy with "Quotes"',
        ipAddress: "127.0.0.1",
        timestamp: "2026-10-19T10:00:00.000Z",
        details: "Configured 2FA",
      },
    ];

    const csv = generateAuditLogCsv(testEvents);
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe("Timestamp,Actor Name,Actor Email,Actor Role,Action,Target,IP Address,Details");
    expect(lines[1]).toContain('"2026-10-19T10:00:00.000Z"');
    expect(lines[1]).toContain('"Tester"');
    expect(lines[1]).toContain('"test@example.com"');
    expect(lines[1]).toContain('"admin"');
    expect(lines[1]).toContain('"Security Updated"');
    expect(lines[1]).toContain('"Policy with ""Quotes"""');
    expect(lines[1]).toContain('"127.0.0.1"');
    expect(lines[1]).toContain('"Configured 2FA"');
  });
});
