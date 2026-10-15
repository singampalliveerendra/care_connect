export const REGISTRATION_STEPS = [
  "Your organisation",
  "What you offer",
  "How families reach you",
] as const;

/** Which step shows each field, so a server error can open the right one.
 *  Anything not listed lives on the last step. */
const FIELD_STEP: Record<string, number> = {
  name: 0,
  description: 0,
  cityId: 0,
  establishedYear: 0,
  staffSize: 0,
  serviceIds: 1,
  areasCovered: 1,
  languages: 1,
  pricingBand: 1,
};

/** The earliest step holding a field the server rejected, or null. */
export function firstStepWithError(fieldErrors: Record<string, string> | undefined) {
  const keys = Object.keys(fieldErrors ?? {});
  if (!keys.length) return null;
  return Math.min(...keys.map((key) => FIELD_STEP[key] ?? REGISTRATION_STEPS.length - 1));
}
