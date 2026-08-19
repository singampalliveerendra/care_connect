import Link from "next/link";

import { ArrowRight, Calendar, Globe, MapPin, Rupee } from "@/components/icons";
import { VerificationBadge } from "@/components/verification-badge";
import { PRICING_BAND_LABEL } from "@/lib/domain";
import type { ProviderWithRelations } from "@/lib/queries";

/** Monogram for the avatar tile — providers have no logos in the MVP, and an
 *  empty grey square looks broken where a face or logo would normally sit. */
function initials(name: string) {
  return name
    .replace(/[^\p{L}\p{N} ]/gu, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join("");
}

export function ProviderCard({ provider }: { provider: ProviderWithRelations }) {
  const promoted = provider.tier === "premium";

  return (
    <article
      className={`card card-interactive group relative overflow-hidden p-5 ${
        promoted ? "border-brand-200" : ""
      }`}
    >
      {/* Paid placement is disclosed rather than disguised — brief §12 lets tier
          move a listing up the page, §24 forbids implying it means more trust. */}
      {promoted && (
        <>
          <span
            aria-hidden="true"
            className="absolute inset-x-0 top-0 h-0.5 bg-brand-500"
          />
          <span className="absolute right-4 top-4 rounded-full bg-accent-50 px-2 py-0.5 text-[0.6875rem] font-medium uppercase tracking-wide text-accent-700 ring-1 ring-accent-200">
            Promoted
          </span>
        </>
      )}

      <div className="flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid size-12 shrink-0 place-items-center rounded-card bg-brand-50 font-display text-lg text-brand-700 ring-1 ring-brand-100"
        >
          {initials(provider.name)}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className={`text-lg leading-snug ${promoted ? "pr-24" : ""}`}>
            <Link
              href={`/providers/${provider.slug}`}
              className="text-ink transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-brand-700"
            >
              {provider.name}
            </Link>
          </h3>

          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-faint">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">
              {provider.city.name}
              {provider.areas_covered.length > 0 && (
                <> &middot; {provider.areas_covered.slice(0, 3).join(", ")}</>
              )}
            </span>
          </p>

          <div className="mt-2.5">
            <VerificationBadge level={provider.verification} />
          </div>
        </div>
      </div>

      {provider.description && (
        <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-ink-soft">
          {provider.description}
        </p>
      )}

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {provider.services.slice(0, 4).map((service) => (
          <li key={service.id} className="chip chip-neutral">
            {service.name}
          </li>
        ))}
        {provider.services.length > 4 && (
          <li className="chip text-ink-faint">+{provider.services.length - 4} more</li>
        )}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-ink-faint">
          {provider.pricing_band && (
            <span className="inline-flex items-center gap-1.5">
              <Rupee className="size-4" />
              {PRICING_BAND_LABEL[provider.pricing_band]}
            </span>
          )}
          {provider.languages.length > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="size-4" />
              {provider.languages.slice(0, 3).join(", ")}
            </span>
          )}
          {provider.established_year && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-4" />
              Since {provider.established_year}
            </span>
          )}
        </div>

        {/* Sits above the card-wide overlay link so it stays independently
            clickable and keeps its own focus ring. */}
        <Link
          href={`/providers/${provider.slug}#enquire`}
          className="btn btn-primary relative z-10 px-4 py-2 text-sm"
        >
          Send care request
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}
