import { z } from "zod";

import { coordinatesProblem } from "@/lib/location";
import {
  LANGUAGES,
  MOBILITY_LEVELS,
  PRICING_BANDS,
  SHORTLIST_MAX,
  SORT_OPTIONS,
  STAFF_SIZES,
  URGENCY_LEVELS,
} from "@/lib/domain";

/** Indian mobile numbers, with or without +91 and common separators. */
const phone = z
  .string()
  .trim()
  .min(10, "Enter a phone number we can reach you on")
  .max(20)
  .regex(/^(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}$/, "Enter a valid mobile number");

/** Digits left once +91 / 91 / a trunk 0 and separators are stripped. */
function nationalDigits(value: string) {
  const digits = value.replace(/[\s\-().]/g, "");
  if (!/^\+?\d+$/.test(digits)) return null;
  const bare = digits.replace(/^\+/, "");
  if (bare.length === 12 && bare.startsWith("91")) return bare.slice(2);
  if (bare.length === 11 && bare.startsWith("0")) return bare.slice(1);
  return digits.startsWith("+") ? null : bare;
}

const isMobile = (value: string) => /^[6-9]\d{9}$/.test(nationalDigits(value) ?? "");

/**
 * A listing's contact number. Unlike a family's number this is often a
 * landline — a care home answers on 0891 2xxxxxx — so an STD-coded fixed line
 * is accepted as well as a mobile.
 */
const providerPhone = z
  .string()
  .trim()
  .min(10, "Enter a phone number families can reach you on")
  .max(20)
  .refine(
    (v) => /^[1-9]\d{9}$/.test(nationalDigits(v) ?? ""),
    "Enter a 10-digit mobile, or a landline with its STD code",
  );

/** WhatsApp only runs on mobiles, and a listing may simply not have one. */
const optionalPhone = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => v || undefined)
  .refine(
    (v) => v === undefined || isMobile(v),
    "Enter a valid mobile number, or leave this blank",
  );

/** A map pin arrives as form text and is empty when the provider skipped it.
 *  Blank must stay blank: coercing "" gives 0, a pin in the Atlantic. */
const optionalCoordinate = (max: number) =>
  z.preprocess(
    (v) => (v === "" || v === null || v === undefined ? undefined : v),
    z.coerce.number("Enter a number").min(-max).max(max).optional(),
  );

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal("")).transform((v) => v || undefined);

/**
 * Brief §9 — the structured care request.
 * Required: name, phone, city, service, care requirement. Everything else is
 * optional or recommended. No clinical history is collected.
 */
export const enquirySchema = z.object({
  providerId: z.uuid(),
  cityId: z.uuid(),
  serviceId: z.uuid("Choose the service you need"),

  familyName: z.string().trim().min(2, "Enter your name").max(120),
  phone,
  email: z.email("Enter a valid email").optional().or(z.literal("")).transform((v) => v || undefined),

  recipientAge: z.coerce.number().int().min(0).max(120).optional(),
  recipientGender: z.enum(["female", "male", "other", "prefer_not_to_say"]).optional(),
  area: optionalText(120),

  careRequirement: z
    .string()
    .trim()
    .min(20, "Tell the provider a little about what is needed — at least a sentence")
    .max(2000),

  mobility: z.enum(MOBILITY_LEVELS).optional(),
  hoursRequired: optionalText(60),
  startDate: z.iso.date().optional().or(z.literal("")).transform((v) => v || undefined),
  duration: optionalText(60),
  preferredLanguage: z.enum(LANGUAGES).optional(),
  preferredCaregiverSex: z.enum(["female", "male", "no_preference"]).optional(),
  budgetBand: z.enum(PRICING_BANDS).optional(),
  urgency: z.enum(URGENCY_LEVELS).optional(),
  additionalMessage: optionalText(1000),

  /** Honeypot — checked before validation; see the enquiries route. */
  website: z.string().optional(),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/**
 * The short form in the search sidebar: one request, sent to the handful of
 * providers currently at the top of the results.
 *
 * It asks for less than the full care request because it is answered before a
 * family has picked anybody — but it still requires a written requirement, so
 * what lands in a provider's inbox is a real enquiry rather than a bare phone
 * number they have to cold-call.
 */
export const shortlistEnquirySchema = z.object({
  providerIds: z.array(z.uuid()).min(1, "Nobody to send this to").max(SHORTLIST_MAX),
  /* No city: each enquiry is filed against the city its provider operates in,
     read from the provider row in the route. */
  serviceId: z.uuid("Choose the type of care you need"),

  familyName: z.string().trim().min(2, "Enter your name").max(120),
  phone,
  email: z.email("Enter a valid email").optional().or(z.literal("")).transform((v) => v || undefined),
  careRequirement: z
    .string()
    .trim()
    .min(20, "A sentence about what's needed helps them answer properly")
    .max(2000),

  /** Honeypot — see the enquiries route. */
  website: z.string().optional(),
});

export type ShortlistEnquiryInput = z.infer<typeof shortlistEnquirySchema>;

/** Brief §6.2 — multi-step provider registration. */
export const providerRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Enter your organisation's name").max(160),
  description: z.string().trim().min(40, "Describe your service in a sentence or two").max(500),
  cityId: z.uuid("Choose the city you operate in"),
  serviceIds: z.array(z.uuid()).min(1, "Select at least one service you offer"),
  areasCovered: z.array(z.string().trim().min(1).max(80)).max(20).default([]),
  languages: z.array(z.enum(LANGUAGES)).max(12).default([]),
  phone: providerPhone,
  whatsapp: optionalPhone,
  email: z.email("Enter a valid contact email"),
  website: z.url("Enter a valid URL").optional().or(z.literal("")).transform((v) => v || undefined),
  address: optionalText(300),
  addressIsPublic: z.boolean().default(false),
  latitude: optionalCoordinate(90),
  longitude: optionalCoordinate(180),
  pricingBand: z.enum(PRICING_BANDS).optional(),
  establishedYear: z.coerce
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear())
    .optional(),
  staffSize: z.enum(STAFF_SIZES).optional(),
}).superRefine((input, ctx) => {
  if ((input.latitude === undefined) !== (input.longitude === undefined)) {
    ctx.addIssue({ code: "custom", message: "Set the pin again — we only got half of it", path: ["location"] });
    return;
  }
  if (input.latitude === undefined || input.longitude === undefined) return;
  const problem = coordinatesProblem(input.latitude, input.longitude);
  if (problem) ctx.addIssue({ code: "custom", message: problem, path: ["location"] });
});

export type ProviderRegistrationInput = z.infer<typeof providerRegistrationSchema>;

/** Search filters (brief §6.1). */
export const searchParamsSchema = z.object({
  city: z.string().trim().max(80).optional(),
  service: z.string().trim().max(80).optional(),
  area: z.string().trim().max(80).optional(),
  language: z.string().trim().max(40).optional(),
  verified: z.enum(["any", "verified"]).default("any"),
  tier: z.enum(["any", "standard", "premium"]).default("any"),
  sort: z.enum(SORT_OPTIONS).default("recommended"),
  page: z.coerce.number().int().min(1).max(200).default(1),
});
