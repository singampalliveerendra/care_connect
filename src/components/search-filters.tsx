"use client";

import { useRouter, useSearchParams } from "next/navigation";

import type { SearchFilters as Filters } from "@/lib/queries";

export function SearchFilters({
  facets,
  filters,
}: {
  facets: { areas: string[]; languages: string[] };
  filters: Filters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "any") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  }

  const hasFilters =
    Boolean(filters.area) ||
    Boolean(filters.language) ||
    filters.verified === "verified" ||
    (filters.tier && filters.tier !== "any");

  return (
    <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-faint">
          Filters
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams();
              if (filters.city) params.set("city", filters.city);
              if (filters.service) params.set("service", filters.service);
              router.push(`/search?${params.toString()}`);
            }}
            className="text-xs text-brand-700 underline underline-offset-2"
          >
            Clear all
          </button>
        )}
      </div>

      {facets.areas.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Area</span>
          <select
            value={filters.area ?? ""}
            onChange={(event) => update("area", event.target.value)}
            className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">Any area</option>
            {facets.areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
      )}

      {facets.languages.length > 0 && (
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Language</span>
          <select
            value={filters.language ?? ""}
            onChange={(event) => update("language", event.target.value)}
            className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm"
          >
            <option value="">Any language</option>
            {facets.languages.map((language) => (
              <option key={language} value={language}>
                {language}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Verification</span>
        <select
          value={filters.verified ?? "any"}
          onChange={(event) => update("verified", event.target.value)}
          className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="any">All providers</option>
          <option value="verified">Verified only</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1.5 block text-sm font-medium">Listing</span>
        <select
          value={filters.tier ?? "any"}
          onChange={(event) => update("tier", event.target.value)}
          className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm"
        >
          <option value="any">All listings</option>
          <option value="premium">Premium</option>
          <option value="standard">Standard</option>
        </select>
      </label>

      <p className="border-t border-line-soft pt-4 text-xs text-ink-faint">
        Listing tier affects where a provider appears in results. It is not a measure
        of care quality or verification.
      </p>
    </aside>
  );
}
