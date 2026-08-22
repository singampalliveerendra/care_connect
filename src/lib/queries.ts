import { cache } from "react";

import type { SortOption } from "@/lib/domain";
import { createPublicClient } from "@/lib/supabase/server";
import type { City, Provider, Service, ServiceCategory } from "@/lib/database.types";

export const PAGE_SIZE = 12;

export type ProviderWithRelations = Provider & {
  city: Pick<City, "id" | "name" | "slug" | "state">;
  services: Pick<Service, "id" | "name" | "slug">[];
};

/** Active cities only — RLS enforces this too, the filter is for clarity. */
export const getCities = cache(async (): Promise<City[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("is_active", true)
    .order("wave")
    .order("name");

  if (error) throw new Error(`Could not load cities: ${error.message}`);
  return data ?? [];
});

export const getCityBySlug = cache(async (slug: string): Promise<City | null> => {
  const cities = await getCities();
  return cities.find((city) => city.slug === slug) ?? null;
});

export type CategoryWithServices = ServiceCategory & { services: Service[] };

export const getServiceCatalogue = cache(async (): Promise<CategoryWithServices[]> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("service_categories")
    .select("*, services(*)")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(`Could not load services: ${error.message}`);

  return (data ?? []).map((category) => ({
    ...(category as ServiceCategory),
    services: ((category as unknown as { services: Service[] }).services ?? [])
      .filter((service) => service.is_active)
      .sort((a, b) => a.sort_order - b.sort_order),
  }));
});

export const getServices = cache(async (): Promise<Service[]> => {
  const catalogue = await getServiceCatalogue();
  return catalogue.flatMap((category) => category.services);
});

export type SearchFilters = {
  city?: string;
  service?: string;
  area?: string;
  language?: string;
  verified?: "any" | "verified";
  tier?: "any" | "standard" | "premium";
  sort?: SortOption;
  page?: number;
};

export type SearchResult = {
  providers: ProviderWithRelations[];
  total: number;
  page: number;
  pageCount: number;
};

const PROVIDER_SELECT =
  "*, city:cities!inner(id,name,slug,state,is_active), provider_services!inner(service:services!inner(id,name,slug))";

function shapeProvider(row: Record<string, unknown>): ProviderWithRelations {
  const links = (row.provider_services ?? []) as { service: Service }[];
  const seen = new Set<string>();
  const services = links
    .map((link) => link.service)
    .filter((service) => service && !seen.has(service.id) && seen.add(service.id));

  return { ...(row as unknown as Provider), city: row.city as ProviderWithRelations["city"], services };
}

/**
 * Public provider search. Ordering implements brief §12: Premium first,
 * then Standard, then Free — with stronger verification breaking ties.
 */
export async function searchProviders(filters: SearchFilters): Promise<SearchResult> {
  const supabase = createPublicClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;

  let query = supabase
    .from("providers")
    .select(PROVIDER_SELECT, { count: "exact" })
    .eq("status", "approved")
    .eq("city.is_active", true);

  if (filters.city) query = query.eq("city.slug", filters.city);
  if (filters.service) query = query.eq("provider_services.service.slug", filters.service);
  if (filters.area) query = query.contains("areas_covered", [filters.area]);
  if (filters.language) query = query.contains("languages", [filters.language]);
  if (filters.verified === "verified") query = query.neq("verification", "unverified");
  if (filters.tier && filters.tier !== "any") query = query.eq("tier", filters.tier);

  /* Postgres orders an enum by its declared order, and both `listing_tier` and
     `verification_status` are declared weakest-first — hence descending for
     "strongest first". */
  if (filters.sort === "name") {
    query = query.order("name");
  } else if (filters.sort === "verified") {
    query = query
      .order("verification", { ascending: false })
      .order("tier", { ascending: false })
      .order("name");
  } else {
    query = query
      .order("tier", { ascending: false })
      .order("verification", { ascending: false })
      .order("name");
  }

  const { data, error, count } = await query.range(from, from + PAGE_SIZE - 1);

  if (error) throw new Error(`Search failed: ${error.message}`);

  const total = count ?? 0;
  return {
    providers: (data ?? []).map((row) => shapeProvider(row as Record<string, unknown>)),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export const getProviderBySlug = cache(
  async (slug: string): Promise<ProviderWithRelations | null> => {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("providers")
      .select(PROVIDER_SELECT)
      .eq("slug", slug)
      .eq("status", "approved")
      .eq("city.is_active", true)
      .maybeSingle();

    if (error) throw new Error(`Could not load provider: ${error.message}`);
    return data ? shapeProvider(data as Record<string, unknown>) : null;
  },
);

/** Every approved provider slug — used by the sitemap. */
export async function getIndexableProviderSlugs(): Promise<
  { slug: string; updated_at: string }[]
> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("providers")
    .select("slug, updated_at, city:cities!inner(is_active)")
    .eq("status", "approved")
    .eq("city.is_active", true);

  if (error) return [];
  return (data ?? []) as { slug: string; updated_at: string }[];
}

/** Filter options drawn from the providers actually visible in a city. */
export async function getFacets(citySlug?: string) {
  const supabase = createPublicClient();
  let query = supabase
    .from("providers")
    .select("areas_covered, languages, city:cities!inner(slug,is_active)")
    .eq("status", "approved")
    .eq("city.is_active", true);

  if (citySlug) query = query.eq("city.slug", citySlug);

  const { data } = await query;
  const rows = (data ?? []) as unknown as {
    areas_covered: string[] | null;
    languages: string[] | null;
  }[];

  const areas = new Set<string>();
  const languages = new Set<string>();

  for (const row of rows) {
    for (const area of row.areas_covered ?? []) areas.add(area);
    for (const language of row.languages ?? []) languages.add(language);
  }

  return {
    areas: [...areas].sort(),
    languages: [...languages].sort(),
  };
}

export async function getCityProviderCounts(): Promise<Record<string, number>> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("providers")
    .select("city:cities!inner(slug,is_active)")
    .eq("status", "approved")
    .eq("city.is_active", true);

  const rows = (data ?? []) as unknown as { city: { slug: string } }[];

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.city.slug] = (counts[row.city.slug] ?? 0) + 1;
  }
  return counts;
}
