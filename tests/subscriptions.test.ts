import { billingIntervalLabel, nextBillingDate } from "@/lib/subscriptions";

describe("recurring billing schedules", () => {
  test("advances weekly and quarterly schedules by the expected interval", () => {
    expect(nextBillingDate("2026-10-21T10:30:00.000Z", "weekly")).toBe("2026-10-28T10:30:00.000Z");
    expect(nextBillingDate("2026-10-21T10:30:00.000Z", "quarterly")).toBe("2027-01-21T10:30:00.000Z");
  });

  test("keeps month-end schedules on the last available day", () => {
    expect(nextBillingDate("2026-01-31T10:30:00.000Z", "monthly")).toBe("2026-02-28T10:30:00.000Z");
    expect(nextBillingDate("2024-02-29T10:30:00.000Z", "yearly")).toBe("2025-02-28T10:30:00.000Z");
  });

  test("rejects invalid billing start dates and labels cadence", () => {
    expect(() => nextBillingDate("not-a-date", "monthly")).toThrow("valid billing start date");
    expect(billingIntervalLabel("quarterly")).toBe("Every 3 months");
  });
});