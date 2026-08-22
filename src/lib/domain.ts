/**
 * Vocabulary shared by the database enums and the UI.
 * Labels live here so wording changes never require a migration.
 */

export const VERIFICATION_LEVELS = [
  "unverified",
  "business_verified",
  "credential_verified",
  "background_check",
  "careconnect_verified",
] as const;
export type VerificationLevel = (typeof VERIFICATION_LEVELS)[number];

/**
 * Brief §11: a badge may only be shown once its definition is documented.
 * These are those definitions — displayed verbatim to families.
 */
export const VERIFICATION: Record<
  VerificationLevel,
  { label: string; definition: string; showBadge: boolean }
> = {
  unverified: {
    label: "Not yet verified",
    definition: "Listed on Care Connect. Verification has not been completed.",
    showBadge: false,
  },
  business_verified: {
    label: "Business verified",
    definition: "Care Connect has checked this provider's basic business details.",
    showBadge: true,
  },
  credential_verified: {
    label: "Credentials verified",
    definition:
      "Care Connect has checked the professional credentials relevant to the services offered.",
    showBadge: true,
  },
  background_check: {
    label: "Background checked",
    definition:
      "A background or police check has been completed where applicable and available.",
    showBadge: true,
  },
  careconnect_verified: {
    label: "Care Connect Verified",
    definition:
      "This provider has completed the full set of checks defined by Care Connect policy.",
    showBadge: true,
  },
};

export const TIERS = ["free", "standard", "premium"] as const;
export type Tier = (typeof TIERS)[number];

/** Search ranking weight. Brief §12: Premium top, Standard boosted, Free listed. */
export const TIER_RANK: Record<Tier, number> = { premium: 0, standard: 1, free: 2 };

/**
 * Result ordering. "Recommended" is the brief §12 order (paid placement first,
 * verification breaking ties) and stays the default; the other two exist so a
 * family that distrusts that order has somewhere to go, which is the honest
 * way to run a ranked directory.
 */
export const SORT_OPTIONS = ["recommended", "verified", "name"] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

export const SORT_LABEL: Record<SortOption, string> = {
  recommended: "Recommended",
  verified: "Most verified",
  name: "Name (A–Z)",
};

/**
 * How many providers one sidebar request may reach at once.
 *
 * Three, because it is the number the "what happens next" page already tells
 * families is normal to contact, and because a request that lands on ten desks
 * turns a care enquiry into spam — for the family answering ten calls as much
 * as for the providers paying for the lead.
 */
export const SHORTLIST_MAX = 3;

export const PRICING_BANDS = ["budget", "mid", "premium"] as const;
export const PRICING_BAND_LABEL: Record<string, string> = {
  budget: "Budget",
  mid: "Mid-range",
  premium: "Premium",
};

export const MOBILITY_LEVELS = [
  "independent",
  "needs_assistance",
  "wheelchair",
  "bedridden",
] as const;
export const MOBILITY_LABEL: Record<string, string> = {
  independent: "Moves around independently",
  needs_assistance: "Needs some assistance",
  wheelchair: "Uses a wheelchair",
  bedridden: "Bedridden",
};

export const URGENCY_LEVELS = [
  "immediate",
  "within_week",
  "within_month",
  "planning",
] as const;
export const URGENCY_LABEL: Record<string, string> = {
  immediate: "Immediately",
  within_week: "Within a week",
  within_month: "Within a month",
  planning: "Just planning ahead",
};

export const LANGUAGES = [
  "Telugu", "Hindi", "English", "Tamil", "Kannada",
  "Malayalam", "Marathi", "Bengali", "Gujarati", "Urdu", "Odia", "Punjabi",
] as const;

export const STAFF_SIZES = ["1-10", "10-25", "25-50", "50-100", "100+"] as const;
