/**
 * lib/data-export.ts
 *
 * Async export job management and account closure eligibility checks.
 * Surfaced through settings → Danger Zone.
 */

import { createLocalStore } from "./local-store";

// ─── Export job ───────────────────────────────────────────────────────────────

export type ExportJobStatus = "idle" | "queued" | "in_progress" | "completed" | "failed";

export interface ExportJob {
  id: string;
  status: ExportJobStatus;
  /** Progress 0–100 */
  progress: number;
  /** ISO timestamp when the job started */
  startedAt: string;
  /** ISO timestamp when the job completed or failed */
  finishedAt?: string;
  /** Download URL when status === "completed" */
  downloadUrl?: string;
  errorMessage?: string;
}

export const exportJobStore = createLocalStore<ExportJob | null>(
  "facilpay_export_job",
  null,
);

export const useExportJob = exportJobStore.useStore;

/** Start a new export job. Simulates async progress updates. */
export function startExportJob(): ExportJob {
  const job: ExportJob = {
    id: `export_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    status: "queued",
    progress: 0,
    startedAt: new Date().toISOString(),
  };
  exportJobStore.set(job);
  return job;
}

/**
 * Simulate async export progress. In production this would poll a real API.
 * Calls `onProgress(job)` at each step; resolves when done.
 */
export async function runExportSimulation(
  onProgress: (job: ExportJob) => void,
): Promise<ExportJob> {
  const steps = [
    { status: "in_progress" as ExportJobStatus, progress: 10, delay: 300 },
    { status: "in_progress" as ExportJobStatus, progress: 30, delay: 500 },
    { status: "in_progress" as ExportJobStatus, progress: 60, delay: 600 },
    { status: "in_progress" as ExportJobStatus, progress: 85, delay: 400 },
    { status: "in_progress" as ExportJobStatus, progress: 100, delay: 300 },
  ];

  for (const step of steps) {
    await new Promise<void>((r) => setTimeout(r, step.delay));
    exportJobStore.set((prev) =>
      prev
        ? { ...prev, status: step.status, progress: step.progress }
        : prev,
    );
    const current = exportJobStore.get();
    if (current) onProgress(current);
  }

  exportJobStore.set((prev) =>
    prev
      ? {
          ...prev,
          status: "completed",
          progress: 100,
          finishedAt: new Date().toISOString(),
          downloadUrl: "/api/export/download?token=mock_export_token",
        }
      : prev,
  );

  const final = exportJobStore.get()!;
  onProgress(final);
  return final;
}

// ─── Account closure ──────────────────────────────────────────────────────────

export interface ClosureEligibility {
  eligible: boolean;
  reasons: string[];
}

export interface AccountBalance {
  usdc: number;
  xlm: number;
  eurc: number;
}

export interface PendingPayouts {
  count: number;
}

/**
 * Check if the account is eligible for closure.
 * Requires: zero balance across all assets, and no pending payouts.
 */
export function checkClosureEligibility(
  balance: AccountBalance,
  pendingPayouts: PendingPayouts,
): ClosureEligibility {
  const reasons: string[] = [];

  if (balance.usdc > 0) {
    reasons.push(`Account has an outstanding USDC balance of ${balance.usdc.toFixed(2)} USDC. Withdraw all funds first.`);
  }
  if (balance.xlm > 0) {
    reasons.push(`Account has an outstanding XLM balance of ${balance.xlm.toFixed(7)} XLM. Withdraw all funds first.`);
  }
  if (balance.eurc > 0) {
    reasons.push(`Account has an outstanding EURC balance of ${balance.eurc.toFixed(2)} EURC. Withdraw all funds first.`);
  }
  if (pendingPayouts.count > 0) {
    reasons.push(
      `There ${pendingPayouts.count === 1 ? "is" : "are"} ${pendingPayouts.count} pending payout${pendingPayouts.count === 1 ? "" : "s"} that must complete before closure.`,
    );
  }

  return { eligible: reasons.length === 0, reasons };
}

/**
 * Validate the two-factor code format (6 digits).
 * Returns true when the code matches the expected format.
 * The actual verification is done server-side; this is only a client-side
 * format guard.
 */
export function isValidTwoFactorCode(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

/**
 * Validate that the user-typed business name matches the expected name exactly.
 */
export function isBusinessNameMatch(input: string, expectedName: string): boolean {
  return input.trim() === expectedName.trim();
}
