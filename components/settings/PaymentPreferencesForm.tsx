"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/components/ui/utils";
import { useToast } from "@/components/ui/toast";
import { usePaymentPreferences, useUpdatePaymentPreferences } from "@/lib/api/hooks/useSettings";
import type { PaymentPreferences, SettlementAsset } from "@/lib/types/settings";
import { LINK_EXPIRY_OPTIONS, paymentPreferencesSchema, type PaymentPreferencesValues } from "@/lib/validation/settings";
import { Field, FormActions, SettingsError, SettingsLoading, SettingsSection, fieldInputClass } from "./form-fields";
import { useUnsavedChangesWarning } from "./use-unsaved-changes-warning";

const ASSETS: { code: SettlementAsset; name: string }[] = [
  { code: "XLM", name: "Stellar Lumens" },
  { code: "USDC", name: "USD Coin" },
  { code: "EURC", name: "Euro Coin" },
];

export function PaymentPreferencesSettings() {
  const { data, isLoading, isError, error, refetch } = usePaymentPreferences();
  if (isLoading) return <SettingsLoading />;
  if (isError || !data) return <SettingsError message={error?.message ?? "Unknown error"} onRetry={() => void refetch()} />;
  return <PaymentPreferencesForm preferences={data} />;
}

function PaymentPreferencesForm({ preferences }: { preferences: PaymentPreferences }) {
  const toast = useToast();
  const update = useUpdatePaymentPreferences();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<PaymentPreferencesValues>({
    resolver: zodResolver(paymentPreferencesSchema),
    defaultValues: preferences,
  });

  useUnsavedChangesWarning(isDirty);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      reset(saved);
      toast("Payment preferences saved", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save preferences", "error");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection title="Payment preferences" description="Defaults applied to new payment links and checkouts.">
        <div className="space-y-6">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-zinc-800">Accepted assets</legend>
            <Controller
              control={control}
              name="acceptedAssets"
              render={({ field }) => (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {ASSETS.map((asset) => {
                    const checked = field.value.includes(asset.code);
                    return (
                      <label
                        key={asset.code}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2.5",
                          checked ? "border-sky-400 bg-sky-50" : "border-zinc-200 hover:bg-zinc-50",
                        )}
                      >
                        <span>
                          <span className="block text-sm font-semibold text-zinc-900">{asset.code}</span>
                          <span className="block text-xs text-zinc-500">{asset.name}</span>
                        </span>
                        <input
                          type="checkbox"
                          role="switch"
                          checked={checked}
                          onChange={(event) =>
                            field.onChange(
                              event.target.checked
                                ? ASSETS.map((a) => a.code).filter((code) => code === asset.code || field.value.includes(code))
                                : field.value.filter((code) => code !== asset.code),
                            )
                          }
                          className="h-4 w-4 accent-sky-500"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            />
            {errors.acceptedAssets && (
              <p role="alert" className="mt-1 text-xs text-red-600">
                {errors.acceptedAssets.message}
              </p>
            )}
          </fieldset>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field id="defaultLinkExpiryHours" label="Default payment link expiry" error={errors.defaultLinkExpiryHours?.message}>
              <select id="defaultLinkExpiryHours" className={fieldInputClass} {...register("defaultLinkExpiryHours", { valueAsNumber: true })}>
                {LINK_EXPIRY_OPTIONS.map((option) => (
                  <option key={option.hours} value={option.hours}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="memoPrefix"
              label="Statement descriptor / memo prefix"
              hint="Prepended to the Stellar memo on each payment."
              error={errors.memoPrefix?.message}
            >
              <input
                id="memoPrefix"
                maxLength={12}
                className={fieldInputClass}
                aria-invalid={errors.memoPrefix ? true : undefined}
                aria-describedby={errors.memoPrefix ? "memoPrefix-error" : undefined}
                {...register("memoPrefix")}
              />
            </Field>
            <Field
              id="defaultRedirectUrl"
              label="Default redirect URL"
              hint="Where customers go after a successful payment."
              error={errors.defaultRedirectUrl?.message}
              className="sm:col-span-2"
            >
              <input
                id="defaultRedirectUrl"
                type="url"
                placeholder="https://"
                className={fieldInputClass}
                aria-invalid={errors.defaultRedirectUrl ? true : undefined}
                aria-describedby={errors.defaultRedirectUrl ? "defaultRedirectUrl-error" : undefined}
                {...register("defaultRedirectUrl")}
              />
            </Field>
          </div>
        </div>
        <div className="mt-6">
          <FormActions isDirty={isDirty} isSaving={update.isPending} onReset={() => reset()} />
        </div>
      </SettingsSection>
    </form>
  );
}
