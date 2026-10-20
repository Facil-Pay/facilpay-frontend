"use client";

import { useState, type FormEvent } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { Field, SettingsError, SettingsLoading, SettingsSection, fieldInputClass } from "@/components/settings/form-fields";
import { useToast } from "@/components/ui/toast";
import { CopyButton } from "@/components/ui/copy-button";
import {
  useConfirmTwoFactorEnrollment,
  useDisableTwoFactor,
  useStartTwoFactorEnrollment,
  useTwoFactorStatus,
} from "@/lib/api/hooks/useTwoFactor";
import { useFormat } from "@/lib/i18n/use-format";
import type { TwoFactorEnrollment, TwoFactorStatus } from "@/lib/types/settings";
import { RecoveryCodes } from "./RecoveryCodes";
import { TwoFactorCodeInput, isCompleteTwoFactorCode } from "./TwoFactorCodeInput";

const DESCRIPTION =
  "Require a code from an authenticator app when signing in and before payouts, API key reveals and settlement address changes.";

export function TwoFactorSection() {
  const { data: status, isLoading, isError, error, refetch } = useTwoFactorStatus();
  // Held here, not in the enrolment flow: confirming flips the cached status to
  // enabled, and the codes must survive that re-render until acknowledged.
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(null);

  if (isLoading) return <SettingsLoading />;
  if (isError || !status) return <SettingsError message={error?.message ?? "Unknown error"} onRetry={() => void refetch()} />;

  return (
    <SettingsSection title="Two-factor authentication" description={DESCRIPTION}>
      {newRecoveryCodes ? (
        <RecoveryCodesHandoff codes={newRecoveryCodes} onDone={() => setNewRecoveryCodes(null)} />
      ) : status.enabled ? (
        <TwoFactorEnabled status={status} />
      ) : (
        <TwoFactorEnrollmentFlow onEnabled={setNewRecoveryCodes} />
      )}
    </SettingsSection>
  );
}

// ─── Enrolment ────────────────────────────────────────────────────────────────

type EnrollmentStep = { name: "intro" } | { name: "scan"; enrollment: TwoFactorEnrollment };

/** Groups a base32 secret for readability: "JBSW Y3DP EHPK 3PXP". */
function groupSecret(secret: string) {
  return secret.replace(/\s+/g, "").match(/.{1,4}/g)?.join(" ") ?? secret;
}

function TwoFactorEnrollmentFlow({ onEnabled }: { onEnabled: (recoveryCodes: string[]) => void }) {
  const toast = useToast();
  const start = useStartTwoFactorEnrollment();
  const confirm = useConfirmTwoFactorEnrollment();
  const [step, setStep] = useState<EnrollmentStep>({ name: "intro" });
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const begin = async () => {
    try {
      const enrollment = await start.mutateAsync();
      setCode("");
      setCodeError(null);
      setStep({ name: "scan", enrollment });
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not start two-factor setup", "error");
    }
  };

  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!isCompleteTwoFactorCode(code, false)) return;
    setCodeError(null);
    try {
      const { recoveryCodes } = await confirm.mutateAsync({ code });
      onEnabled(recoveryCodes);
    } catch (err) {
      setCodeError(err instanceof Error ? err.message : "That code didn't match. Try the newest code in your app.");
      setCode("");
    }
  };

  if (step.name === "intro") {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <ShieldOff className="mt-0.5 h-5 w-5 shrink-0 text-zinc-400" aria-hidden="true" />
          <p className="text-sm text-zinc-600">
            Two-factor authentication is <strong className="font-semibold text-zinc-900">off</strong>. Anyone with your
            password can move funds and read API keys.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void begin()}
          disabled={start.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-[#000F24] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {start.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Enable two-factor authentication
        </button>
      </div>
    );
  }

  const { enrollment } = step;
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[auto_1fr]">
      <div className="mx-auto rounded-xl border border-zinc-200 bg-white p-3">
        <QRCodeSVG value={enrollment.otpauthUrl} size={176} level="M" marginSize={2} title="Two-factor setup QR code" />
      </div>
      <div className="min-w-0 space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-zinc-700">
          <li>Scan the QR code with an authenticator app (1Password, Google Authenticator, Authy…).</li>
          <li>Enter the 6-digit code the app shows to finish setup.</li>
        </ol>
        <div>
          <p className="mb-1 text-xs font-medium text-zinc-500">Can&apos;t scan? Enter this key manually:</p>
          <div className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 pl-3">
            <code className="min-w-0 flex-1 break-all py-2 font-mono text-sm text-zinc-900">{groupSecret(enrollment.secret)}</code>
            <CopyButton value={enrollment.secret} label="Copy setup key" />
          </div>
        </div>
        <form onSubmit={(event) => void verify(event)} className="space-y-2" noValidate>
          <label htmlFor="two-factor-enroll-code" className="block text-sm font-medium text-zinc-800">
            Verification code
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="sm:w-48">
              <TwoFactorCodeInput
                id="two-factor-enroll-code"
                value={code}
                onChange={setCode}
                invalid={Boolean(codeError)}
                describedBy={codeError ? "two-factor-enroll-error" : undefined}
                disabled={confirm.isPending}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={!isCompleteTwoFactorCode(code, false) || confirm.isPending}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#000F24] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {confirm.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Verify and enable
            </button>
            <button
              type="button"
              onClick={() => setStep({ name: "intro" })}
              disabled={confirm.isPending}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
          {codeError && (
            <p id="two-factor-enroll-error" role="alert" className="text-xs text-red-600">
              {codeError}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}

function RecoveryCodesHandoff({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const toast = useToast();
  const [saved, setSaved] = useState(false);

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm font-medium text-emerald-700">
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        Two-factor authentication is on.
      </p>
      <RecoveryCodes codes={codes} />
      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          checked={saved}
          onChange={(event) => setSaved(event.target.checked)}
          className="h-4 w-4 accent-sky-500"
        />
        I&apos;ve saved my recovery codes somewhere safe
      </label>
      <button
        type="button"
        disabled={!saved}
        onClick={() => {
          onDone();
          toast("Two-factor authentication enabled", "success");
        }}
        className="rounded-lg bg-[#000F24] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        Done
      </button>
    </div>
  );
}

// ─── Enabled / disable ────────────────────────────────────────────────────────

function TwoFactorEnabled({ status }: { status: TwoFactorStatus }) {
  const toast = useToast();
  const f = useFormat();
  const disable = useDisableTwoFactor();
  const [disabling, setDisabling] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSubmit = password.length > 0 && isCompleteTwoFactorCode(code, true) && !disable.isPending;

  const handleDisable = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      await disable.mutateAsync({ password, code });
      toast("Two-factor authentication disabled", "success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable two-factor authentication");
      setCode("");
    }
  };

  const reset = () => {
    setDisabling(false);
    setPassword("");
    setCode("");
    setError(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-zinc-900">
            Enabled
            {status.enrolledAt && <span className="font-normal text-zinc-500"> · since {f.date(status.enrolledAt)}</span>}
          </p>
          <p className={status.recoveryCodesRemaining <= 2 ? "text-xs text-amber-700" : "text-xs text-zinc-500"}>
            {f.number(status.recoveryCodesRemaining)} recovery {status.recoveryCodesRemaining === 1 ? "code" : "codes"} left
          </p>
        </div>
        {!disabling && (
          <button
            type="button"
            onClick={() => setDisabling(true)}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            Disable
          </button>
        )}
      </div>

      {disabling && (
        <form onSubmit={(event) => void handleDisable(event)} className="space-y-4 rounded-xl border border-red-100 bg-red-50/40 p-4" noValidate>
          <p className="text-sm text-zinc-700">Confirm with your password and a current code. Payouts and API keys will be protected by your password alone.</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="two-factor-disable-password" label="Password">
              <input
                id="two-factor-disable-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={fieldInputClass}
              />
            </Field>
            <div>
              <label htmlFor="two-factor-disable-code" className="mb-1.5 block text-sm font-medium text-zinc-800">
                Authentication or recovery code
              </label>
              <TwoFactorCodeInput
                id="two-factor-disable-code"
                value={code}
                onChange={setCode}
                allowRecoveryCode
                invalid={Boolean(error)}
                describedBy={error ? "two-factor-disable-error" : undefined}
              />
            </div>
          </div>
          {error && (
            <p id="two-factor-disable-error" role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={reset}
              disabled={disable.isPending}
              className="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {disable.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Disable two-factor authentication
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
