import type { Metadata } from "next";
import Link from "next/link";

import { ProviderCard } from "@/components/provider-card";
import { SearchBar } from "@/components/search-bar";
import { SearchFilters } from "@/components/search-filters";
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
      ? `${service.name} providers across India`
      : city
        ? `Aged care providers in ${city.name}`
        : "Search aged care providers";

  return {
    title,
    description: `Compare verified aged-care providers${city ? ` in ${city.name}` : " across India"}${service ? ` offering ${service.name.toLowerCase()}` : ""}, and send a structured care request.`,
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

  return (
    <div className="mx-auto max-w-6xl px-5 py-10">
      <SearchBar
        cities={cities}
        services={services}
        defaultCity={filters.city}
        defaultService={filters.service}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_1fr]">
        <SearchFilters facets={facets} filters={filters} />

        <div>
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h1 className="text-2xl">{heading}</h1>
            <p className="text-sm text-ink-faint">
              {result.total} provider{result.total === 1 ? "" : "s"}
            </p>
          </div>

          {result.providers.length === 0 ? (
            <div className="mt-8 rounded-card border border-dashed border-line bg-surface p-10 text-center">
              <p className="text-ink-soft">
                No providers match these filters yet.
              </p>
              <p className="mt-2 text-sm text-ink-faint">
                Try removing a filter, or{" "}
                <Link href="/search" className="text-brand-700 underline underline-offset-2">
                  browse every city
                </Link>
                .
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
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
                    className={`rounded-card px-3 py-1.5 text-sm ${
                      current
                        ? "bg-brand-600 text-white"
                        : "border border-line bg-surface text-ink-soft hover:border-brand-100"
                    }`}
                  >
                    {pageNumber}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
