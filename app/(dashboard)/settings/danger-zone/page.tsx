"use client";

import { useState } from "react";
import { useCurrentMember } from "@/lib/team";
import { useToast } from "@/components/ui/toast";
import {
  startExportJob,
  runExportSimulation,
  checkClosureEligibility,
  isBusinessNameMatch,
  isValidTwoFactorCode,
  useExportJob,
  type ExportJob,
} from "@/lib/data-export";
import { auditLogStore } from "@/lib/unmatched-payments";

// ─── Hardcoded demo values ────────────────────────────────────────────────────

const DEMO_BUSINESS_NAME = "Northstar Goods";
const DEMO_BALANCE = { usdc: 0, xlm: 0, eurc: 0 }; // zero = eligible
const DEMO_PENDING_PAYOUTS = { count: 0 }; // zero = eligible

// ─── Export section ───────────────────────────────────────────────────────────

function ExportSection() {
  const toast = useToast();
  const exportJob = useExportJob();
  const [running, setRunning] = useState(false);

  const handleExport = async () => {
    if (running) return;
    setRunning(true);
    startExportJob();
    toast("Export job started. We'll notify you when your data is ready.", "info");

    await runExportSimulation((job: ExportJob) => {
      if (job.status === "completed") {
        toast("Your data export is ready. Click to download.", "success");
      }
    });
    setRunning(false);
  };

  const handleDownload = () => {
    if (exportJob?.downloadUrl) {
      window.open(exportJob.downloadUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-zinc-900">Export all account data</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Download a full archive of your payments, refunds, customers, invoices, audit logs, and
        settings.
      </p>

      {exportJob && exportJob.status !== "idle" && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-700">
                {exportJob.status === "completed"
                  ? "Export complete"
                  : exportJob.status === "failed"
                  ? "Export failed"
                  : `Exporting… ${exportJob.progress}%`}
              </p>
              {exportJob.status === "in_progress" || exportJob.status === "queued" ? (
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className="h-full rounded-full bg-sky-500 transition-all duration-300"
                    style={{ width: `${exportJob.progress}%` }}
                    role="progressbar"
                    aria-valuenow={exportJob.progress}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  />
                </div>
              ) : null}
              {exportJob.status === "completed" && exportJob.downloadUrl && (
                <p className="mt-1 text-xs text-zinc-500">
                  Ready since {new Date(exportJob.finishedAt ?? "").toLocaleTimeString()}
                </p>
              )}
            </div>
            {exportJob.status === "completed" && exportJob.downloadUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="rounded-lg bg-[#000F24] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
              >
                Download
              </button>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={running}
        className="mt-4 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 disabled:opacity-50"
      >
        {running ? "Exporting…" : "Request data export"}
      </button>
    </section>
  );
}

// ─── Account closure section ──────────────────────────────────────────────────

function AccountClosureSection() {
  const member = useCurrentMember();
  const isOwner = member?.role === "owner";
  const eligibility = checkClosureEligibility(DEMO_BALANCE, DEMO_PENDING_PAYOUTS);

  const [step, setStep] = useState<"idle" | "confirm">("idle");
  const [businessName, setBusinessName] = useState("");
  const [twoFaCode, setTwoFaCode] = useState("");
  const [nameError, setNameError] = useState("");
  const [codeError, setCodeError] = useState("");
  const [closed, setClosed] = useState(false);

  const toast = useToast();

  const handleOpenConfirm = () => {
    if (!eligibility.eligible) return;
    setStep("confirm");
  };

  const handleClose = () => {
    setNameError("");
    setCodeError("");

    let valid = true;
    if (!isBusinessNameMatch(businessName, DEMO_BUSINESS_NAME)) {
      setNameError(`Business name must match exactly: "${DEMO_BUSINESS_NAME}"`);
      valid = false;
    }
    if (!isValidTwoFactorCode(twoFaCode)) {
      setCodeError("Please enter a valid 6-digit authenticator code.");
      valid = false;
    }
    if (!valid) return;

    // Simulate successful closure
    auditLogStore.set((log) => [
      {
        id: `evt_close_${Date.now()}`,
        actor: member?.name ?? "Owner",
        actionType: "Settings",
        action: "Account closure requested",
        target: `Business: ${DEMO_BUSINESS_NAME}`,
        ip: "—",
        timestamp: new Date().toISOString(),
      },
      ...log,
    ]);

    setClosed(true);
    toast("Account closure has been initiated. You will receive a confirmation email.", "success");
  };

  if (!isOwner) {
    return (
      <section className="rounded-xl border border-rose-200 bg-rose-50 p-6">
        <h2 className="text-base font-semibold text-rose-900">Account closure</h2>
        <p className="mt-1 text-sm text-rose-700">
          Only the account <strong>owner</strong> can close this account. Contact your account owner
          to proceed.
        </p>
      </section>
    );
  }

  if (closed) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
        <p className="text-lg font-semibold text-zinc-900">Closure initiated</p>
        <p className="mt-1 text-sm text-zinc-500">
          A confirmation email has been sent. Your account will be closed within 7 days.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-rose-200 bg-white p-6 shadow-sm">
      <h2 className="text-base font-semibold text-rose-700">Danger zone — close account</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Permanently delete your FacilPay account and all associated data. This action is
        irreversible.
      </p>

      {!eligibility.eligible && (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p className="font-semibold">Cannot close account yet:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {eligibility.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      )}

      {step === "idle" && (
        <button
          type="button"
          disabled={!eligibility.eligible}
          onClick={handleOpenConfirm}
          className="mt-4 rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Close my account
        </button>
      )}

      {step === "confirm" && (
        <div className="mt-5 space-y-4 rounded-xl border border-rose-200 bg-rose-50 p-5">
          <p className="text-sm font-medium text-rose-900">
            To confirm, please type your exact business name and your 2FA code.
          </p>

          <label className="block text-sm font-medium text-zinc-700">
            Business name
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder={DEMO_BUSINESS_NAME}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-rose-400 focus:outline-none"
              aria-label="Enter business name to confirm"
            />
            {nameError && <p className="mt-1 text-xs text-rose-600">{nameError}</p>}
          </label>

          <label className="block text-sm font-medium text-zinc-700">
            Authenticator code (6 digits)
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={twoFaCode}
              onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm tracking-widest focus:border-rose-400 focus:outline-none"
              aria-label="Enter 2FA code"
            />
            {codeError && <p className="mt-1 text-xs text-rose-600">{codeError}</p>}
          </label>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep("idle")}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Permanently close account
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DangerZonePage() {
  return (
    <div className="space-y-6">
      <ExportSection />
      <AccountClosureSection />
    </div>
  );
}
