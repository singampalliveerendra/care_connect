import Link from "next/link";

import { Directions, MapPin, PhoneCall, Rupee, WhatsApp } from "@/components/icons";
import { VerificationBadge } from "@/components/verification-badge";
import { formatPhone, mapsHref, telHref, whatsappHref } from "@/lib/contact";
import { PRICING_BAND_LABEL, VERIFICATION } from "@/lib/domain";
import type { ProviderWithRelations } from "@/lib/queries";

/** Monogram for the thumbnail tile — providers have no photos in the MVP, and
 *  an empty grey square looks broken where a building would normally sit. */
function initials(name: string) {
  return name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

/**
 * A directory listing: square thumbnail, then name, trust badge, location,
 * tags, and a row of full-size actions.
 *
 * The action row is the part that matters. Call and WhatsApp are green and
 * carry the number itself; the written request is blue. Printing the number
 * rather than hiding it behind a "show" click is a deliberate trade — some
 * families will ring instead of sending a request we can track — because a
 * listing that makes you work for a phone number reads as one that is farming
 * your details, and this audience is already braced for that.
 */
export function ProviderCard({ provider }: { provider: ProviderWithRelations }) {
  const promoted = provider.tier === "premium";
  const whatsapp = provider.whatsapp
    ? whatsappHref(
        provider.whatsapp,
        `Hello ${provider.name}, I found you on Care Connect and would like to ask about care for a family member.`,
      )
    : null;
  const directions = mapsHref(provider.latitude, provider.longitude);

  /* Street address only when the provider chose to publish it (brief §10);
     otherwise the areas they cover, which is what a home-visit agency has
     instead of a building families would ever turn up at. */
  const locality =
    provider.address_is_public && provider.address
      ? provider.address
      : provider.areas_covered.slice(0, 3).join(", ");

  return (
    <article className="card card-interactive p-4 sm:p-5">
      <div className="flex gap-4 sm:gap-5">
        {/* Square thumbnail, same size on every row so the column of names
            keeps one left edge and the eye can run straight down it. */}
        <span
          aria-hidden="true"
          className="grid size-20 shrink-0 place-items-center self-start overflow-hidden rounded-card border border-line bg-brand-50 text-xl font-semibold text-brand-700 sm:size-28 sm:text-3xl"
        >
          {initials(provider.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-semibold leading-snug sm:text-xl">
              <Link
                href={`/providers/${provider.slug}`}
                className="text-ink transition-colors hover:text-brand-600"
              >
                {provider.name}
              </Link>
            </h3>

            {/* Paid placement is disclosed rather than disguised — brief §12
                lets tier move a listing up the page, §24 forbids implying it
                means more trust, so it is grey and it says what it is. */}
            {promoted && (
              <span className="chip chip-neutral shrink-0 text-[0.6875rem] font-semibold uppercase tracking-wide text-ink-faint">
                Promoted
              </span>
            )}
          </div>

          {/* The green badge slot. A directory usually puts a star rating here;
              Care Connect has no reviews yet, and inventing them on a page about
              elderly care is not a shortcut worth taking — so the slot carries
              the verification level, which is a fact we can stand behind. */}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
            <VerificationBadge level={provider.verification} />
            {/* The slot never sits empty: "not verified yet" is information a
                family wants as much as a badge is, and an absent badge would
                otherwise be indistinguishable from a missing one. */}
            {!VERIFICATION[provider.verification].showBadge && (
              <span className="chip chip-neutral font-medium text-ink-faint">
                Not verified yet
              </span>
            )}

            {provider.pricing_band && (
              <span className="inline-flex items-center gap-1 text-sm text-ink-soft">
                <Rupee className="size-4 text-ink-faint" />
                {PRICING_BAND_LABEL[provider.pricing_band]}
              </span>
            )}

            {provider.established_year && (
              <span className="text-sm text-ink-faint">
                Since {provider.established_year}
              </span>
            )}
          </div>

          <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-soft">
            <MapPin className="mt-0.5 size-4 shrink-0 text-ink-faint" />
            <span className="min-w-0">
              {locality && <>{locality} &middot; </>}
              <span className="text-ink-faint">
                {provider.city.name}, {provider.city.state}
              </span>
              {directions && (
                <>
                  {" "}
                  <a
                    href={directions}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand-600 hover:underline"
                  >
                    <Directions className="size-3.5" />
                    Directions
                  </a>
                </>
              )}
            </span>
          </p>

          {provider.description && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-soft">
              {provider.description}
            </p>
          )}

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {provider.services.slice(0, 4).map((service) => (
              <li key={service.id} className="chip chip-neutral">
                {service.name}
              </li>
            ))}
            {provider.services.length > 4 && (
              <li className="chip chip-neutral text-ink-faint">
                +{provider.services.length - 4} more
              </li>
            )}
          </ul>
        </div>
      </div>

      {/* ------------------------------------------------------ action row */}
      <div className="mt-4 flex flex-wrap gap-2.5 border-t border-line-soft pt-4 sm:ps-[8.25rem]">
        <a
          href={telHref(provider.phone)}
          className="btn btn-call"
          aria-label={`Call ${provider.name} on ${formatPhone(provider.phone)}`}
        >
          <PhoneCall className="size-4" />
          {formatPhone(provider.phone)}
        </a>

        {whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
            aria-label={`Message ${provider.name} on WhatsApp`}
          >
            <WhatsApp className="size-4 text-whatsapp" />
            WhatsApp
          </a>
        )}

        <Link href={`/providers/${provider.slug}#enquire`} className="btn btn-primary">
          Send Enquiry
        </Link>
      </div>
    </article>
  );
}
