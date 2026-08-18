import { NextResponse } from "next/server";

import { getCities, getCityProviderCounts } from "@/lib/queries";

/** GET /api/cities — active cities with provider counts (brief §19). */
export async function GET() {
  const [cities, counts] = await Promise.all([getCities(), getCityProviderCounts()]);

  return NextResponse.json({
    cities: cities.map((city) => ({
      id: city.id,
      name: city.name,
      slug: city.slug,
      state: city.state,
      wave: city.wave,
      providerCount: counts[city.slug] ?? 0,
    })),
  });
}
