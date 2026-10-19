"use client";

import { createLocalStore } from "./local-store";
import { escapeCsvField, generateExportFileName } from "./csvExport";

export type SettlementPeriodType = "daily" | "weekly";
export type SettlementStatus = "balanced" | "mismatch" | "pending";

export interface SettlementPayment {
  id: string;
  amount: number;
  asset: string;
  fee: number;
  status: "completed" | "refunded";
  customerEmail: string;
  customerWallet: string;
  createdAt: string;
}

export interface SettlementTx {
  txHash: string;
  ledger: number;
  contractCall: string;
  amount: number;
  asset: string;
  fee: number;
  timestamp: string;
  stellarExpertUrl: string;
}

export interface SettlementBatch {
  id: string;
  periodType: SettlementPeriodType;
  periodLabel: string;
  startDate: string;
  endDate: string;
  asset: string;
  settlementAccount: string;
  gross: number;
  refunds: number;
  fees: number;
  net: number;
  onChainSettled: number;
  variance: number;
  status: SettlementStatus;
  discrepancyReason?: string;
  payments: SettlementPayment[];
  transactions: SettlementTx[];
  createdAt: string;
}

export interface StatementScheduleConfig {
  email: string;
  frequency: "daily" | "weekly" | "monthly";
  dayOfMonth: number;
  format: "pdf" | "csv" | "both";
  notifyOnMismatch: boolean;
  enabled: boolean;
  updatedAt?: string;
}

/**
 * Calculates financial aggregates for a settlement batch.
 * Guarantees that net = gross - refunds - fees, and variance = onChainSettled - net.
 */
export function calculateBatchMetrics(
  payments: SettlementPayment[],
  onChainSettled: number
): { gross: number; refunds: number; fees: number; net: number; variance: number; status: SettlementStatus } {
  let gross = 0;
  let refunds = 0;
  let fees = 0;

  for (const p of payments) {
    fees += p.fee;
    if (p.status === "completed") {
      gross += p.amount;
    } else if (p.status === "refunded") {
      refunds += p.amount;
    }
  }

  // Round to 2 decimals for fiat/USDC clarity
  gross = Math.round(gross * 100) / 100;
  refunds = Math.round(refunds * 100) / 100;
  fees = Math.round(fees * 100) / 100;

  const net = Math.round((gross - refunds - fees) * 100) / 100;
  const variance = Math.round((onChainSettled - net) * 100) / 100;
  const status: SettlementStatus = Math.abs(variance) < 0.009 ? "balanced" : "mismatch";

  return { gross, refunds, fees, net, variance, status };
}

export const INITIAL_SETTLEMENT_BATCHES: SettlementBatch[] = [
  {
    id: "batch_20261018_d01",
    periodType: "daily",
    periodLabel: "Oct 18, 2026",
    startDate: "2026-10-18T00:00:00.000Z",
    endDate: "2026-10-18T23:59:59.000Z",
    asset: "USDC",
    settlementAccount: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF",
    gross: 4250.0,
    refunds: 150.0,
    fees: 42.5,
    net: 4057.5,
    onChainSettled: 4057.5,
    variance: 0.0,
    status: "balanced",
    createdAt: "2026-10-19T01:00:00.000Z",
    payments: [
      { id: "pay_1018_01", amount: 1500.0, asset: "USDC", fee: 15.0, status: "completed", customerEmail: "enterprise@acme.com", customerWallet: "GA7Q...984A", createdAt: "2026-10-18T09:14:00Z" },
      { id: "pay_1018_02", amount: 2000.0, asset: "USDC", fee: 20.0, status: "completed", customerEmail: "finance@globex.io", customerWallet: "GB91...12DF", createdAt: "2026-10-18T13:40:00Z" },
      { id: "pay_1018_03", amount: 750.0, asset: "USDC", fee: 7.5, status: "completed", customerEmail: "dev@stellar.org", customerWallet: "GD88...771B", createdAt: "2026-10-18T16:22:00Z" },
      { id: "pay_1018_04", amount: 150.0, asset: "USDC", fee: 0.0, status: "refunded", customerEmail: "refund@customer.com", customerWallet: "GC33...44AA", createdAt: "2026-10-18T18:05:00Z" },
    ],
    transactions: [
      {
        txHash: "4f8a3c9b7e12d5f6a8b0c1d2e3f4a5b6c7d8e9f0123456789abcdef012345678",
        ledger: 53891024,
        contractCall: "EscrowSettlement::release_batch",
        amount: 4057.5,
        asset: "USDC",
        fee: 0.00001,
        timestamp: "2026-10-19T01:05:22Z",
        stellarExpertUrl: "https://stellar.expert/explorer/testnet/tx/4f8a3c9b7e12d5f6a8b0c1d2e3f4a5b6c7d8e9f0123456789abcdef012345678",
      },
    ],
  },
  {
    id: "batch_20261017_d02",
    periodType: "daily",
    periodLabel: "Oct 17, 2026",
    startDate: "2026-10-17T00:00:00.000Z",
    endDate: "2026-10-17T23:59:59.000Z",
    asset: "USDC",
    settlementAccount: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF",
    gross: 3100.0,
    refunds: 0.0,
    fees: 31.0,
    net: 3069.0,
    onChainSettled: 3044.0, // $25 discrepancy
    variance: -25.0,
    status: "mismatch",
    discrepancyReason: "Unmatched $25.00 dispute deduction during Soroban escrow execution",
    createdAt: "2026-10-18T01:00:00.000Z",
    payments: [
      { id: "pay_1017_01", amount: 1800.0, asset: "USDC", fee: 18.0, status: "completed", customerEmail: "billing@apex.org", customerWallet: "GC11...8899", createdAt: "2026-10-17T11:20:00Z" },
      { id: "pay_1017_02", amount: 1300.0, asset: "USDC", fee: 13.0, status: "completed", customerEmail: "user@vault.finance", customerWallet: "GD44...22CC", createdAt: "2026-10-17T15:45:00Z" },
    ],
    transactions: [
      {
        txHash: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
        ledger: 53876540,
        contractCall: "EscrowSettlement::release_batch",
        amount: 3044.0,
        asset: "USDC",
        fee: 0.00001,
        timestamp: "2026-10-18T01:04:11Z",
        stellarExpertUrl: "https://stellar.expert/explorer/testnet/tx/9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
      },
    ],
  },
  {
    id: "batch_20261016_d03",
    periodType: "daily",
    periodLabel: "Oct 16, 2026",
    startDate: "2026-10-16T00:00:00.000Z",
    endDate: "2026-10-16T23:59:59.000Z",
    asset: "USDC",
    settlementAccount: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF",
    gross: 5200.0,
    refunds: 400.0,
    fees: 52.0,
    net: 4748.0,
    onChainSettled: 4748.0,
    variance: 0.0,
    status: "balanced",
    createdAt: "2026-10-17T01:00:00.000Z",
    payments: [
      { id: "pay_1016_01", amount: 3200.0, asset: "USDC", fee: 32.0, status: "completed", customerEmail: "treasury@dao.eth", customerWallet: "GB77...3311", createdAt: "2026-10-16T08:10:00Z" },
      { id: "pay_1016_02", amount: 2000.0, asset: "USDC", fee: 20.0, status: "completed", customerEmail: "client@stellar-wave.xyz", customerWallet: "GA99...4422", createdAt: "2026-10-16T14:30:00Z" },
      { id: "pay_1016_03", amount: 400.0, asset: "USDC", fee: 0.0, status: "refunded", customerEmail: "dispute@buyer.com", customerWallet: "GD22...9900", createdAt: "2026-10-16T19:15:00Z" },
    ],
    transactions: [
      {
        txHash: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
        ledger: 53862098,
        contractCall: "EscrowSettlement::release_batch",
        amount: 4748.0,
        asset: "USDC",
        fee: 0.00001,
        timestamp: "2026-10-17T01:06:45Z",
        stellarExpertUrl: "https://stellar.expert/explorer/testnet/tx/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      },
    ],
  },
  {
    id: "batch_2026_w41",
    periodType: "weekly",
    periodLabel: "Week 41 (Oct 11 - Oct 17, 2026)",
    startDate: "2026-10-11T00:00:00.000Z",
    endDate: "2026-10-17T23:59:59.000Z",
    asset: "USDC",
    settlementAccount: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF",
    gross: 24800.0,
    refunds: 950.0,
    fees: 248.0,
    net: 23602.0,
    onChainSettled: 23602.0,
    variance: 0.0,
    status: "balanced",
    createdAt: "2026-10-18T02:00:00.000Z",
    payments: [
      { id: "pay_w41_01", amount: 10000.0, asset: "USDC", fee: 100.0, status: "completed", customerEmail: "corp@fintech.io", customerWallet: "GA55...6677", createdAt: "2026-10-12T10:00:00Z" },
      { id: "pay_w41_02", amount: 14800.0, asset: "USDC", fee: 148.0, status: "completed", customerEmail: "sales@payments.org", customerWallet: "GB44...8811", createdAt: "2026-10-15T16:20:00Z" },
      { id: "pay_w41_03", amount: 950.0, asset: "USDC", fee: 0.0, status: "refunded", customerEmail: "cancel@buyer.org", customerWallet: "GC88...9922", createdAt: "2026-10-16T11:00:00Z" },
    ],
    transactions: [
      {
        txHash: "abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
        ledger: 53878900,
        contractCall: "EscrowSettlement::release_batch",
        amount: 23602.0,
        asset: "USDC",
        fee: 0.00002,
        timestamp: "2026-10-18T02:15:33Z",
        stellarExpertUrl: "https://stellar.expert/explorer/testnet/tx/abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789",
      },
    ],
  },
  {
    id: "batch_2026_w40",
    periodType: "weekly",
    periodLabel: "Week 40 (Oct 04 - Oct 10, 2026)",
    startDate: "2026-10-04T00:00:00.000Z",
    endDate: "2026-10-10T23:59:59.000Z",
    asset: "USDC",
    settlementAccount: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF",
    gross: 19500.0,
    refunds: 600.0,
    fees: 195.0,
    net: 18705.0,
    onChainSettled: 18705.0,
    variance: 0.0,
    status: "balanced",
    createdAt: "2026-10-11T02:00:00.000Z",
    payments: [
      { id: "pay_w40_01", amount: 12000.0, asset: "USDC", fee: 120.0, status: "completed", customerEmail: "partner@stellar.org", customerWallet: "GA11...2233", createdAt: "2026-10-06T12:00:00Z" },
      { id: "pay_w40_02", amount: 7500.0, asset: "USDC", fee: 75.0, status: "completed", customerEmail: "merchant@alpha.com", customerWallet: "GB22...3344", createdAt: "2026-10-08T15:30:00Z" },
      { id: "pay_w40_03", amount: 600.0, asset: "USDC", fee: 0.0, status: "refunded", customerEmail: "user@return.com", customerWallet: "GC33...4455", createdAt: "2026-10-09T18:00:00Z" },
    ],
    transactions: [
      {
        txHash: "7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
        ledger: 53754321,
        contractCall: "EscrowSettlement::release_batch",
        amount: 18705.0,
        asset: "USDC",
        fee: 0.00002,
        timestamp: "2026-10-11T02:10:19Z",
        stellarExpertUrl: "https://stellar.expert/explorer/testnet/tx/7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
      },
    ],
  },
];

interface SettlementStoreState {
  batches: SettlementBatch[];
  schedule: StatementScheduleConfig;
}

export const settlementStore = createLocalStore<SettlementStoreState>("facilpay_settlements_v1", {
  batches: INITIAL_SETTLEMENT_BATCHES,
  schedule: {
    email: "finance@facilpay.io",
    frequency: "monthly",
    dayOfMonth: 1,
    format: "both",
    notifyOnMismatch: true,
    enabled: true,
    updatedAt: new Date().toISOString(),
  },
});

export function useSettlements() {
  return settlementStore.useStore();
}

/**
 * Generates an RFC 4180 compliant CSV string of settlement batches.
 */
export function generateSettlementBatchesCsv(batches: SettlementBatch[]): string {
  const headers = [
    "Batch ID",
    "Cadence",
    "Period",
    "Asset",
    "Gross Volume",
    "Refunds",
    "Fees",
    "Expected Net",
    "On-Chain Settled",
    "Variance",
    "Reconciliation Status",
    "Settlement Account",
  ];

  const rows = batches.map((b) => [
    escapeCsvField(b.id),
    escapeCsvField(b.periodType),
    escapeCsvField(b.periodLabel),
    escapeCsvField(b.asset),
    escapeCsvField(b.gross.toFixed(2)),
    escapeCsvField(b.refunds.toFixed(2)),
    escapeCsvField(b.fees.toFixed(2)),
    escapeCsvField(b.net.toFixed(2)),
    escapeCsvField(b.onChainSettled.toFixed(2)),
    escapeCsvField(b.variance.toFixed(2)),
    escapeCsvField(b.status.toUpperCase()),
    escapeCsvField(b.settlementAccount),
  ]);

  return [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Generates an RFC 4180 compliant CSV string of a single batch with its payments & transactions.
 */
export function generateSingleBatchCsv(batch: SettlementBatch): string {
  const metaSection = [
    ["Settlement Batch Report", batch.id].map(escapeCsvField).join(","),
    ["Period", batch.periodLabel].map(escapeCsvField).join(","),
    ["Cadence", batch.periodType].map(escapeCsvField).join(","),
    ["Settlement Account", batch.settlementAccount].map(escapeCsvField).join(","),
    ["Reconciliation Status", batch.status.toUpperCase()].map(escapeCsvField).join(","),
    ["Gross Volume", `${batch.gross.toFixed(2)} ${batch.asset}`].map(escapeCsvField).join(","),
    ["Refunds", `${batch.refunds.toFixed(2)} ${batch.asset}`].map(escapeCsvField).join(","),
    ["Fees", `${batch.fees.toFixed(2)} ${batch.asset}`].map(escapeCsvField).join(","),
    ["Expected Net", `${batch.net.toFixed(2)} ${batch.asset}`].map(escapeCsvField).join(","),
    ["On-Chain Settled", `${batch.onChainSettled.toFixed(2)} ${batch.asset}`].map(escapeCsvField).join(","),
    ["Variance", `${batch.variance.toFixed(2)} ${batch.asset}`].map(escapeCsvField).join(","),
    [],
  ].map((row) => (row.length ? row : ""));

  const paymentHeaders = ["Payment ID", "Status", "Amount", "Fee", "Customer Email", "Customer Wallet", "Created At"];
  const paymentRows = batch.payments.map((p) => [
    escapeCsvField(p.id),
    escapeCsvField(p.status.toUpperCase()),
    escapeCsvField(p.amount.toFixed(2)),
    escapeCsvField(p.fee.toFixed(2)),
    escapeCsvField(p.customerEmail),
    escapeCsvField(p.customerWallet),
    escapeCsvField(p.createdAt),
  ]);

  const txHeaders = ["Transaction Hash", "Ledger", "Contract Call", "Amount Settled", "Network Fee", "Timestamp"];
  const txRows = batch.transactions.map((t) => [
    escapeCsvField(t.txHash),
    escapeCsvField(String(t.ledger)),
    escapeCsvField(t.contractCall),
    escapeCsvField(t.amount.toFixed(2)),
    escapeCsvField(t.fee.toFixed(7)),
    escapeCsvField(t.timestamp),
  ]);

  const lines = [
    ...metaSection,
    ["--- PAYMENTS INCLUDED IN BATCH ---"].map(escapeCsvField).join(","),
    paymentHeaders.join(","),
    ...paymentRows.map((r) => r.join(",")),
    "",
    ["--- ON-CHAIN SETTLEMENT TRANSACTIONS ---"].map(escapeCsvField).join(","),
    txHeaders.join(","),
    ...txRows.map((r) => r.join(",")),
  ];

  return lines.join("\r\n");
}

/**
 * Browser download helper for CSV
 */
export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escapes characters for PDF string literals.
 */
function escapePdfText(str: string): string {
  if (!str) return "";
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

/**
 * Generates an official PDF 1.4 settlement reconciliation statement.
 */
export function generateSettlementPdf(batch: SettlementBatch): Blob {
  const pageWidth = 595.28;
  const pageHeight = 841.89;

  const contentLines: string[] = [
    "q",
    // 1. Background clean white
    "1 1 1 rg",
    `0 0 ${pageWidth} ${pageHeight} re f`,

    // 2. Header Brand Banner (#000F24)
    "0.0 0.059 0.141 rg",
    `0 ${pageHeight - 120} ${pageWidth} 120 re f`,

    // Top Brand Accent (#55C2FF)
    "0.333 0.761 1.0 rg",
    `0 ${pageHeight - 6} ${pageWidth} 6 re f`,

    // FacilPay Vector Mark
    "0.333 0.761 1.0 rg",
    `40 ${pageHeight - 60} m 65 ${pageHeight - 35} l 58 ${pageHeight - 35} l 33 ${pageHeight - 60} l h f`,
    "0.647 0.831 1.0 rg",
    `48 ${pageHeight - 70} m 73 ${pageHeight - 45} l 66 ${pageHeight - 45} l 41 ${pageHeight - 70} l h f`,

    // Header Titles
    "BT",
    "/F2 24 Tf",
    "1 1 1 rg",
    `85 ${pageHeight - 55} Td`,
    "(FacilPay) Tj",
    "ET",

    "BT",
    "/F1 10 Tf",
    "0.647 0.831 1.0 rg",
    `85 ${pageHeight - 70} Td`,
    "(SETTLEMENT RECONCILIATION STATEMENT) Tj",
    "ET",

    "BT",
    "/F1 9 Tf",
    "0.8 0.85 0.95 rg",
    `380 ${pageHeight - 50} Td`,
    `(${escapePdfText("Batch ID: " + batch.id)}) Tj`,
    "0 -14 Td",
    `(${escapePdfText("Period: " + batch.periodLabel)}) Tj`,
    "0 -14 Td",
    `(${escapePdfText("Generated: " + new Date().toISOString().split("T")[0])}) Tj`,
    "ET",

    // 3. Status Callout Card
    batch.status === "balanced" ? "0.95 0.99 0.95 rg" : "1.0 0.96 0.96 rg",
    `40 ${pageHeight - 210} ${pageWidth - 80} 70 re f`,
    batch.status === "balanced" ? "0.6 0.85 0.6 RG" : "0.95 0.6 0.6 RG",
    "1 w",
    `40 ${pageHeight - 210} ${pageWidth - 80} 70 re s`,

    "BT",
    "/F2 12 Tf",
    batch.status === "balanced" ? "0.1 0.5 0.1 rg" : "0.75 0.1 0.1 rg",
    `60 ${pageHeight - 165} Td`,
    batch.status === "balanced"
      ? "(RECONCILIATION STATUS: 100% BALANCED) Tj"
      : "(RECONCILIATION STATUS: DISCREPANCY DETECTED) Tj",
    "ET",

    "BT",
    "/F1 10 Tf",
    "0.3 0.35 0.4 rg",
    `60 ${pageHeight - 185} Td`,
    batch.status === "balanced"
      ? "(All transactions in this batch match the on-chain Soroban escrow release exactly.) Tj"
      : `(${escapePdfText(batch.discrepancyReason || "Variance between expected net and settled funds.")}) Tj`,
    "ET",

    // 4. Financial Summary Breakdown Box
    "0.97 0.98 1.0 rg",
    `40 ${pageHeight - 340} ${pageWidth - 80} 115 re f`,
    "0.85 0.9 0.95 RG",
    "1 w",
    `40 ${pageHeight - 340} ${pageWidth - 80} 115 re s`,

    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.25 rg",
    `60 ${pageHeight - 245} Td`,
    "(Financial Ledger Breakdown) Tj",
    "ET",

    "BT",
    "/F1 10 Tf",
    "0.3 0.3 0.35 rg",
    `60 ${pageHeight - 270} Td`,
    `(${escapePdfText("Gross Volume: " + batch.gross.toFixed(2) + " " + batch.asset)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText("Refunds Deducted: -" + batch.refunds.toFixed(2) + " " + batch.asset)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText("Processing & Network Fees: -" + batch.fees.toFixed(2) + " " + batch.asset)}) Tj`,
    "ET",

    "BT",
    "/F2 11 Tf",
    "0.0 0.1 0.3 rg",
    `320 ${pageHeight - 270} Td`,
    `(${escapePdfText("Expected Net: " + batch.net.toFixed(2) + " " + batch.asset)}) Tj`,
    "0 -18 Td",
    `(${escapePdfText("On-Chain Settled: " + batch.onChainSettled.toFixed(2) + " " + batch.asset)}) Tj`,
    "0 -18 Td",
    batch.variance === 0
      ? `(${escapePdfText("Variance Delta: 0.00 " + batch.asset + " (None)")}) Tj`
      : `(${escapePdfText("Variance Delta: " + batch.variance.toFixed(2) + " " + batch.asset)}) Tj`,
    "ET",

    // 5. Payment Items Header
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.25 rg",
    `40 ${pageHeight - 375} Td`,
    "(Batch Payment Entries) Tj",
    "ET",

    // Payment Rows Header
    "0.92 0.94 0.96 rg",
    `40 ${pageHeight - 400} ${pageWidth - 80} 20 re f`,

    "BT",
    "/F2 8 Tf",
    "0.3 0.35 0.4 rg",
    `50 ${pageHeight - 393} Td`,
    "(ID) Tj",
    "80 0 Td",
    "(CUSTOMER EMAIL) Tj",
    "150 0 Td",
    "(STATUS) Tj",
    "90 0 Td",
    "(AMOUNT) Tj",
    "70 0 Td",
    "(FEE) Tj",
    "ET",
  ];

  // Render top payment items (up to 8)
  let y = pageHeight - 420;
  for (const p of batch.payments.slice(0, 8)) {
    contentLines.push(
      "BT",
      "/F1 8 Tf",
      "0.2 0.25 0.3 rg",
      `50 ${y} Td`,
      `(${escapePdfText(p.id)}) Tj`,
      `80 0 Td`,
      `(${escapePdfText(p.customerEmail)}) Tj`,
      `150 0 Td`,
      `(${escapePdfText(p.status.toUpperCase())}) Tj`,
      `90 0 Td`,
      `(${escapePdfText(p.amount.toFixed(2) + " " + p.asset)}) Tj`,
      `70 0 Td`,
      `(${escapePdfText(p.fee.toFixed(2))}) Tj`,
      "ET"
    );
    y -= 18;
  }

  // 6. On-Chain Transaction Section
  contentLines.push(
    "BT",
    "/F2 11 Tf",
    "0.1 0.15 0.25 rg",
    `40 ${y - 15} Td`,
    "(On-Chain Stellar Soroban Escrow Settlement) Tj",
    "ET"
  );

  y -= 35;
  for (const tx of batch.transactions) {
    contentLines.push(
      "BT",
      "/F1 8 Tf",
      "0.3 0.35 0.4 rg",
      `40 ${y} Td`,
      `(${escapePdfText("Ledger: " + tx.ledger + " | Call: " + tx.contractCall + " | Settled: " + tx.amount.toFixed(2) + " " + tx.asset)}) Tj`,
      "0 -12 Td",
      `(${escapePdfText("Tx: " + tx.txHash)}) Tj`,
      "ET"
    );
    y -= 30;
  }

  // 7. Footer
  contentLines.push(
    "0.85 0.88 0.92 rg",
    `40 45 ${pageWidth - 80} 1 re f`,

    "BT",
    "/F1 8 Tf",
    "0.5 0.55 0.6 rg",
    "40 30 Td",
    "(FacilPay Settlement Operations -- Verified On-Chain via Stellar Horizon and Soroban RPC) Tj",
    "ET",
    "Q"
  );

  const streamContent = contentLines.join("\n");
  const streamLength = streamContent.length;

  const objects: string[] = [];
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = "<< /Type /Pages /Kids [3 0 R] /Count 1 >>";
  objects[3] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>`;
  objects[4] = `<< /Length ${streamLength} >>\nstream\n${streamContent}\nendstream`;
  objects[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  objects[6] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>";

  let body = "%PDF-1.4\n";
  const xrefOffsets: number[] = [0];

  for (let i = 1; i <= 6; i++) {
    xrefOffsets[i] = body.length;
    body += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }

  const xrefOffset = body.length;
  body += `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    const offsetStr = String(xrefOffsets[i]).padStart(10, "0");
    body += `${offsetStr} 00000 n \n`;
  }

  body += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  const buffer = new Uint8Array(body.length);
  for (let i = 0; i < body.length; i++) {
    buffer[i] = body.charCodeAt(i) & 0xff;
  }

  return new Blob([buffer], { type: "application/pdf" });
}
