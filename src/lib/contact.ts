/**
 * Turning a stored phone number into something tappable.
 *
 * Numbers arrive in whatever shape the provider typed them — "+91 90000 10001",
 * "09000010001", "9000010001" — because the registration form deliberately
 * accepts all three (rejecting a valid number over a space is the fastest way
 * to lose a listing). Normalising happens here, at the point of use, so the
 * database keeps what the provider actually wrote and the UI still produces a
 * correct `tel:` or `wa.me` link every time.
 */

/** Digits only, with the country code forced on. `wa.me` will not accept a
 *  local number and silently opens a "phone number shared via url is invalid"
 *  screen instead of erroring, so this must be right. */
function toE164Digits(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `91${digits}`;
  // A leading 0 is the domestic trunk prefix — "09000010001".
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  return digits.length >= 10 ? digits : null;
}

export function telHref(raw: string): string {
  const digits = toE164Digits(raw);
  return digits ? `tel:+${digits}` : `tel:${raw.replace(/\s/g, "")}`;
}

export function whatsappHref(raw: string, message?: string): string | null {
  const digits = toE164Digits(raw);
  if (!digits) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}

/** Grouped the way Indian numbers are read aloud: +91 90000 10001. */
export function formatPhone(raw: string): string {
  const digits = toE164Digits(raw);
  if (!digits) return raw;
  const local = digits.startsWith("91") ? digits.slice(2) : digits;
  if (local.length !== 10) return raw;
  return `+91 ${local.slice(0, 5)} ${local.slice(5)}`;
}

/** Universal maps URL — resolves to the installed maps app on a phone and to
 *  Google Maps in a browser, which is the split this audience actually has. */
export function mapsHref(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
): string | null {
  // `== null` on purpose: a row read before the coordinates migration has run
  // carries `undefined` rather than `null`, and "undefined,undefined" is a
  // perfectly valid-looking URL that drops the user in the Gulf of Guinea.
  if (latitude == null || longitude == null) return null;
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}
