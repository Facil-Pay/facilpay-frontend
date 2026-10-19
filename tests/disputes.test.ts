import { describe, expect, it } from "vitest";
import {
  disputeActions,
  disputeStore,
  INITIAL_DISPUTE_CASES,
  type DisputeCase,
} from "@/lib/disputes";
import { canAccessPath, requiredPermissionForPath } from "@/lib/permissions";

describe("dispute case tracking and linking", () => {
  it("verifies all dispute cases link to an original payment ID", () => {
    for (const c of INITIAL_DISPUTE_CASES) {
      expect(c.paymentId).toBeDefined();
      expect(c.paymentId.startsWith("pay_")).toBe(true);
      expect(c.disputedAmount).toBeGreaterThan(0);
      expect(c.disputedAmount).toBeLessThanOrEqual(c.paymentAmount);
    }
  });

  it("links resolved dispute cases to their on-chain refund ID", () => {
    const resolvedCase = INITIAL_DISPUTE_CASES.find((c) => c.status === "resolved");
    expect(resolvedCase).toBeDefined();
    expect(resolvedCase?.refundId).toBeDefined();
    expect(resolvedCase?.refundId?.startsWith("ref_")).toBe(true);
    expect(resolvedCase?.refundedAmount).toBe(resolvedCase?.disputedAmount);
  });
});

describe("dispute resolution refund execution flow", () => {
  it("resolves a dispute with full or partial refund pre-filled and logs system event", () => {
    const targetCaseId = "disp_case_001";
    const refundAmount = 750.0;
    const note = "Partial settlement for delayed hardware shipment";

    const refundRef = disputeActions.resolveWithRefund(targetCaseId, refundAmount, note);

    expect(refundRef).toBeDefined();
    expect(refundRef.startsWith("ref_")).toBe(true);

    const updated = disputeStore.get().cases.find((c) => c.id === targetCaseId)!;
    expect(updated.status).toBe("resolved");
    expect(updated.refundId).toBe(refundRef);
    expect(updated.refundedAmount).toBe(750.0);
    expect(updated.resolutionNotes).toBe(note);

    const lastMsg = updated.messages[updated.messages.length - 1];
    expect(lastMsg.sender).toBe("system");
    expect(lastMsg.content).toContain(refundRef);
    expect(lastMsg.content).toContain("750.00");
  });

  it("appends merchant and customer messages into the interactive thread", () => {
    const targetCaseId = "disp_case_002";
    const messageContent = "We have checked with our courier and confirmed package status.";

    const msg = disputeActions.addMessage(
      targetCaseId,
      "merchant",
      "Support Lead",
      messageContent
    );

    expect(msg.id).toBeDefined();
    expect(msg.content).toBe(messageContent);
    expect(msg.sender).toBe("merchant");

    const updated = disputeStore.get().cases.find((c) => c.id === targetCaseId)!;
    expect(updated.status).toBe("awaiting_merchant");
    expect(updated.messages.some((m) => m.content === messageContent)).toBe(true);
  });

  it("allows closing a dispute case without refund", () => {
    const targetCaseId = "disp_case_002";
    const closingNote = "Issue resolved verbally with client; tracking renewed";

    disputeActions.updateStatus(targetCaseId, "closed", closingNote);

    const updated = disputeStore.get().cases.find((c) => c.id === targetCaseId)!;
    expect(updated.status).toBe("closed");
    expect(updated.resolutionNotes).toBe(closingNote);
  });
});

describe("dispute route access control", () => {
  it("guards /disputes requiring payments:view permission", () => {
    expect(requiredPermissionForPath("/disputes")).toBe("payments:view");
    expect(canAccessPath("owner", "/disputes")).toBe(true);
    expect(canAccessPath("admin", "/disputes")).toBe(true);
    expect(canAccessPath("developer", "/disputes")).toBe(true);
    expect(canAccessPath("support", "/disputes")).toBe(true);
    expect(canAccessPath("viewer", "/disputes")).toBe(true);
    expect(canAccessPath(null, "/disputes")).toBe(false);
  });
});
