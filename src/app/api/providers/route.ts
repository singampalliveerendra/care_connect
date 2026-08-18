import { NextResponse } from "next/server";

import { searchProviders } from "@/lib/queries";
import { searchParamsSchema } from "@/lib/validation";

/** GET /api/providers — search, filter, paginate (brief §19). */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const parsed = searchParamsSchema.safeParse({
    city: searchParams.get("city") ?? undefined,
    service: searchParams.get("service") ?? undefined,
    area: searchParams.get("area") ?? undefined,
    language: searchParams.get("language") ?? undefined,
    verified: searchParams.get("verified") ?? "any",
    tier: searchParams.get("tier") ?? "any",
    page: searchParams.get("page") ?? 1,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid search parameters." }, { status: 422 });
  }

  const result = await searchProviders(parsed.data);

  return NextResponse.json({
    providers: result.providers.map((provider) => ({
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      description: provider.description,
      city: provider.city,
      areasCovered: provider.areas_covered,
      languages: provider.languages,
      pricingBand: provider.pricing_band,
      establishedYear: provider.established_year,
      verification: provider.verification,
      tier: provider.tier,
      services: provider.services,
    })),
    pagination: {
      page: result.page,
      pageCount: result.pageCount,
      total: result.total,
    },
  });
}
