"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import ReceiptPreviewModal from "@/components/ReceiptPreviewModal";
import { useToast } from "@/components/ui/toast";
import { generateReceiptPdf } from "@/lib/pdfReceipt";
import { useBranding, useBusinessProfile, useSendTestReceipt, useUpdateBranding } from "@/lib/api/hooks/useSettings";
import { getMerchantUser } from "@/lib/storage";
import type { Branding } from "@/lib/types/settings";
import type { Payment } from "@/lib/types";
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
  return {
    brandColor: branding.brandColor.toUpperCase(),
    logo: branding.logoUrl ?? null,
    logoFileName: undefined,
    receiptFooterText: branding.receiptFooterText ?? "",
    receiptSupportContact: branding.receiptSupportContact ?? "",
  };
}

/** A representative payment used only to render the receipt preview/test send — never persisted. */
function sampleReceiptPayment(businessName: string, supportEmail: string): Payment {
  return {
    id: "pay_preview_sample",
    date: new Date().toISOString(),
    amount: 25,
    asset: "USDC",
    status: "COMPLETED",
    customerEmail: "customer@example.com",
    customerWallet: "GDQP2KPQGKIHYJGXNUIYOMHARUARCA7DJT5FO2FFOOKY3IF5IS2RVSQF",
    merchantId: "merch_preview",
    merchantName: businessName || "Your business",
    merchantEmail: supportEmail || "support@example.com",
    txHash: "preview_tx_hash_sample",
    stellarExpertUrl: "https://stellar.expert/explorer/testnet/tx/preview_tx_hash_sample",
    fee: 0.00001,
    description: "Sample receipt for branding preview",
    memo: "PREVIEW",
  };
}

function BrandingForm({ branding }: { branding: Branding }) {
  const toast = useToast();
  const update = useUpdateBranding();
  const sendTestReceipt = useSendTestReceipt();
  const { data: profile } = useBusinessProfile();
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState(false);
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
  const receiptFooterText = watch("receiptFooterText");
  const receiptSupportContact = watch("receiptSupportContact");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await update.mutateAsync(values);
      reset(toFormValues(saved));
      toast("Branding saved", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save branding", "error");
    }
  });

  const currentUserEmail = getMerchantUser().email;

  async function handleSendTestReceipt() {
    try {
      // Generate from the current (possibly unsaved) form values first, so a
      // test send also proves the branding renders into a valid receipt.
      generateReceiptPdf(sampleReceiptPayment(profile?.businessName ?? "", receiptSupportContact || currentUserEmail), {
        accentColor: brandColor,
        footerText: receiptFooterText,
        supportContact: receiptSupportContact,
      });
      await sendTestReceipt.mutateAsync({ to: currentUserEmail });
      toast(`Test receipt sent to ${currentUserEmail}`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not send test receipt", "error");
    }
  }

  const previewPayment = sampleReceiptPayment(profile?.businessName ?? "", receiptSupportContact || currentUserEmail);

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

      <SettingsSection
        title="Customer receipt emails"
        description="Shown on the receipts customers get after paying — logo and colour above are reused automatically."
      >
        <div className="grid grid-cols-1 gap-6">
          <Field id="receiptFooterText" label="Footer text" error={errors.receiptFooterText?.message} hint="Shown at the bottom of every receipt.">
            <textarea
              id="receiptFooterText"
              rows={2}
              className={fieldInputClass}
              placeholder="Thanks for your business!"
              {...register("receiptFooterText")}
            />
          </Field>

          <Field id="receiptSupportContact" label="Support contact" error={errors.receiptSupportContact?.message} hint="Email or phone customers can reach for receipt questions.">
            <input id="receiptSupportContact" className={fieldInputClass} placeholder="support@yourbusiness.com" {...register("receiptSupportContact")} />
          </Field>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsReceiptPreviewOpen(true)}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Preview receipt
            </button>
            <button
              type="button"
              onClick={() => void handleSendTestReceipt()}
              disabled={sendTestReceipt.isPending}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              {sendTestReceipt.isPending ? "Sending…" : `Send test receipt to ${currentUserEmail}`}
            </button>
          </div>
        </div>
      </SettingsSection>

      <ReceiptPreviewModal
        payment={previewPayment}
        isOpen={isReceiptPreviewOpen}
        onClose={() => setIsReceiptPreviewOpen(false)}
        branding={{
          logoUrl: logo,
          accentColor: brandColor,
          footerText: receiptFooterText,
          supportContact: receiptSupportContact,
        }}
      />
    </form>
  );
}
