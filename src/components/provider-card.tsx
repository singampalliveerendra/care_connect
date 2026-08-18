import Link from "next/link";

import { VerificationBadge } from "@/components/verification-badge";
import { PRICING_BAND_LABEL } from "@/lib/domain";
import type { ProviderWithRelations } from "@/lib/queries";

export function ProviderCard({ provider }: { provider: ProviderWithRelations }) {
  const highlighted = provider.tier === "premium";

  return (
    <article
      className={`rounded-card border bg-surface p-5 transition-shadow hover:shadow-sm ${
        highlighted ? "border-brand-100 ring-1 ring-brand-100" : "border-line"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg">
            <Link
              href={`/providers/${provider.slug}`}
              className="text-ink hover:text-brand-700"
            >
              {provider.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-sm text-ink-faint">
            {provider.city.name}
            {provider.areas_covered.length > 0 && (
              <> &middot; {provider.areas_covered.slice(0, 3).join(", ")}</>
            )}
          </p>
        </div>
        <VerificationBadge level={provider.verification} />
      </div>

      {provider.description && (
        <p className="mt-3 line-clamp-2 text-sm text-ink-soft">{provider.description}</p>
      )}

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {provider.services.slice(0, 4).map((service) => (
          <li
            key={service.id}
            className="rounded-full bg-surface-alt px-2.5 py-1 text-xs text-ink-soft"
          >
            {service.name}
          </li>
        ))}
        {provider.services.length > 4 && (
          <li className="px-1 py-1 text-xs text-ink-faint">
            +{provider.services.length - 4} more
          </li>
        )}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-4 text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-faint">
          {provider.pricing_band && (
            <span>{PRICING_BAND_LABEL[provider.pricing_band]}</span>
          )}
          {provider.languages.length > 0 && (
            <span>{provider.languages.slice(0, 3).join(", ")}</span>
          )}
          {provider.established_year && <span>Since {provider.established_year}</span>}
        </div>

        <Link
          href={`/providers/${provider.slug}#enquire`}
          className="rounded-card bg-brand-600 px-3.5 py-2 font-medium text-white transition-colors hover:bg-brand-700"
        >
          Send care request
        </Link>
      </div>
    </article>
  );
}
