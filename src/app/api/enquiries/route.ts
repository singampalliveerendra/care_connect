import { NextResponse } from "next/server";

import type { Tier } from "@/lib/domain";
import { deliverLead } from "@/lib/lead-delivery";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { createPublicClient } from "@/lib/supabase/server";
import { enquirySchema } from "@/lib/validation";

/** POST /api/enquiries — create a structured family enquiry (brief §19). */
export async function POST(request: Request) {
  const limit = rateLimit(`enquiry:${clientIp(request)}`, { limit: 5, windowMs: 60_000 });
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

  // Honeypot: a filled hidden field means a bot. Answer as if it worked, and
  // check it before validation so the response reveals nothing about the trap.
  if (typeof body === "object" && body !== null && "website" in body && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  const parsed = enquirySchema.safeParse(body);
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

  // RLS also enforces this, but failing here gives a clearer message.
  const { data: providerRow, error: providerError } = await supabase
    .from("providers")
    .select("id, name, email, phone, tier, city:cities!inner(name,is_active)")
    .eq("id", input.providerId)
    .eq("status", "approved")
    .eq("city.is_active", true)
    .maybeSingle();

  const provider = providerRow as unknown as {
    id: string;
    name: string;
    email: string;
    phone: string;
    tier: Tier;
    city: { name: string };
  } | null;

  if (providerError || !provider) {
    return NextResponse.json(
      { error: "This provider is not accepting requests right now." },
      { status: 404 },
    );
  }

  // The id is generated here rather than returned by the insert: enquiries are
  // deliberately unreadable by anonymous users (brief §16), so `INSERT ... RETURNING`
  // would fail the SELECT policy even though the insert itself is allowed.
  const enquiryId = crypto.randomUUID();

  const { error: insertError } = await supabase
    .from("enquiries")
    .insert({
      id: enquiryId,
      provider_id: input.providerId,
      service_id: input.serviceId,
      city_id: input.cityId,
      family_name: input.familyName,
      phone: input.phone,
      email: input.email ?? null,
      recipient_age: input.recipientAge ?? null,
      recipient_gender: input.recipientGender ?? null,
      area: input.area ?? null,
      care_requirement: input.careRequirement,
      mobility: input.mobility ?? null,
      hours_required: input.hoursRequired ?? null,
      start_date: input.startDate ?? null,
      duration: input.duration ?? null,
      preferred_language: input.preferredLanguage ?? null,
      preferred_caregiver_sex: input.preferredCaregiverSex ?? null,
      budget_band: input.budgetBand ?? null,
      urgency: input.urgency ?? null,
      additional_message: input.additionalMessage ?? null,
      source: "web",
    });

  if (insertError) {
    console.error("[enquiries] insert failed", insertError);
    return NextResponse.json(
      { error: "We couldn't save your request. Please try again." },
      { status: 500 },
    );
  }

  const { data: service } = await supabase
    .from("services")
    .select("name")
    .eq("id", input.serviceId)
    .maybeSingle();

  // Delivery never blocks the response: the enquiry is already stored, and the
  // provider can always see it in their dashboard.
  const attempts = await deliverLead(supabase, {
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

  return NextResponse.json(
    { ok: true, enquiryId, delivery: attempts.map((a) => a.channel) },
    { status: 201 },
  );
}
