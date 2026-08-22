"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { BadgeCheck, Filter } from "@/components/icons";
import { SORT_LABEL, SORT_OPTIONS } from "@/lib/domain";
import type { SearchFilters as Filters } from "@/lib/queries";

/**
 * The filter row.
 *
 * This used to be a 16rem left rail. On a directory that rail is expensive —
 * it takes the width the listings need to fit a phone number, a WhatsApp
 * button and an address on one line — and it was carrying four controls that
 * fit comfortably in a single row above the results. Each control renders as
 * the chip it produces, and lights up when it is doing something, so the
 * active filter set is readable without opening anything.
 */
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
    router.push(`/search?${params.toString()}`, { scroll: false });
  }

  const verifiedOnly = filters.verified === "verified";

  const hasFilters =
    Boolean(filters.area) ||
    Boolean(filters.language) ||
    verifiedOnly ||
    (filters.tier && filters.tier !== "any") ||
    (filters.sort && filters.sort !== "recommended");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-2 pe-1 text-sm text-ink-faint">
        <Filter className="size-4" />
        <span className="sr-only sm:not-sr-only">Filter</span>
      </span>

      <label className="contents">
        <span className="sr-only">Sort results</span>
        <select
          value={filters.sort ?? "recommended"}
          onChange={(event) => update("sort", event.target.value)}
          data-active={(filters.sort ?? "recommended") !== "recommended"}
          className="filter-pill"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              Sort: {SORT_LABEL[option]}
            </option>
          ))}
        </select>
      </label>

      {/* Verification is a button rather than a fifth dropdown: it is the
          filter families reach for first, and an on/off control reads at a
          glance where another identical <select> disappears into the row. */}
      <button
        type="button"
        aria-pressed={verifiedOnly}
        onClick={() => update("verified", verifiedOnly ? "any" : "verified")}
        data-active={verifiedOnly}
        className="filter-pill"
      >
        <BadgeCheck className="size-4" />
        Verified only
      </button>

      {facets.areas.length > 0 && (
        <label className="contents">
          <span className="sr-only">Area</span>
          <select
            value={filters.area ?? ""}
            onChange={(event) => update("area", event.target.value)}
            data-active={Boolean(filters.area)}
            className="filter-pill"
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
        <label className="contents">
          <span className="sr-only">Language spoken</span>
          <select
            value={filters.language ?? ""}
            onChange={(event) => update("language", event.target.value)}
            data-active={Boolean(filters.language)}
            className="filter-pill"
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

      <label className="contents">
        <span className="sr-only">Listing tier</span>
        <select
          value={filters.tier ?? "any"}
          onChange={(event) => update("tier", event.target.value)}
          data-active={Boolean(filters.tier && filters.tier !== "any")}
          className="filter-pill"
        >
          <option value="any">All listings</option>
          <option value="premium">Premium</option>
          <option value="standard">Standard</option>
        </select>
      </label>

      {hasFilters && (
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams();
            if (filters.city) params.set("city", filters.city);
            if (filters.service) params.set("service", filters.service);
            router.push(`/search?${params.toString()}`, { scroll: false });
          }}
          className="ms-1 text-sm text-brand-700 underline underline-offset-2"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
