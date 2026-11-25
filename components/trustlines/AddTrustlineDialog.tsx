"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, ExternalLink, ShieldCheck } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from "@/components/ui";
import { cn } from "@/components/ui/utils";
import type { FormattedBalance } from "@/lib/stellar/horizon";
import { StrKey } from "@/lib/stellar/strkey";
import {
  CURATED_TRUSTLINE_ASSETS,
  MAX_TRUST_LIMIT,
  describeChangeTrustError,
  hasTrustline,
  stellarExplorerTxUrl,
  type TrustlineAsset,
} from "@/lib/stellar/trustlines";

interface AddTrustlineDialogProps {
  /** Curated assets already trusted by the account, used to block duplicates. */
  existingAssets: FormattedBalance[];
  /** Builds, signs and submits the change-trust transaction; returns its hash. */
  onAdd: (asset: TrustlineAsset) => Promise<string>;
  /** Called once the transaction is submitted, so the caller can refresh. */
  onAdded: (transactionHash: string) => void;
  onClose: () => void;
}

type Step = "form" | "signing" | "success";

const CUSTOM_CODE_PATTERN = /^[A-Za-z0-9]{1,12}$/;

export default function AddTrustlineDialog({
  existingAssets,
  onAdd,
  onAdded,
  onClose,
}: AddTrustlineDialogProps) {
  const [selectedCode, setSelectedCode] = useState<string>(
    CURATED_TRUSTLINE_ASSETS[0]?.code ?? "",
  );
  const [isCustom, setIsCustom] = useState(CURATED_TRUSTLINE_ASSETS.length === 0);
  const [customCode, setCustomCode] = useState("");
  const [customIssuer, setCustomIssuer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [transactionHash, setTransactionHash] = useState("");

  const preset = CURATED_TRUSTLINE_ASSETS.find((asset) => asset.code === selectedCode) ?? null;

  const asset: TrustlineAsset | null = isCustom
    ? customCode.trim() && customIssuer.trim()
      ? { code: customCode.trim().toUpperCase(), issuer: customIssuer.trim() }
      : null
    : preset
      ? { code: preset.code, issuer: preset.issuer }
      : null;

  function validate(): string | null {
    if (isCustom) {
      const code = customCode.trim().toUpperCase();
      const issuer = customIssuer.trim();
      if (!CUSTOM_CODE_PATTERN.test(code)) {
        return "Asset code must be 1–12 letters or numbers (for example USDC).";
      }
      if (!StrKey.isValidEd25519PublicKey(issuer)) {
        return "Enter a valid issuer account: 56 characters, starting with G.";
      }
      if (hasTrustline(existingAssets, { code, issuer })) {
        return `${code} is already trusted by this account.`;
      }
      return null;
    }

    if (!preset) return "Choose an asset to add.";
    if (hasTrustline(existingAssets, { code: preset.code, issuer: preset.issuer })) {
      return `${preset.code} is already trusted by this account.`;
    }
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!asset) return;

    setError(null);
    setStep("signing");
    try {
      const hash = await onAdd(asset);
      setTransactionHash(hash);
      setStep("success");
      onAdded(hash);
    } catch (submitError) {
      setError(describeChangeTrustError(submitError, "add"));
      setStep("form");
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a trustline</DialogTitle>
          <DialogDescription>
            A trustline lets your receiving account hold a Stellar asset. Adding one locks
            0.5 XLM of your account reserve.
          </DialogDescription>
        </DialogHeader>

        {step === "success" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 className="size-10 text-emerald-500" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                Trustline added
              </p>
              <p className="text-sm text-muted">
                {asset?.code} can now be received by this account.
              </p>
            </div>
            {transactionHash && (
              <a
                href={stellarExplorerTxUrl(transactionHash)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-info underline-offset-4 hover:underline"
              >
                View transaction <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            )}
            <Button className="mt-2" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <p role="alert" className="rounded-md border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
                {error}
              </p>
            )}

            {!isCustom && (
              <fieldset className="space-y-2" disabled={step === "signing"}>
                <legend className="mb-1 text-sm font-medium text-foreground">
                  Curated assets
                </legend>
                {CURATED_TRUSTLINE_ASSETS.map((option) => {
                  const alreadyTrusted = hasTrustline(existingAssets, option);
                  const isSelected = option.code === selectedCode;
                  return (
                    <button
                      key={`${option.code}-${option.issuer}`}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={alreadyTrusted}
                      onClick={() => {
                        setSelectedCode(option.code);
                        setError(null);
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
                        alreadyTrusted
                          ? "cursor-not-allowed border-border bg-muted/10 opacity-60"
                          : isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                            : "border-border hover:bg-muted/10",
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted/10 text-lg" aria-hidden="true">
                        {option.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">
                          {option.code} · {option.name}
                        </span>
                        <span className="block truncate font-mono text-xs text-muted">
                          {option.issuer}
                        </span>
                      </span>
                      {alreadyTrusted ? (
                        <Badge variant="neutral">Added</Badge>
                      ) : (
                        <Badge variant="info" className="shrink-0">
                          {option.domain}
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </fieldset>
            )}

            <div className="border-t border-border pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsCustom((current) => !current);
                  setError(null);
                }}
              >
                {isCustom ? "Use a curated asset" : "Add a custom asset instead"}
              </Button>
            </div>

            {isCustom && (
              <div className="space-y-3">
                <Input
                  label="Asset code"
                  placeholder="USDC"
                  maxLength={12}
                  value={customCode}
                  disabled={step === "signing"}
                  onChange={(event) => {
                    setCustomCode(event.target.value.toUpperCase());
                    setError(null);
                  }}
                />
                <Input
                  label="Issuer account"
                  placeholder="G…"
                  className="font-mono"
                  value={customIssuer}
                  disabled={step === "signing"}
                  helperText="The Stellar account (G…) that issues this asset."
                  onChange={(event) => {
                    setCustomIssuer(event.target.value.trim());
                    setError(null);
                  }}
                />
              </div>
            )}

            <div className="flex items-start gap-3 rounded-md border border-border bg-muted/10 p-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
              <p className="text-xs text-muted">
                New trustlines are created with the maximum limit (
                {MAX_TRUST_LIMIT} {asset?.code ?? "units"}). The change-trust
                operation is signed by your connected wallet.
              </p>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" disabled={step === "signing"}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" loading={step === "signing"} disabled={step === "signing"}>
                {step === "signing" ? "Waiting for wallet…" : "Sign & add trustline"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
