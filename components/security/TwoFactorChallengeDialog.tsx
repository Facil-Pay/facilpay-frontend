"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TwoFactorCodeInput, isCompleteTwoFactorCode } from "./TwoFactorCodeInput";

interface TwoFactorChallengeDialogProps {
  open: boolean;
  title: string;
  description: string;
  submitLabel?: string;
  /** Throw to show the error and let the user try again. */
  onSubmit: (code: string) => Promise<void>;
  onCancel: () => void;
}

export function TwoFactorChallengeDialog({
  open,
  title,
  description,
  submitLabel = "Confirm",
  onSubmit,
  onCancel,
}: TwoFactorChallengeDialogProps) {
  const [code, setCode] = useState("");
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCode("");
    setError(null);
    setUseRecoveryCode(false);
  }, [open]);

  const complete = isCompleteTwoFactorCode(code, useRecoveryCode);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!complete || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "That code didn't work. Try again.");
      setCode("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !submitting && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-sky-50 text-sky-600">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </div>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-3" noValidate>
          <label htmlFor="two-factor-challenge-code" className="block text-sm font-medium text-zinc-800">
            {useRecoveryCode ? "Recovery code" : "Authentication code"}
          </label>
          <TwoFactorCodeInput
            id="two-factor-challenge-code"
            value={code}
            onChange={setCode}
            allowRecoveryCode={useRecoveryCode}
            invalid={Boolean(error)}
            describedBy={error ? "two-factor-challenge-error" : undefined}
            disabled={submitting}
            autoFocus
          />
          {error && (
            <p id="two-factor-challenge-error" role="alert" className="text-xs text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => {
              setUseRecoveryCode((value) => !value);
              setCode("");
              setError(null);
            }}
            className="text-xs font-medium text-sky-700 hover:text-sky-900"
          >
            {useRecoveryCode ? "Use your authenticator app instead" : "Lost your device? Use a recovery code"}
          </button>

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={submitting}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!complete || submitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#000F24] px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitLabel}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
