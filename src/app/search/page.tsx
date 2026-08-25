import type { Metadata } from "next";
import Link from "next/link";

import { ProviderCard } from "@/components/provider-card";
import { SearchBar } from "@/components/search-bar";
import { SearchFilters } from "@/components/search-filters";
import { ShortlistPanel } from "@/components/shortlist-panel";
import { SHORTLIST_MAX } from "@/lib/domain";
import {
  getCities,
  getFacets,
  getServices,
  searchProviders,
  type SearchFilters as Filters,
} from "@/lib/queries";
import { searchParamsSchema } from "@/lib/validation";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const [cities, services] = await Promise.all([getCities(), getServices()]);

  const city = cities.find((entry) => entry.slug === firstValue(params.city));
  const service = services.find((entry) => entry.slug === firstValue(params.service));

  const title = service && city
    ? `${service.name} in ${city.name}`
    : service
      ? `${service.name} providers`
      : city
        ? `Aged care providers in ${city.name}`
        : "Search aged care providers";

  return {
    title,
    description: `Compare verified aged-care providers${city ? ` in ${city.name}` : ""}${service ? ` offering ${service.name.toLowerCase()}` : ""}, and send a structured care request.`,
    alternates: { canonical: `/search` },
  };
}

export default async function SearchPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const parsed = searchParamsSchema.safeParse({
    city: firstValue(raw.city),
    service: firstValue(raw.service),
    area: firstValue(raw.area),
    language: firstValue(raw.language),
    verified: firstValue(raw.verified) ?? "any",
    tier: firstValue(raw.tier) ?? "any",
    sort: firstValue(raw.sort) ?? "recommended",
    page: firstValue(raw.page) ?? 1,
  });

  const filters: Filters = parsed.success ? parsed.data : {};

  const [cities, services, facets, result] = await Promise.all([
    getCities(),
    getServices(),
    getFacets(filters.city),
    searchProviders(filters),
  ]);

  const city = cities.find((entry) => entry.slug === filters.city);
  const service = services.find((entry) => entry.slug === filters.service);

  const heading = service && city
    ? `${service.name} in ${city.name}`
    : service
      ? service.name
      : city
        ? `Aged care in ${city.name}`
        : "All providers";

  /* The sidebar offers whoever is currently at the top of the results — the
     same listings the family is reading, in the same order. */
  const shortlist = result.providers.slice(0, SHORTLIST_MAX).map((provider) => ({
    id: provider.id,
    name: provider.name,
  }));

  /* Its care-type choices come from what the listings on this page actually
     offer, commonest first — offering "Palliative Care" when nobody on screen
     provides it wastes the one question the short form gets to ask. */
  const offered = new Map<string, { id: string; name: string; count: number }>();
  for (const provider of result.providers) {
    for (const entry of provider.services) {
      const seen = offered.get(entry.id);
      if (seen) seen.count += 1;
      else offered.set(entry.id, { id: entry.id, name: entry.name, count: 1 });
    }
  }
  const panelServices = [...offered.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 6);

  return (
    <div className="bg-ground-deep">
      {/* The search bar keeps its own white band across the full width, so it
          reads as part of the site chrome rather than as the first result. */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-4">
          <SearchBar
            cities={cities}
            services={services}
            defaultCity={filters.city}
            defaultService={filters.service}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-5 py-6">
        <nav aria-label="Breadcrumb" className="text-sm text-ink-faint">
          <Link href="/" className="hover:text-brand-600">
            Home
          </Link>
          {city && (
            <>
              {" / "}
              <Link href={`/search?city=${city.slug}`} className="hover:text-brand-600">
                {city.name}
              </Link>
            </>
          )}
          {service && (
            <>
              {" / "}
              <span className="text-ink-soft">{service.name}</span>
            </>
          )}
        </nav>

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="text-2xl font-bold sm:text-[1.75rem]">{heading}</h1>
          <p className="text-sm text-ink-faint">
            {result.total} provider{result.total === 1 ? "" : "s"} listed
          </p>
        </div>

        {/* Filters run across the top rather than down a rail, so the listings
            keep the width their call and WhatsApp buttons need. */}
        <div className="mt-4 overflow-x-auto pb-1">
          <SearchFilters facets={facets} filters={filters} />
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_21rem] lg:items-start">
          <div>
            {result.providers.length === 0 ? (
              <div className="rounded-card border border-dashed border-line-strong bg-surface p-10 text-center">
                <p className="text-ink-soft">No providers match these filters yet.</p>
                <p className="mt-2 text-sm text-ink-faint">
                  Try removing a filter, or{" "}
                  <Link href="/search" className="font-medium text-brand-600 hover:underline">
                    browse every city
                  </Link>
                  .
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {result.providers.map((provider) => (
                  <li key={provider.id}>
                    <ProviderCard provider={provider} />
                  </li>
                ))}
              </ul>
            )}

            {result.pageCount > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                {Array.from({ length: result.pageCount }, (_, index) => index + 1).map((pageNumber) => {
                  const params = new URLSearchParams();
                  for (const [key, value] of Object.entries(filters)) {
                    if (value && key !== "page" && value !== "any") params.set(key, String(value));
                  }
                  params.set("page", String(pageNumber));

                  const current = pageNumber === result.page;
                  return (
                    <Link
                      key={pageNumber}
                      href={`/search?${params.toString()}`}
                      aria-current={current ? "page" : undefined}
                      className={`rounded-card border px-3.5 py-1.5 text-sm font-medium ${
                        current
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-line-strong bg-surface text-ink-soft hover:border-brand-400 hover:text-brand-600"
                      }`}
                    >
                      {pageNumber}
                    </Link>
                  );
                })}
              </nav>
            )}

            <p className="mt-8 border-t border-line pt-4 text-xs text-ink-faint">
              Listing tier affects where a provider appears in these results. It is not a
              measure of care quality or verification.
            </p>
          </div>

          {/* Below the listings on a phone: a lead form above the results a
              family came for is the pattern that makes directories hated. */}
          <ShortlistPanel
            providers={shortlist}
            cityName={city?.name ?? ""}
            services={panelServices.length > 0 ? panelServices : services}
            defaultServiceId={service?.id}
          />
        </div>
      </div>
    </div>
  );
}
