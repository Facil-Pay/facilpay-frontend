import type { Payment, Payout, Refund } from "@/lib/types";

export type ReconciliationActivityType = "Payment" | "Refund" | "Payout";
export type ReconciliationStatus = "Matched" | "Mismatch" | "Missing statement" | "Unmatched statement";

export interface ReconciliationActivity {
  id: string;
  date: string;
  type: ReconciliationActivityType;
  reference: string;
  asset: string;
  amount: number;
}

export interface SettlementEntry {
  id: string;
  date: string;
  reference: string;
  asset: string;
  amount: number;
}

export interface ReconciliationRow {
  id: string;
  status: ReconciliationStatus;
  activity?: ReconciliationActivity;
  statement?: SettlementEntry;
  difference?: number;
}

const amountTolerance = 0.01;
const dateWindowMs = 3 * 24 * 60 * 60 * 1000;

export function createReconciliationActivities(
  payments: Payment[],
  refunds: Refund[],
  payouts: Payout[],
): ReconciliationActivity[] {
  const paymentActivities = payments
    .filter((payment) => payment.status === "COMPLETED" || payment.status === "REFUNDED")
    .map((payment): ReconciliationActivity => ({
      id: payment.id,
      date: payment.date,
      type: "Payment",
      reference: payment.txHash,
      asset: payment.asset,
      amount: payment.amount,
    }));

  const refundActivities = refunds
    .filter((refund) => refund.status === "COMPLETED")
    .map((refund): ReconciliationActivity => ({
      id: refund.id,
      date: refund.date,
      type: "Refund",
      reference: refund.txHash,
      asset: refund.asset,
      amount: -refund.amount,
    }));

  const payoutActivities = payouts
    .filter((payout) => payout.status === "COMPLETED")
    .map((payout): ReconciliationActivity => ({
      id: payout.id,
      date: payout.date,
      type: "Payout",
      reference: payout.txHash,
      asset: payout.asset,
      amount: -payout.amount,
    }));

  return [...paymentActivities, ...refundActivities, ...payoutActivities].sort(
    (left, right) => right.date.localeCompare(left.date),
  );
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index];
    if (character === '"') {
      if (inQuotes && csv[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (character === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && csv[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== "")) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (inQuotes) throw new Error("The CSV contains an unclosed quoted field.");
  row.push(field);
  if (row.some((value) => value.trim() !== "")) rows.push(row);
  return rows;
}

function normalizeHeader(value: string): string {
  return value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findHeaderIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseAmount(value: string, rowNumber: number): number {
  const trimmed = value.trim();
  const isAccountingNegative = trimmed.startsWith("(") && trimmed.endsWith(")");
  const normalized = trimmed
    .replace(/[(),\s$€£]/g, "")
    .replace(/^(USD|EUR|XLM|USDC|EURC)/i, "");
  const amount = Number(normalized);
  if (!Number.isFinite(amount)) throw new Error(`Row ${rowNumber}: amount is not a valid number.`);
  return isAccountingNegative ? -amount : amount;
}

export function parseSettlementCsv(csv: string): SettlementEntry[] {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) throw new Error("The statement CSV must include a header and at least one transaction.");

  const headers = rows[0].map(normalizeHeader);
  const dateIndex = findHeaderIndex(headers, ["date", "postedat", "posteddate", "transactiondate", "settlementdate"]);
  const amountIndex = findHeaderIndex(headers, ["amount", "netamount", "value", "transactionamount"]);
  const assetIndex = findHeaderIndex(headers, ["asset", "currency", "assetcode"]);
  const referenceIndex = findHeaderIndex(headers, ["reference", "transactionreference", "transactionhash", "txhash", "hash", "transactionid", "id", "memo"]);
  const directionIndex = findHeaderIndex(headers, ["direction", "debitcredit", "creditdebit"]);

  if (dateIndex < 0 || amountIndex < 0 || assetIndex < 0) {
    throw new Error("Required columns are Date, Amount, and Asset (or Currency). Reference is optional.");
  }

  return rows.slice(1).map((row, index) => {
    const rowNumber = index + 2;
    const dateValue = row[dateIndex]?.trim() ?? "";
    const timestamp = Date.parse(dateValue);
    if (!dateValue || !Number.isFinite(timestamp)) {
      throw new Error(`Row ${rowNumber}: date is missing or invalid.`);
    }

    const asset = row[assetIndex]?.trim().toUpperCase() ?? "";
    if (!asset) throw new Error(`Row ${rowNumber}: asset is required.`);

    let amount = parseAmount(row[amountIndex] ?? "", rowNumber);
    const direction = directionIndex < 0 ? "" : (row[directionIndex] ?? "").trim().toLowerCase();
    if (["debit", "out", "outgoing", "withdrawal"].includes(direction)) amount = -Math.abs(amount);
    if (["credit", "in", "incoming", "deposit"].includes(direction)) amount = Math.abs(amount);

    return {
      id: `statement-${rowNumber}`,
      date: new Date(timestamp).toISOString(),
      reference: referenceIndex < 0 ? "" : (row[referenceIndex] ?? "").trim(),
      asset,
      amount,
    };
  });
}

function roundAmount(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function reconcileSettlement(
  activities: ReconciliationActivity[],
  statementEntries: SettlementEntry[],
): ReconciliationRow[] {
  const availableEntries = new Set(statementEntries.map((entry) => entry.id));
  const rows = activities.map((activity): ReconciliationRow => {
    const reference = activity.reference.trim().toLowerCase();
    let candidate = reference
      ? statementEntries.find(
          (entry) => availableEntries.has(entry.id) && entry.reference.trim().toLowerCase() === reference,
        )
      : undefined;

    if (!candidate) {
      const activityTime = Date.parse(activity.date);
      const possibleMatches = statementEntries.filter((entry) => {
        if (!availableEntries.has(entry.id) || entry.asset.toUpperCase() !== activity.asset.toUpperCase()) return false;
        if (Math.abs(entry.amount - activity.amount) > amountTolerance) return false;
        return Math.abs(Date.parse(entry.date) - activityTime) <= dateWindowMs;
      });
      if (possibleMatches.length === 1) candidate = possibleMatches[0];
    }

    if (!candidate) {
      return { id: `activity-${activity.id}`, status: "Missing statement", activity };
    }

    availableEntries.delete(candidate.id);
    const difference = roundAmount(candidate.amount - activity.amount);
    const status =
      candidate.asset.toUpperCase() === activity.asset.toUpperCase() &&
      Math.abs(difference) <= amountTolerance
        ? "Matched"
        : "Mismatch";

    return {
      id: `activity-${activity.id}`,
      status,
      activity,
      statement: candidate,
      difference,
    };
  });

  for (const entry of statementEntries) {
    if (availableEntries.has(entry.id)) {
      rows.push({ id: entry.id, status: "Unmatched statement", statement: entry });
    }
  }

  return rows;
}

export function createSampleStatement(activities: ReconciliationActivity[]): SettlementEntry[] {
  if (activities.length === 0) return [];
  const included = activities.slice(0, Math.max(1, activities.length - 1));
  const entries = included.map((activity, index): SettlementEntry => ({
    id: `sample-${activity.id}`,
    date: activity.date,
    reference: activity.reference,
    asset: activity.asset,
    amount: index === 1 ? roundAmount(activity.amount + (activity.amount < 0 ? -4.25 : 4.25)) : activity.amount,
  }));
  const sampleDate = activities[activities.length - 1].date;

  entries.push({
    id: "sample-unmatched-entry",
    date: sampleDate,
    reference: "statement-entry-without-facilpay-reference",
    asset: activities[0].asset,
    amount: 37.5,
  });

  return entries;
}