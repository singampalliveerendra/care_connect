"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId } from "react";

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
  const verifiedLabelId = useId();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "any") params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/search?${params.toString()}`);
  }

  const verifiedOnly = filters.verified === "verified";

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

      {/* Verification gets a switch rather than another dropdown. It is the
          filter families reach for first, and a switch reads as on/off at a
          glance where a fourth identical <select> disappears into the stack.
          role="switch" keeps it a single announced control. */}
      <div className="rounded-card border border-brand-100 bg-brand-50 p-3">
        <div className="flex items-start justify-between gap-3">
          <span className="min-w-0">
            <span id={verifiedLabelId} className="block text-sm font-medium text-ink">
              Verified only
            </span>
            <span className="mt-0.5 block text-xs text-ink-soft">
              Providers CareConnect has checked.
            </span>
          </span>

          <button
            type="button"
            role="switch"
            aria-checked={verifiedOnly}
            aria-labelledby={verifiedLabelId}
            onClick={() => update("verified", verifiedOnly ? "any" : "verified")}
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors ${
              verifiedOnly
                ? "border-brand-600 bg-brand-600"
                : "border-line-strong bg-surface-sunk"
            }`}
          >
            <span
              aria-hidden="true"
              className={`absolute top-0.5 size-4.5 rounded-full bg-white shadow-soft transition-[left] duration-200 ${
                verifiedOnly ? "left-[1.375rem]" : "left-0.5"
              }`}
            />
          </button>
        </div>
      </div>

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
