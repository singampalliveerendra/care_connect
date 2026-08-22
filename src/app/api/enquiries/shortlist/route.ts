import { NextResponse } from "next/server";

import { SHORTLIST_MAX, type Tier } from "@/lib/domain";
import { deliverLead } from "@/lib/lead-delivery";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createPublicClient } from "@/lib/supabase/server";
import { shortlistEnquirySchema } from "@/lib/validation";

/**
 * POST /api/enquiries/shortlist — one care request, delivered to the few
 * providers a family is already looking at.
 *
 * Every provider gets their own row in `enquiries`, exactly as if the family
 * had filled the full form three times: same RLS, same dashboard inbox, same
 * lead-delivery record. Nothing downstream needs to learn about shortlists,
 * and a provider cannot tell — or see — who else received it.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`shortlist:${clientIp(request)}`, { limit: 3, windowMs: 60_000 });
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body === "object" &&
    body !== null &&
    "website" in body &&
    (body as { website?: unknown }).website
  ) {
    return NextResponse.json({ ok: true, sent: 0 }, { status: 201 });
  }

  const parsed = shortlistEnquirySchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json(
      { error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const supabase = createPublicClient();

  // The ids arrive from the page the family was looking at, so they are
  // re-checked here rather than trusted: a listing may have been suspended, or
  // the payload hand-edited to reach a provider that is not publicly visible.
  const { data: providerRows } = await supabase
    .from("providers")
    .select("id, name, email, phone, tier, city_id, city:cities!inner(name,is_active)")
    .in("id", input.providerIds.slice(0, SHORTLIST_MAX))
    .eq("status", "approved")
    .eq("city.is_active", true);

  const providers = (providerRows ?? []) as unknown as {
    id: string;
    name: string;
    email: string;
    phone: string;
    tier: Tier;
    city_id: string;
    city: { name: string };
  }[];

  if (providers.length === 0) {
    return NextResponse.json(
      { error: "These providers are not accepting requests right now." },
      { status: 404 },
    );
  }

  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("id", input.serviceId)
    .maybeSingle();

  const sent: string[] = [];

  for (const provider of providers) {
    // Ids are generated here for the same reason as in the single-provider
    // route: anonymous users may insert an enquiry but never read one back.
    const enquiryId = crypto.randomUUID();

    const { error: insertError } = await supabase.from("enquiries").insert({
      id: enquiryId,
      provider_id: provider.id,
      service_id: input.serviceId,
      // The provider's own city, not the one in the payload — a listing is only
      // ever contactable about the city it operates in.
      city_id: provider.city_id,
      family_name: input.familyName,
      phone: input.phone,
      email: input.email ?? null,
      care_requirement: input.careRequirement,
      source: "web:shortlist",
    });

    if (insertError) {
      // One provider failing must not lose the requests that did land.
      console.error("[shortlist] insert failed", provider.id, insertError);
      continue;
    }

    await deliverLead(supabase, {
      enquiryId,
      providerId: provider.id,
      providerName: provider.name,
      providerEmail: provider.email,
      providerPhone: provider.phone,
      providerTier: provider.tier,
      familyName: input.familyName,
      familyPhone: input.phone,
      cityName: provider.city?.name ?? "",
      serviceName: service?.name ?? "",
      careRequirement: input.careRequirement,
    });

    sent.push(provider.name);
  }

  if (sent.length === 0) {
    return NextResponse.json(
      { error: "We couldn't save your request. Please try again." },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, sent: sent.length, providers: sent }, { status: 201 });
}
