"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/components/ui/toast";
import { useBusinessProfile, useUpdateBusinessProfile } from "@/lib/api/hooks/useSettings";
import type { BusinessProfile } from "@/lib/types/settings";
import { BUSINESS_CATEGORIES, businessProfileSchema, type BusinessProfileValues } from "@/lib/validation/settings";
import { Field, FormActions, SettingsError, SettingsLoading, SettingsSection, fieldInputClass } from "./form-fields";
import { useUnsavedChangesWarning } from "./use-unsaved-changes-warning";

const COUNTRY_CODES = [
  "AR", "AU", "BR", "CA", "CL", "CO", "DE", "ES", "FR", "GB", "GH", "IN", "IT", "JP", "KE",
  "MX", "NG", "NL", "PE", "PH", "PT", "SG", "TR", "UA", "US", "VN", "ZA",
];

export function BusinessProfileSettings() {
  const { data, isLoading, isError, error, refetch } = useBusinessProfile();
  if (isLoading) return <SettingsLoading />;
  if (isError || !data) return <SettingsError message={error?.message ?? "Unknown error"} onRetry={() => void refetch()} />;
  return <BusinessProfileForm profile={data} />;
}

function BusinessProfileForm({ profile }: { profile: BusinessProfile }) {
  const toast = useToast();
  const update = useUpdateBusinessProfile();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<BusinessProfileValues>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: profile,
  });

  useUnsavedChangesWarning(isDirty);

  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return COUNTRY_CODES.map((code) => ({ code, name: names.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      reset(saved);
      toast("Business profile saved", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save profile", "error");
    }
  });

  const aria = (name: keyof BusinessProfileValues) => ({
    "aria-invalid": errors[name] ? true : undefined,
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SettingsSection title="Business profile" description="How your business appears to customers and on receipts.">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field id="businessName" label="Business name" error={errors.businessName?.message}>
            <input id="businessName" className={fieldInputClass} {...aria("businessName")} {...register("businessName")} />
          </Field>
          <Field id="legalName" label="Legal name" error={errors.legalName?.message}>
            <input id="legalName" className={fieldInputClass} {...aria("legalName")} {...register("legalName")} />
          </Field>
          <Field id="website" label="Website" error={errors.website?.message}>
            <input id="website" type="url" placeholder="https://" className={fieldInputClass} {...aria("website")} {...register("website")} />
          </Field>
          <Field id="supportEmail" label="Support email" error={errors.supportEmail?.message}>
            <input id="supportEmail" type="email" className={fieldInputClass} {...aria("supportEmail")} {...register("supportEmail")} />
          </Field>
          <Field id="country" label="Country" error={errors.country?.message}>
            <select id="country" className={fieldInputClass} {...aria("country")} {...register("country")}>
              <option value="">Select a country</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </Field>
          <Field id="category" label="Business category" error={errors.category?.message}>
            <select id="category" className={fieldInputClass} {...aria("category")} {...register("category")}>
              <option value="">Select a category</option>
              {BUSINESS_CATEGORIES.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="settlementAddress"
            label="Settlement Stellar address"
            hint="Payments settle to this Stellar account."
            error={errors.settlementAddress?.message}
            className="sm:col-span-2"
          >
            <input
              id="settlementAddress"
              spellCheck={false}
              autoComplete="off"
              placeholder="G…"
              className={`${fieldInputClass} font-mono text-xs`}
              {...aria("settlementAddress")}
              {...register("settlementAddress")}
            />
          </Field>
        </div>
        <div className="mt-6">
          <FormActions isDirty={isDirty} isSaving={update.isPending} onReset={() => reset()} />
        </div>
      </SettingsSection>
    </form>
  );
}
