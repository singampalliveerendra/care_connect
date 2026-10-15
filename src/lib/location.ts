/**
 * Reads a map pin out of whatever a provider copies from Google Maps.
 *
 * Providers rarely stand at their own gate while filling in the form, so the
 * geolocation button alone leaves most listings without Directions. What they
 * can do is open Google Maps, find their building and copy something — and
 * depending on the device that "something" is a full maps URL, a
 * maps.app.goo.gl share link, decimal coordinates from the pin's info card, or
 * the degrees-minutes-seconds string Maps shows in its title bar.
 *
 * Everything here is pure so the form can give instant feedback and the server
 * action can re-check the same text without trusting the browser.
 */

export type Coordinates = { latitude: number; longitude: number };

export type LocationParseResult =
  | { kind: "empty" }
  | { kind: "coordinates"; coordinates: Coordinates }
  /** A share link that only reveals coordinates once its redirect is followed. */
  | { kind: "short-link"; url: string }
  | { kind: "invalid"; message: string };

/**
 * Every city we list is in India. The box is generous — it only exists to
 * catch a pin dropped on the wrong continent or latitude/longitude typed the
 * wrong way round (83.2, 17.6 is in the Arctic).
 */
const INDIA_BOUNDS = { minLat: 6, maxLat: 37.5, minLng: 68, maxLng: 97.5 };

/** Hosts whose links redirect to a full Google Maps URL. */
export const SHORT_LINK_HOSTS = ["maps.app.goo.gl", "goo.gl"] as const;

const INVALID_INPUT =
  "We couldn't find a location in that. Paste a Google Maps link, or coordinates like 17.6868, 83.2185.";

/** Six decimals is ~0.1 m and matches the numeric(9,6) column. */
function round6(value: number) {
  return Math.round(value * 1e6) / 1e6;
}

/** Range and plausibility checks shared by the parser and the server schema. */
export function coordinatesProblem(latitude: number, longitude: number): string | null {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return INVALID_INPUT;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return "Those coordinates aren't on the map. Latitude comes first, then longitude.";
  }
  if (latitude === 0 && longitude === 0) {
    return "0, 0 isn't a real address. Copy the pin from Google Maps again.";
  }
  const inIndia =
    latitude >= INDIA_BOUNDS.minLat &&
    latitude <= INDIA_BOUNDS.maxLat &&
    longitude >= INDIA_BOUNDS.minLng &&
    longitude <= INDIA_BOUNDS.maxLng;
  if (!inIndia) {
    return "That point is outside India. Check you copied the right pin, latitude first.";
  }
  return null;
}

function finish(latitude: number, longitude: number): LocationParseResult {
  const problem = coordinatesProblem(latitude, longitude);
  if (problem) return { kind: "invalid", message: problem };
  return { kind: "coordinates", coordinates: { latitude: round6(latitude), longitude: round6(longitude) } };
}

const NUMBER = String.raw`[+-]?\d{1,3}(?:\.\d+)?`;
const DECIMAL_PAIR = new RegExp(String.raw`^\(?\s*(${NUMBER})\s*(?:,|;|\s)\s*(${NUMBER})\s*\)?$`);

/* 17°40'17.1"N — minutes and seconds optional, so 17.6714°N also matches.
   Google uses ASCII quotes; phones and word processors swap in ′ ″ ’ ”. */
const DMS = String.raw`(\d{1,3}(?:\.\d+)?)\s*°\s*(?:(\d{1,2}(?:\.\d+)?)\s*['′’]\s*)?(?:(\d{1,2}(?:\.\d+)?)\s*(?:"|″|”|''|′′)\s*)?([NSEW])`;
const DMS_PAIR = new RegExp(String.raw`^${DMS}[\s,;]*${DMS}$`, "i");

function dmsToDecimal(deg: string, min: string | undefined, sec: string | undefined, hemisphere: string) {
  const minutes = min ? Number(min) : 0;
  const seconds = sec ? Number(sec) : 0;
  if (minutes >= 60 || seconds >= 60) return Number.NaN;
  const value = Number(deg) + minutes / 60 + seconds / 3600;
  return /[SW]/i.test(hemisphere) ? -value : value;
}

/** Plain-text coordinates: decimal or degrees-minutes-seconds. */
function parseCoordinateText(text: string): LocationParseResult | null {
  const cleaned = text.replace(/\s+/g, " ").trim();

  const decimal = cleaned.match(DECIMAL_PAIR);
  if (decimal) return finish(Number(decimal[1]), Number(decimal[2]));

  const dms = cleaned.match(DMS_PAIR);
  if (dms) {
    const first = dmsToDecimal(dms[1], dms[2], dms[3], dms[4]);
    const second = dmsToDecimal(dms[5], dms[6], dms[7], dms[8]);
    const firstIsLat = /[NS]/i.test(dms[4]);
    // One of each hemisphere axis, in either order — "N…N" is not a point.
    if (firstIsLat === /[NS]/i.test(dms[8])) return null;
    return firstIsLat ? finish(first, second) : finish(second, first);
  }

  return null;
}

function isGoogleMapsHost(host: string) {
  // google.com, www.google.co.in, maps.google.com, …
  return /(^|\.)google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2})$/i.test(host);
}

function parseMapsUrl(url: URL): LocationParseResult | null {
  const host = url.hostname.toLowerCase();

  if ((SHORT_LINK_HOSTS as readonly string[]).includes(host)) {
    // goo.gl also shortened non-Maps links; only /maps/ ones point at a place.
    if (host === "goo.gl" && !url.pathname.startsWith("/maps")) return null;
    return { kind: "short-link", url: url.toString() };
  }

  if (!isGoogleMapsHost(host)) return null;

  // consent.google.com and some app links carry the real URL in a parameter.
  const continuation = url.searchParams.get("continue") ?? url.searchParams.get("link");
  if (continuation) {
    const inner = parseLocation(continuation);
    if (inner.kind !== "invalid" && inner.kind !== "empty") return inner;
  }

  const decoded = decodeURIComponent(url.href.replace(/\+/g, " "));

  // !3d…!4d… is the place's own pin. Take the last pair: earlier ones can
  // belong to the map tile or a previously viewed place.
  const pins = [...decoded.matchAll(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/g)];
  if (pins.length) {
    const [, lat, lng] = pins[pins.length - 1];
    return finish(Number(lat), Number(lng));
  }

  for (const key of ["q", "query", "ll", "destination", "daddr", "center", "sll"]) {
    const value = url.searchParams.get(key);
    if (value) {
      const parsed = parseCoordinateText(value.replace(/\+/g, " "));
      if (parsed) return parsed;
    }
  }

  // /maps/place/17.6868,83.2185/… and /maps/search/17°40'17.1"N 83°…/
  const segments = url.pathname.split("/").map((s) => decodeURIComponent(s.replace(/\+/g, " ")));
  for (const segment of segments) {
    const parsed = parseCoordinateText(segment);
    if (parsed) return parsed;
  }

  // @lat,lng,zoom is where the map was centred — close to the place but not
  // the pin itself, so it is only the last resort.
  const viewport = decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|$)/);
  if (viewport) return finish(Number(viewport[1]), Number(viewport[2]));

  return null;
}

export function parseLocation(input: string | null | undefined): LocationParseResult {
  const text = (input ?? "").trim();
  if (!text) return { kind: "empty" };
  if (text.length > 2048) return { kind: "invalid", message: "That link is too long to be a map location." };

  // Share sheets often prepend the place name: "Asha Home https://maps.app.goo.gl/…"
  const urlMatch = text.match(/https?:\/\/\S+/i) ?? text.match(/^(?:www\.|maps\.|goo\.gl)\S+/i);
  if (urlMatch) {
    let url: URL;
    try {
      url = new URL(urlMatch[0].startsWith("http") ? urlMatch[0] : `https://${urlMatch[0]}`);
    } catch {
      return { kind: "invalid", message: INVALID_INPUT };
    }
    return (
      parseMapsUrl(url) ?? {
        kind: "invalid",
        message:
          "That link has no map pin in it. In Google Maps, tap your building's pin and copy its coordinates or share link.",
      }
    );
  }

  return parseCoordinateText(text) ?? { kind: "invalid", message: INVALID_INPUT };
}

/** The link families get, and the provider uses to check the pin. */
export function mapsSearchUrl({ latitude, longitude }: Coordinates) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

/**
 * Follows a maps.app.goo.gl / goo.gl/maps share link to the full Maps URL and
 * reads the pin from it. Server-only: the browser can't read cross-origin
 * redirects.
 *
 * Only Google hosts are ever requested and redirects are followed by hand, so
 * this can't be turned into a fetch-anything proxy.
 */
export async function resolveShortLink(
  link: string,
  fetchImpl: FetchLike = fetch,
): Promise<LocationParseResult> {
  const failed: LocationParseResult = {
    kind: "invalid",
    message:
      "We couldn't open that share link. Open it in Google Maps, tap the pin and copy the coordinates instead.",
  };

  let current: URL;
  try {
    current = new URL(link);
  } catch {
    return failed;
  }

  for (let hop = 0; hop < 5; hop++) {
    const host = current.hostname.toLowerCase();
    const allowed =
      current.protocol === "https:" &&
      ((SHORT_LINK_HOSTS as readonly string[]).includes(host) || isGoogleMapsHost(host));
    if (!allowed) return failed;

    let response: Response;
    try {
      response = await fetchImpl(current.toString(), {
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
        headers: { "user-agent": "Mozilla/5.0 (compatible; CareConnect location check)" },
      });
    } catch {
      return failed;
    }

    const location = response.headers.get("location");
    if (response.status < 300 || response.status >= 400 || !location) return failed;

    try {
      current = new URL(location, current);
    } catch {
      return failed;
    }

    const parsed = parseMapsUrl(current);
    if (parsed?.kind === "coordinates" || parsed?.kind === "invalid") return parsed;
  }

  return failed;
}
