/**
 * lib/validation/settings.ts
 *
 * Zod schemas for the merchant settings forms.
 */

import { z } from "zod";
import { StrKey } from "@/lib/stellar/strkey";

export const BUSINESS_CATEGORIES = [
  { value: "retail", label: "Retail & e-commerce" },
  { value: "digital_goods", label: "Digital goods & software" },
  { value: "services", label: "Professional services" },
  { value: "food_beverage", label: "Food & beverage" },
  { value: "travel", label: "Travel & hospitality" },
  { value: "education", label: "Education" },
  { value: "nonprofit", label: "Non-profit" },
  { value: "other", label: "Other" },
] as const;

export const LINK_EXPIRY_OPTIONS = [
  { hours: 1, label: "1 hour" },
  { hours: 24, label: "24 hours" },
  { hours: 72, label: "3 days" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
  { hours: 0, label: "Never expires" },
] as const;

const optionalUrl = z
  .string()
  .trim()
  .refine((value) => value === "" || /^https?:\/\/\S+\.\S+/.test(value), "Enter a valid URL starting with http:// or https://");

export const businessProfileSchema = z.object({
  businessName: z.string().trim().min(2, "Business name is required").max(80),
  legalName: z.string().trim().min(2, "Legal name is required").max(120),
  website: optionalUrl,
  supportEmail: z.string().trim().email("Enter a valid email address"),
  country: z.string().length(2, "Select a country"),
  category: z.string().min(1, "Select a business category"),
  settlementAddress: z
    .string()
    .trim()
    .refine((value) => StrKey.isValidEd25519PublicKey(value), "Enter a valid Stellar public key (starts with G)"),
});

export const brandingSchema = z.object({
  brandColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex colour, e.g. #20A7EE"),
  logo: z.string().nullable(),
  logoFileName: z.string().optional(),
});

export const paymentPreferencesSchema = z.object({
  acceptedAssets: z.array(z.enum(["XLM", "USDC", "EURC"])).min(1, "Accept at least one asset"),
  defaultLinkExpiryHours: z.number().int().min(0),
  defaultRedirectUrl: optionalUrl,
  memoPrefix: z
    .string()
    .trim()
    .max(12, "Keep the prefix to 12 characters so it fits in a Stellar memo")
    .regex(/^[A-Za-z0-9 _-]*$/, "Use letters, numbers, spaces, - or _"),
});

export type BusinessProfileValues = z.infer<typeof businessProfileSchema>;
export type BrandingValues = z.infer<typeof brandingSchema>;
export type PaymentPreferencesValues = z.infer<typeof paymentPreferencesSchema>;
