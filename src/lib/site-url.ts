/**
 * The origin the browser actually reached us on.
 *
 * OAuth redirect URLs have to match the address the user is sitting at, not a
 * build-time constant: the same deployment answers on localhost, a Vercel
 * preview domain, and the production domain. `NEXT_PUBLIC_SITE_URL` is only
 * the fallback for when there is no request to read (it is still what the
 * sitemap and metadata use, where a canonical host is the right answer).
 */
export function requestOrigin(headers: Headers) {
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!host) return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const proto =
    headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${proto}://${host}`;
}
