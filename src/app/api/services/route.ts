import { NextResponse } from "next/server";

import { getServiceCatalogue } from "@/lib/queries";

/** GET /api/services — active service and category lookup (brief §19). */
export async function GET() {
  const catalogue = await getServiceCatalogue();

  return NextResponse.json({
    categories: catalogue.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      services: category.services.map((service) => ({
        id: service.id,
        name: service.name,
        slug: service.slug,
        description: service.description,
      })),
    })),
  });
}
