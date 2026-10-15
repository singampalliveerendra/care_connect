import type { Coordinates } from "@/lib/location";

/**
 * The half-finished provider registration, kept in this browser so a refresh
 * or a lost connection doesn't throw away ten minutes of typing.
 *
 * It lives in localStorage only: it never leaves the device, is tied to the
 * signed-in account's email so a shared computer doesn't hand one provider's
 * draft to another, and is dropped once the listing is saved.
 */
export type RegistrationDraft = {
  owner: string;
  /** Plain fields, by form name. */
  values: Record<string, string>;
  /** Ticked checkbox values, by form name. */
  checked: Record<string, string[]>;
  phone: string;
  whatsapp: string;
  sameWhatsapp: boolean;
  location: string;
  coords: Coordinates | null;
  step: number;
  savedAt: number;
};

export const DRAFT_KEY = "care-connect:provider-registration-draft";

/** A draft older than this is more likely stale than useful. */
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/** Uncontrolled fields the draft restores through `defaultValue`. */
export const DRAFT_VALUE_FIELDS = [
  "name",
  "description",
  "cityId",
  "establishedYear",
  "staffSize",
  "areasCovered",
  "pricingBand",
  "email",
  "website",
  "address",
] as const;

export const DRAFT_CHECKBOX_FIELDS = ["serviceIds", "languages", "addressIsPublic"] as const;

function isCoordinates(value: unknown): value is Coordinates {
  const c = value as Coordinates | null;
  return !!c && Number.isFinite(c.latitude) && Number.isFinite(c.longitude);
}

/** Reads the draft for `owner`, or null. Never throws — storage can be blocked. */
export function readDraft(owner: string, now = Date.now()): RegistrationDraft | null {
  let raw: string | null;
  try {
    raw = window.localStorage.getItem(DRAFT_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;

  try {
    const draft = JSON.parse(raw) as Partial<RegistrationDraft>;
    if (!draft || draft.owner !== owner) return null;
    if (typeof draft.savedAt !== "number" || now - draft.savedAt > MAX_AGE_MS) return null;

    const strings = (record: unknown) =>
      Object.fromEntries(
        Object.entries((record as Record<string, unknown>) ?? {}).filter(
          ([, v]) => typeof v === "string",
        ),
      ) as Record<string, string>;
    const lists = (record: unknown) =>
      Object.fromEntries(
        Object.entries((record as Record<string, unknown>) ?? {})
          .filter(([, v]) => Array.isArray(v))
          .map(([k, v]) => [k, (v as unknown[]).filter((x) => typeof x === "string")]),
      ) as Record<string, string[]>;

    return {
      owner,
      values: strings(draft.values),
      checked: lists(draft.checked),
      phone: typeof draft.phone === "string" ? draft.phone : "",
      whatsapp: typeof draft.whatsapp === "string" ? draft.whatsapp : "",
      sameWhatsapp: draft.sameWhatsapp !== false,
      location: typeof draft.location === "string" ? draft.location : "",
      coords: isCoordinates(draft.coords) ? draft.coords : null,
      step: Number.isInteger(draft.step) && draft.step! >= 0 && draft.step! <= 2 ? draft.step! : 0,
      savedAt: draft.savedAt,
    };
  } catch {
    return null;
  }
}

export function writeDraft(draft: RegistrationDraft) {
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Private mode or a full quota: the form still works, it just won't survive a refresh.
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Nothing to clear if storage is unavailable.
  }
}
