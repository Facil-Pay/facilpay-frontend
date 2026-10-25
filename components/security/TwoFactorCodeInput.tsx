"use client";

import { forwardRef } from "react";
import { cn } from "@/components/ui/utils";
import { TWO_FACTOR_CODE_PATTERN, normalizeTwoFactorCode } from "@/lib/api/hooks/useTwoFactor";

export function isCompleteTwoFactorCode(code: string, allowRecoveryCode: boolean): boolean {
  const normalized = normalizeTwoFactorCode(code);
  return allowRecoveryCode ? TWO_FACTOR_CODE_PATTERN.test(normalized) : /^\d{6}$/.test(normalized);
}

interface TwoFactorCodeInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Accept "XXXX-XXXX" recovery codes as well as 6-digit TOTP codes */
  allowRecoveryCode?: boolean;
  invalid?: boolean;
  describedBy?: string;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const TwoFactorCodeInput = forwardRef<HTMLInputElement, TwoFactorCodeInputProps>(function TwoFactorCodeInput(
  { id, value, onChange, allowRecoveryCode = false, invalid, describedBy, autoFocus, disabled },
  ref,
) {
  return (
    <input
      ref={ref}
      id={id}
      name={id}
      value={value}
      onChange={(event) =>
        onChange(allowRecoveryCode ? event.target.value.toUpperCase() : event.target.value.replace(/\D/g, ""))
      }
      inputMode={allowRecoveryCode ? "text" : "numeric"}
      autoComplete="one-time-code"
      autoCapitalize="characters"
      spellCheck={false}
      maxLength={allowRecoveryCode ? 9 : 6}
      placeholder={allowRecoveryCode ? "XXXX-XXXX" : "000000"}
      autoFocus={autoFocus}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      className={cn(
        "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-center font-mono text-lg tracking-[0.35em] text-zinc-900 placeholder-zinc-300",
        "focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 aria-[invalid=true]:border-red-400 disabled:opacity-60",
      )}
    />
  );
});
