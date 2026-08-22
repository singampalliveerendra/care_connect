import type { Metadata } from "next";

import { AuthForm } from "@/components/auth-form";
import { ProviderRegistrationForm } from "@/components/provider-registration-form";
import { getCities, getServiceCatalogue } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "List your care service",
  description:
    "Create a Care Connect listing so families searching in your city can find and contact you.",
  robots: { index: false },
};

export default async function ProviderRegisterPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [cities, catalogue] = await Promise.all([getCities(), getServiceCatalogue()]);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-5 py-16">
        <h1 className="text-3xl">List your care service</h1>
        <p className="mt-2 text-ink-soft">
          Create an account first. It takes a minute, and your listing goes live once our
          team has reviewed it.
        </p>
        <div className="mt-8">
          <AuthForm defaultMode="signup" />
        </div>
      </div>
    );
  }

  const { data: existing } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existing) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <h1 className="text-3xl">You already have a listing</h1>
        <p className="mt-3 text-ink-soft">
          Head to your dashboard to check its status or update the details.
        </p>
        <a
          href="/provider/dashboard"
          className="mt-6 inline-block rounded-card bg-brand-600 px-5 py-2.5 font-medium text-white"
        >
          Go to dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="text-3xl">List your care service</h1>
      <p className="mt-2 max-w-prose text-ink-soft">
        Families use this information to decide who to contact, so be specific. Our team
        reviews every listing before it appears in search.
      </p>

      <div className="mt-10">
        <ProviderRegistrationForm cities={cities} catalogue={catalogue} defaultEmail={user.email ?? ""} />
      </div>
    </div>
  );
}
