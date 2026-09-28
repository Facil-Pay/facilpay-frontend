"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/toast";
import { useBranding, useBusinessProfile, useUpdateBranding } from "@/lib/api/hooks/useSettings";
import type { Branding } from "@/lib/types/settings";
import { brandingSchema, type BrandingValues } from "@/lib/validation/settings";
import { CheckoutPreview } from "./CheckoutPreview";
import { Field, FormActions, SettingsError, SettingsLoading, SettingsSection, fieldInputClass } from "./form-fields";
import { LogoUploader } from "./LogoUploader";
import { useUnsavedChangesWarning } from "./use-unsaved-changes-warning";

export function BrandingSettings() {
  const { data, isLoading, isError, error, refetch } = useBranding();
  if (isLoading) return <SettingsLoading />;
  if (isError || !data) return <SettingsError message={error?.message ?? "Unknown error"} onRetry={() => void refetch()} />;
  return <BrandingForm branding={data} />;
}

function toFormValues(branding: Branding): BrandingValues {
  return { brandColor: branding.brandColor.toUpperCase(), logo: branding.logoUrl ?? null, logoFileName: undefined };
}

function BrandingForm({ branding }: { branding: Branding }) {
  const toast = useToast();
  const update = useUpdateBranding();
  const { data: profile } = useBusinessProfile();
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<BrandingValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: toFormValues(branding),
  });

  useUnsavedChangesWarning(isDirty);

  const brandColor = watch("brandColor");
  const logo = watch("logo");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      reset(toFormValues(saved));
      toast("Branding saved", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save branding", "error");
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection title="Checkout branding" description="Your logo and colour are shown on hosted checkout pages and payment links.">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div>
              <p className="mb-1.5 text-sm font-medium text-zinc-800">Logo</p>
              <Controller
                control={control}
                name="logo"
                render={({ field }) => (
                  <LogoUploader
                    value={field.value}
                    onChange={(dataUrl, fileName) => {
                      field.onChange(dataUrl);
                      setValue("logoFileName", fileName);
                    }}
                  />
                )}
              />
            </div>

            <Field id="brandColor" label="Brand colour" error={errors.brandColor?.message}>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  aria-label="Pick brand colour"
                  value={/^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : "#20A7EE"}
                  onChange={(event) => setValue("brandColor", event.target.value.toUpperCase(), { shouldDirty: true, shouldValidate: true })}
                  className="h-10 w-12 cursor-pointer rounded-md border border-zinc-200 bg-white p-1"
                />
                <input
                  id="brandColor"
                  spellCheck={false}
                  className={`${fieldInputClass} max-w-[140px] font-mono uppercase`}
                  aria-invalid={errors.brandColor ? true : undefined}
                  aria-describedby={errors.brandColor ? "brandColor-error" : undefined}
                  {...register("brandColor")}
                />
              </div>
            </Field>
          </div>

          <div>
            <p className="mb-1.5 text-sm font-medium text-zinc-800">Live preview</p>
            <CheckoutPreview logo={logo} brandColor={brandColor} businessName={profile?.businessName ?? ""} />
          </div>
        </div>
        <div className="mt-6">
          <FormActions isDirty={isDirty} isSaving={update.isPending} onReset={() => reset()} />
        </div>
      </SettingsSection>
    </form>
  );
}
