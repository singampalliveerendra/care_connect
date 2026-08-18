import type { MetadataRoute } from "next";

import { getCities, getIndexableProviderSlugs, getServices } from "@/lib/queries";

const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [cities, services, providers] = await Promise.all([
    getCities(),
    getServices(),
    getIndexableProviderSlugs(),
  ]);

  const staticPages = ["", "/search", "/nri", "/how-it-works", "/about", "/contact", "/privacy", "/terms"];

  const cityPages = cities.map((city) => `/search?city=${city.slug}`);

  /** City x service landing pages — the SEO engine described in brief §14. */
  const cityServicePages = cities.flatMap((city) =>
    services.map((service) => `/search?city=${city.slug}&service=${service.slug}`),
  );

  return [
    ...staticPages.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...cityPages.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...cityServicePages.map((path) => ({
      url: `${base}${path}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    // Only approved providers in active cities are indexable (brief §14).
    ...providers.map((provider) => ({
      url: `${base}/providers/${provider.slug}`,
      lastModified: provider.updated_at,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
