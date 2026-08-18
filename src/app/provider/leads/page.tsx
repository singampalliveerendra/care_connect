import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { MOBILITY_LABEL, PRICING_BAND_LABEL, URGENCY_LABEL } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import type { Enquiry, LeadDelivery } from "@/lib/database.types";

export const metadata: Metadata = { title: "Care requests", robots: { index: false } };

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function ProviderLeadsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/provider/login");

  const { data: provider } = await supabase
    .from("providers")
    .select("id, name")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (!provider) redirect("/provider/register");

  const { data: enquiryRows } = await supabase
    .from("enquiries")
    .select("*, service:services(name), city:cities(name)")
    .eq("provider_id", provider.id)
    .order("created_at", { ascending: false });

  const enquiries = (enquiryRows ?? []) as unknown as (Enquiry & {
    service: { name: string } | null;
    city: { name: string } | null;
  })[];

  const { data: deliveryRows } = await supabase
    .from("lead_deliveries")
    .select("*")
    .eq("provider_id", provider.id);

  const deliveries = (deliveryRows ?? []) as LeadDelivery[];
  const deliveriesByEnquiry = new Map<string, LeadDelivery[]>();
  for (const delivery of deliveries) {
    const list = deliveriesByEnquiry.get(delivery.enquiry_id) ?? [];
    list.push(delivery);
    deliveriesByEnquiry.set(delivery.enquiry_id, list);
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <nav className="text-sm text-ink-faint">
        <Link href="/provider/dashboard" className="hover:text-brand-700">
          Dashboard
        </Link>
      </nav>

      <h1 className="mt-3 text-3xl">Care requests</h1>
      <p className="mt-2 text-ink-soft">
        Families who have asked {provider.name} for help. Call them on the number shown.
      </p>

      {enquiries.length === 0 ? (
        <div className="mt-10 rounded-card border border-dashed border-line bg-surface p-10 text-center">
          <p className="text-ink-soft">No care requests yet.</p>
          <p className="mt-2 text-sm text-ink-faint">
            Requests appear here the moment a family sends one.
          </p>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {enquiries.map((enquiry) => {
            const facts = [
              enquiry.recipient_age && { label: "Age", value: `${enquiry.recipient_age}` },
              enquiry.area && { label: "Area", value: enquiry.area },
              enquiry.mobility && {
                label: "Mobility",
                value: MOBILITY_LABEL[enquiry.mobility],
              },
              enquiry.hours_required && { label: "Hours", value: enquiry.hours_required },
              enquiry.start_date && { label: "Start", value: formatDate(enquiry.start_date) },
              enquiry.duration && { label: "Duration", value: enquiry.duration },
              enquiry.urgency && { label: "Urgency", value: URGENCY_LABEL[enquiry.urgency] },
              enquiry.preferred_language && {
                label: "Language",
                value: enquiry.preferred_language,
              },
              enquiry.preferred_caregiver_sex && {
                label: "Caregiver",
                value: enquiry.preferred_caregiver_sex,
              },
              enquiry.budget_band && {
                label: "Budget",
                value: PRICING_BAND_LABEL[enquiry.budget_band],
              },
            ].filter(Boolean) as { label: string; value: string }[];

            const enquiryDeliveries = deliveriesByEnquiry.get(enquiry.id) ?? [];

            return (
              <li key={enquiry.id} className="rounded-card border border-line bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg">{enquiry.family_name}</h2>
                    <p className="mt-1 text-sm text-ink-faint">
                      {enquiry.service?.name ?? "Service not specified"}
                      {enquiry.city?.name && <> &middot; {enquiry.city.name}</>}
                      {" · "}
                      {formatDate(enquiry.created_at)}
                    </p>
                  </div>
                  <a
                    href={`tel:${enquiry.phone.replace(/\s/g, "")}`}
                    className="rounded-card bg-brand-600 px-4 py-2 text-sm font-medium text-white"
                  >
                    Call {enquiry.phone}
                  </a>
                </div>

                <p className="mt-4 whitespace-pre-line text-ink-soft">
                  {enquiry.care_requirement}
                </p>

                {enquiry.additional_message && (
                  <p className="mt-3 border-l-2 border-line-soft pl-3 text-sm text-ink-soft">
                    {enquiry.additional_message}
                  </p>
                )}

                {facts.length > 0 && (
                  <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line-soft pt-4 text-sm">
                    {facts.map((fact) => (
                      <div key={fact.label} className="flex gap-2">
                        <dt className="text-ink-faint">{fact.label}</dt>
                        <dd>{fact.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-faint">
                  {enquiry.email && <span>{enquiry.email}</span>}
                  {enquiryDeliveries.map((delivery) => (
                    <span key={delivery.id}>
                      {delivery.channel}: {delivery.status}
                    </span>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
