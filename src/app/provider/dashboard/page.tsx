import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/provider/actions";
import { VerificationBadge } from "@/components/verification-badge";
import { VERIFICATION } from "@/lib/domain";
import { createClient } from "@/lib/supabase/server";
import type { Provider } from "@/lib/database.types";

export const metadata: Metadata = { title: "Provider dashboard", robots: { index: false } };

const STATUS_COPY: Record<string, { label: string; body: string; tone: string }> = {
  draft: {
    label: "Draft",
    body: "Your listing hasn't been submitted for review yet.",
    tone: "bg-surface-alt text-ink-soft",
  },
  pending: {
    label: "Awaiting review",
    body: "Our team is reviewing your listing. You'll appear in search once it's approved. This usually takes a couple of working days.",
    tone: "bg-accent-100 text-ink-soft",
  },
  approved: {
    label: "Live",
    body: "Your listing is visible to families searching in your city.",
    tone: "bg-brand-50 text-brand-700",
  },
  rejected: {
    label: "Not approved",
    body: "We couldn't approve this listing. Contact us and we'll explain what's needed.",
    tone: "bg-danger-100 text-danger-500",
  },
  suspended: {
    label: "Suspended",
    body: "This listing is temporarily hidden from search. Contact us for details.",
    tone: "bg-danger-100 text-danger-500",
  },
};

export default async function ProviderDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/provider/login");

  const { data: providerRow } = await supabase
    .from("providers")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  const provider = providerRow as Provider | null;

  if (!provider) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="text-3xl">Welcome to Care Connect</h1>
        <p className="mt-3 text-ink-soft">
          You don&rsquo;t have a listing yet. Create one so families in your city can find you.
        </p>
        <Link
          href="/provider/register"
          className="mt-6 inline-block rounded-card bg-brand-600 px-5 py-2.5 font-medium text-white"
        >
          Create my listing
        </Link>
      </div>
    );
  }

  const [{ count: leadCount }, { count: newLeadCount }] = await Promise.all([
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", provider.id),
    supabase
      .from("enquiries")
      .select("id", { count: "exact", head: true })
      .eq("provider_id", provider.id)
      .eq("status", "new"),
  ]);

  const status = STATUS_COPY[provider.status] ?? STATUS_COPY.draft;
  const verification = VERIFICATION[provider.verification];

  return (
    <div className="mx-auto max-w-4xl px-5 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">{provider.name}</h1>
          <p className="mt-1 text-ink-faint">Provider dashboard</p>
        </div>
        <form action={signOut}>
          <button className="rounded-card border border-line px-4 py-2 text-sm text-ink-soft">
            Sign out
          </button>
        </form>
      </div>

      <div className={`mt-8 rounded-card px-5 py-4 ${status.tone}`}>
        <p className="font-medium">{status.label}</p>
        <p className="mt-1 text-sm">{status.body}</p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
            Care requests
          </p>
          <p className="mt-2 text-3xl tabular-nums">{leadCount ?? 0}</p>
          <p className="mt-1 text-sm text-ink-faint">{newLeadCount ?? 0} not yet opened</p>
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
            Verification
          </p>
          <div className="mt-3">
            <VerificationBadge level={provider.verification} />
            {!verification.showBadge && (
              <p className="text-sm text-ink-soft">Not yet verified</p>
            )}
          </div>
          <p className="mt-2 text-xs text-ink-faint">{verification.definition}</p>
        </div>

        <div className="rounded-card border border-line bg-surface p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
            Listing tier
          </p>
          <p className="mt-2 text-lg capitalize">{provider.tier}</p>
          <p className="mt-1 text-xs text-ink-faint">
            {provider.tier === "free"
              ? "Listed in search. Upgrade for lead alerts and analytics."
              : "Lead alerts enabled."}
          </p>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/provider/leads"
          className="rounded-card bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
        >
          View care requests
        </Link>
        {provider.status === "approved" && (
          <Link
            href={`/providers/${provider.slug}`}
            className="rounded-card border border-line px-5 py-2.5 font-medium text-ink-soft transition-colors hover:border-brand-100"
          >
            View public profile
          </Link>
        )}
      </div>

      <section className="mt-12 rounded-card border border-line bg-surface p-6">
        <h2 className="text-xl">Your listing</h2>
        <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {[
            { label: "Description", value: provider.description },
            { label: "Phone", value: provider.phone },
            { label: "Email", value: provider.email },
            { label: "Areas covered", value: provider.areas_covered.join(", ") || "—" },
            { label: "Languages", value: provider.languages.join(", ") || "—" },
            { label: "Operating since", value: provider.established_year ?? "—" },
          ].map((item) => (
            <div key={item.label}>
              <dt className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
                {item.label}
              </dt>
              <dd className="mt-1 text-sm text-ink-soft">{item.value || "—"}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 text-sm text-ink-faint">
          Need a change? Email{" "}
          <a href="mailto:providers@careconnect.example.in" className="text-brand-700">
            providers@careconnect.example.in
          </a>{" "}
          and we&rsquo;ll update it. Self-serve profile editing is coming next.
        </p>
      </section>
    </div>
  );
}
