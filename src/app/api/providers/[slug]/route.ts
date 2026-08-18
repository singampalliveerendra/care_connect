import { NextResponse } from "next/server";

import { getProviderBySlug } from "@/lib/queries";

/** GET /api/providers/[slug] — public provider profile (brief §19). */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);

  if (!provider) {
    return NextResponse.json({ error: "Provider not found." }, { status: 404 });
  }

  return NextResponse.json({
    provider: {
      id: provider.id,
      name: provider.name,
      slug: provider.slug,
      description: provider.description,
      city: provider.city,
      areasCovered: provider.areas_covered,
      languages: provider.languages,
      phone: provider.phone,
      email: provider.email,
      website: provider.website,
      address: provider.address_is_public ? provider.address : null,
      pricingBand: provider.pricing_band,
      establishedYear: provider.established_year,
      staffSize: provider.staff_size,
      verification: provider.verification,
      tier: provider.tier,
      services: provider.services,
    },
  });
}
