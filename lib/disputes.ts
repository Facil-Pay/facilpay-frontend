"use client";

import { createLocalStore } from "./local-store";

export type DisputeStatus = "open" | "awaiting_merchant" | "resolved" | "closed";

export type DisputeReason =
  | "item_not_received"
  | "product_unacceptable"
  | "incorrect_amount"
  | "fraudulent"
  | "duplicate_payment"
  | "other";

export interface DisputeAttachment {
  name: string;
  size: string;
  type: string;
}

export interface DisputeMessage {
  id: string;
  sender: "customer" | "merchant" | "system";
  senderName: string;
  senderEmail?: string;
  content: string;
  createdAt: string;
  attachments?: DisputeAttachment[];
}

export interface DisputeCase {
  id: string;
  caseNumber: string;
  status: DisputeStatus;
  reason: DisputeReason;
  reasonLabel: string;
  paymentId: string;
  paymentAmount: number;
  disputedAmount: number;
  currency: string;
  customerEmail: string;
  customerWallet: string;
  createdAt: string;
  updatedAt: string;
  refundId?: string;
  refundedAmount?: number;
  resolutionNotes?: string;
  messages: DisputeMessage[];
  evidenceFiles: DisputeAttachment[];
}

export const DISPUTE_REASON_LABELS: Record<DisputeReason, string> = {
  item_not_received: "Item Not Received",
  product_unacceptable: "Product Damaged / Unacceptable",
  incorrect_amount: "Incorrect Amount Charged",
  fraudulent: "Unauthorized / Fraudulent",
  duplicate_payment: "Duplicate Payment",
  other: "Other Customer Dispute",
};

export const INITIAL_DISPUTE_CASES: DisputeCase[] = [
  {
    id: "disp_case_001",
    caseNumber: "CASE-2026-0042",
    status: "awaiting_merchant",
    reason: "item_not_received",
    reasonLabel: "Item Not Received",
    paymentId: "pay_1018_01",
    paymentAmount: 1500.0,
    disputedAmount: 1500.0,
    currency: "USDC",
    customerEmail: "enterprise@acme.com",
    customerWallet: "GA7Q2O5K6N3J8I7H4G1F9E2D5C8B0A3Z6Y9X2W5V8U1T4S7R0",
    createdAt: "2026-10-18T10:30:00Z",
    updatedAt: "2026-10-18T14:15:00Z",
    evidenceFiles: [
      { name: "shipping_carrier_inquiry.pdf", size: "245 KB", type: "application/pdf" },
      { name: "order_confirmation_1018.png", size: "1.2 MB", type: "image/png" },
    ],
    messages: [
      {
        id: "msg_001_1",
        sender: "customer",
        senderName: "Acme Procurement (John)",
        senderEmail: "enterprise@acme.com",
        content:
          "We paid $1,500 USDC via Stellar testnet on Oct 18th for the Enterprise hardware license, but the tracking number provided still shows 'Label Created'. Please check or refund the payment.",
        createdAt: "2026-10-18T10:30:00Z",
        attachments: [{ name: "shipping_carrier_inquiry.pdf", size: "245 KB", type: "application/pdf" }],
      },
      {
        id: "msg_001_2",
        sender: "merchant",
        senderName: "FacilPay Merchant Support",
        content:
          "Hello John, thank you for reaching out. We are verifying the dispatch batch with our logistics warehouse in Frankfurt. We will update you shortly.",
        createdAt: "2026-10-18T11:45:00Z",
      },
      {
        id: "msg_001_3",
        sender: "customer",
        senderName: "Acme Procurement (John)",
        senderEmail: "enterprise@acme.com",
        content:
          "Our accounting department has requested resolution today or we must file an on-chain report. Please issue a refund if shipment cannot be confirmed today.",
        createdAt: "2026-10-18T14:15:00Z",
      },
    ],
  },
  {
    id: "disp_case_002",
    caseNumber: "CASE-2026-0043",
    status: "open",
    reason: "product_unacceptable",
    reasonLabel: "Product Damaged / Unacceptable",
    paymentId: "pay_1018_02",
    paymentAmount: 2000.0,
    disputedAmount: 500.0,
    currency: "USDC",
    customerEmail: "finance@globex.io",
    customerWallet: "GB91234567890ABCDEF1234567890ABCDEF1234567890ABCDEF",
    createdAt: "2026-10-19T08:00:00Z",
    updatedAt: "2026-10-19T08:00:00Z",
    evidenceFiles: [
      { name: "damaged_packaging_photo.jpg", size: "850 KB", type: "image/jpeg" },
    ],
    messages: [
      {
        id: "msg_002_1",
        sender: "customer",
        senderName: "Globex Finance",
        senderEmail: "finance@globex.io",
        content:
          "Part of our bulk order arrived damaged. We would like to keep the functioning units and request a partial refund of $500 USDC for the damaged items.",
        createdAt: "2026-10-19T08:00:00Z",
        attachments: [{ name: "damaged_packaging_photo.jpg", size: "850 KB", type: "image/jpeg" }],
      },
    ],
  },
  {
    id: "disp_case_003",
    caseNumber: "CASE-2026-0040",
    status: "resolved",
    reason: "incorrect_amount",
    reasonLabel: "Incorrect Amount Charged",
    paymentId: "pay_1018_04",
    paymentAmount: 150.0,
    disputedAmount: 150.0,
    currency: "USDC",
    customerEmail: "refund@customer.com",
    customerWallet: "GC3344556677889900AABBCCDDEEFF00112233445566778899",
    refundId: "ref_2026_0012",
    refundedAmount: 150.0,
    resolutionNotes: "Full refund issued on Stellar testnet after promotional discount applied retroactively.",
    createdAt: "2026-10-17T14:00:00Z",
    updatedAt: "2026-10-18T18:05:00Z",
    evidenceFiles: [],
    messages: [
      {
        id: "msg_003_1",
        sender: "customer",
        senderName: "Customer Support Case",
        senderEmail: "refund@customer.com",
        content: "Promo code FALL2026 was not applied at checkout, charged full $150 USDC.",
        createdAt: "2026-10-17T14:00:00Z",
      },
      {
        id: "msg_003_2",
        sender: "merchant",
        senderName: "FacilPay Merchant Support",
        content: "We verified your promo code. Issuing full refund of $150 USDC now.",
        createdAt: "2026-10-18T18:00:00Z",
      },
      {
        id: "msg_003_3",
        sender: "system",
        senderName: "FacilPay System",
        content: "Dispute resolved with full refund of $150.00 USDC (Refund ID: ref_2026_0012).",
        createdAt: "2026-10-18T18:05:00Z",
      },
    ],
  },
  {
    id: "disp_case_004",
    caseNumber: "CASE-2026-0038",
    status: "closed",
    reason: "duplicate_payment",
    reasonLabel: "Duplicate Payment",
    paymentId: "pay_1016_02",
    paymentAmount: 2000.0,
    disputedAmount: 2000.0,
    currency: "USDC",
    customerEmail: "client@stellar-wave.xyz",
    customerWallet: "GA99442200113355778899AABBCCDDEEFF0011223344556677",
    resolutionNotes: "Customer identified that second payment belonged to another invoice; case closed mutually.",
    createdAt: "2026-10-16T15:00:00Z",
    updatedAt: "2026-10-16T17:30:00Z",
    evidenceFiles: [],
    messages: [
      {
        id: "msg_004_1",
        sender: "customer",
        senderName: "Stellar Wave Team",
        senderEmail: "client@stellar-wave.xyz",
        content: "We thought this transaction was duplicated, but verified our internal purchase orders.",
        createdAt: "2026-10-16T15:00:00Z",
      },
      {
        id: "msg_004_2",
        sender: "system",
        senderName: "FacilPay System",
        content: "Dispute case marked closed by mutual agreement.",
        createdAt: "2026-10-16T17:30:00Z",
      },
    ],
  },
];

interface DisputeStoreState {
  cases: DisputeCase[];
  unreadNotificationCount: number;
}

export const disputeStore = createLocalStore<DisputeStoreState>("facilpay_disputes_v1", {
  cases: INITIAL_DISPUTE_CASES,
  unreadNotificationCount: 1, // case_002 is freshly open
});

export function useDisputes() {
  return disputeStore.useStore();
}

export const disputeActions = {
  addMessage(caseId: string, sender: "customer" | "merchant", senderName: string, content: string, attachments?: DisputeAttachment[]) {
    const newMsg: DisputeMessage = {
      id: "msg_" + Math.random().toString(36).slice(2, 9),
      sender,
      senderName,
      content,
      createdAt: new Date().toISOString(),
      attachments,
    };

    disputeStore.set((s) => ({
      ...s,
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              updatedAt: new Date().toISOString(),
              status: sender === "merchant" ? "awaiting_merchant" : "open",
              messages: [...c.messages, newMsg],
            }
          : c
      ),
    }));
    return newMsg;
  },

  resolveWithRefund(caseId: string, refundAmount: number, notes?: string) {
    const refundRef = "ref_" + Math.random().toString(36).slice(2, 10);
    const now = new Date().toISOString();

    const systemMsg: DisputeMessage = {
      id: "msg_sys_" + Math.random().toString(36).slice(2, 9),
      sender: "system",
      senderName: "FacilPay Automated Settlement",
      content: `Dispute resolved with refund of $${refundAmount.toFixed(2)} (Refund Reference: ${refundRef}).`,
      createdAt: now,
    };

    disputeStore.set((s) => ({
      ...s,
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status: "resolved",
              refundId: refundRef,
              refundedAmount: refundAmount,
              resolutionNotes: notes || `Resolved via refund of $${refundAmount.toFixed(2)}`,
              updatedAt: now,
              messages: [...c.messages, systemMsg],
            }
          : c
      ),
    }));

    return refundRef;
  },

  updateStatus(caseId: string, status: DisputeStatus, notes?: string) {
    const now = new Date().toISOString();
    const systemMsg: DisputeMessage = {
      id: "msg_sys_" + Math.random().toString(36).slice(2, 9),
      sender: "system",
      senderName: "FacilPay System",
      content: `Case status updated to ${status.replace("_", " ").toUpperCase()}${notes ? `: ${notes}` : ""}.`,
      createdAt: now,
    };

    disputeStore.set((s) => ({
      ...s,
      cases: s.cases.map((c) =>
        c.id === caseId
          ? {
              ...c,
              status,
              resolutionNotes: notes || c.resolutionNotes,
              updatedAt: now,
              messages: [...c.messages, systemMsg],
            }
          : c
      ),
    }));
  },

  dismissNotification() {
    disputeStore.set((s) => ({ ...s, unreadNotificationCount: 0 }));
  },
};
