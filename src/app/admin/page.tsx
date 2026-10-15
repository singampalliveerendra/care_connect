import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/provider/actions";
import { AdminReviewActions } from "@/components/admin-review-actions";
import type { Provider, ProviderApplication, ProviderStatus } from "@/lib/database.types";
import { PRICING_BAND_LABEL } from "@/lib/domain";
import { mapsSearchUrl } from "@/lib/location";
import { isAdmin } from "@/lib/profiles";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin — listings", robots: { index: false } };

const FILTERS = ["pending", "approved", "rejected", "suspended", "all"] as const;
type Filter = (typeof FILTERS)[number];

const STATUS_TONE: Record<ProviderStatus, string> = {
  draft: "bg-surface-alt text-ink-soft",
  pending: "bg-accent-100 text-ink-soft",
  approved: "bg-brand-50 text-brand-700",
  rejected: "bg-danger-100 text-danger-500",
  suspended: "bg-danger-100 text-danger-500",
};

type Row = Provider & {
  city: { name: string } | null;
  provider_services: { service: { name: string } | null }[];
  provider_applications: Pick<ProviderApplication, "status" | "notes" | "reviewed_at" | "created_at">[];
};

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Kolkata",
});

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  if (!(await isAdmin(supabase, user.id))) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-3xl">Not an admin account</h1>
        <p className="mt-3 text-ink-soft">
          You&rsquo;re signed in as {user.email}, which can&rsquo;t review listings. Sign out and
          sign in with the admin account.
        </p>
        <form action={signOut} className="mt-6">
          <button className="rounded-card border border-line px-4 py-2 text-sm text-ink-soft">
            Sign out
          </button>
        </form>
      </div>
    );
  }

  const { status: rawStatus } = await searchParams;
  const filter: Filter = FILTERS.includes(rawStatus as Filter) ? (rawStatus as Filter) : "pending";

  const [{ data: statuses }, listing] = await Promise.all([
    supabase.from("providers").select("status"),
    (() => {
      let query = supabase
        .from("providers")
        .select(
          "*, city:cities(name), provider_services(service:services(name)), provider_applications(status, notes, reviewed_at, created_at)",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (filter !== "all") query = query.eq("status", filter);
      return query;
    })(),
  ]);

  const counts: Record<string, number> = { all: statuses?.length ?? 0 };
  for (const row of statuses ?? []) counts[row.status] = (counts[row.status] ?? 0) + 1;
  const rows = (listing.data ?? []) as unknown as Row[];

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">Listings</h1>
          <p className="mt-1 text-ink-faint">Admin · signed in as {user.email}</p>
        </div>
        <form action={signOut}>
          <button className="rounded-card border border-line px-4 py-2 text-sm text-ink-soft">
            Sign out
          </button>
        </form>
      </div>

      <nav className="mt-8 flex flex-wrap gap-2 text-sm" aria-label="Filter by status">
        {FILTERS.map((option) => (
          <Link
            key={option}
            href={option === "pending" ? "/admin" : `/admin?status=${option}`}
            aria-current={option === filter ? "page" : undefined}
            className={`rounded-full border px-3 py-1.5 capitalize ${
              option === filter ? "border-brand-600 bg-brand-50 text-brand-700" : "border-line text-ink-soft"
            }`}
          >
            {option} <span className="text-ink-faint">({counts[option] ?? 0})</span>
          </Link>
        ))}
      </nav>

      {listing.error && (
        <p role="alert" className="mt-6 rounded-card bg-danger-100 px-4 py-3 text-sm text-danger-500">
          Couldn&rsquo;t load listings. Refresh to try again.
        </p>
      )}

      {!listing.error && rows.length === 0 && (
        <p className="mt-10 text-ink-soft">
          {filter === "pending" ? "Nothing waiting for review." : `No ${filter === "all" ? "" : filter + " "}listings.`}
        </p>
      )}

      <ul className="mt-6 space-y-5">
        {rows.map((provider) => {
          const application = provider.provider_applications[0];
          const services = provider.provider_services.map((link) => link.service?.name).filter(Boolean);
          const pin =
            provider.latitude != null && provider.longitude != null
              ? { latitude: Number(provider.latitude), longitude: Number(provider.longitude) }
              : null;

          return (
            <li key={provider.id} className="rounded-card border border-line bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl">{provider.name}</h2>
                  <p className="mt-0.5 text-sm text-ink-faint">
                    {provider.city?.name ?? "Unknown city"} · submitted{" "}
                    {dateFormat.format(new Date(provider.created_at))}
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_TONE[provider.status]}`}>
                  {provider.status}
                </span>
              </div>

              {provider.description && <p className="mt-3 text-ink-soft">{provider.description}</p>}

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Detail label="Services">{services.length ? services.join(", ") : "None selected"}</Detail>
                <Detail label="Areas">{provider.areas_covered.join(", ") || "—"}</Detail>
                <Detail label="Phone">
                  <a href={`tel:${provider.phone}`} className="text-brand-700 underline underline-offset-2">
                    {provider.phone}
                  </a>
                </Detail>
                <Detail label="WhatsApp">{provider.whatsapp ?? "—"}</Detail>
                <Detail label="Email">{provider.email}</Detail>
                <Detail label="Website">
                  {provider.website && /^https?:\/\//i.test(provider.website) ? (
                    <a href={provider.website} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-700 underline underline-offset-2">
                      {provider.website}
                    </a>
                  ) : (
                    provider.website ?? "—"
                  )}
                </Detail>
                <Detail label="Address">
                  {provider.address ?? "—"}
                  {provider.address && !provider.address_is_public && (
                    <span className="text-ink-faint"> (private)</span>
                  )}
                </Detail>
                <Detail label="Map pin">
                  {pin ? (
                    <a href={mapsSearchUrl(pin)} target="_blank" rel="noopener noreferrer" className="text-brand-700 underline underline-offset-2">
                      {pin.latitude}, {pin.longitude}
                    </a>
                  ) : (
                    "Not set"
                  )}
                </Detail>
                <Detail label="Details">
                  {[
                    provider.established_year && `since ${provider.established_year}`,
                    provider.staff_size && `${provider.staff_size} staff`,
                    provider.pricing_band && PRICING_BAND_LABEL[provider.pricing_band],
                    provider.languages.length && provider.languages.join(", "),
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </Detail>
                <Detail label="Verification / tier">
                  {provider.verification.replaceAll("_", " ")} · {provider.tier}
                </Detail>
                {application?.notes && <Detail label="Review notes">{application.notes}</Detail>}
                {application?.reviewed_at && (
                  <Detail label="Last reviewed">{dateFormat.format(new Date(application.reviewed_at))}</Detail>
                )}
              </dl>

              <div className="mt-5 border-t border-line pt-4">
                <AdminReviewActions providerId={provider.id} status={provider.status} />
                {provider.status === "approved" && (
                  <Link href={`/providers/${provider.slug}`} className="mt-3 inline-block text-sm text-brand-700 underline underline-offset-2">
                    View public listing
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="mt-0.5 break-words text-ink">{children}</dd>
    </div>
  );
}
