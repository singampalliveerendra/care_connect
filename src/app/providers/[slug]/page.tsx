import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EnquiryForm } from "@/components/enquiry-form";
import { VerificationBadge } from "@/components/verification-badge";
import { PRICING_BAND_LABEL, VERIFICATION } from "@/lib/domain";
import { getProviderBySlug, getIndexableProviderSlugs } from "@/lib/queries";

export const revalidate = 600;

type PageProps = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const providers = await getIndexableProviderSlugs();
  return providers.map((provider) => ({ slug: provider.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);
  if (!provider) return { title: "Provider not found" };

  const services = provider.services.map((service) => service.name).join(", ");

  return {
    title: `${provider.name} — ${provider.city.name}`,
    description:
      provider.description ??
      `${provider.name} offers ${services} in ${provider.city.name}.`,
    alternates: { canonical: `/providers/${provider.slug}` },
    openGraph: {
      title: `${provider.name} — aged care in ${provider.city.name}`,
      description: provider.description ?? services,
      url: `/providers/${provider.slug}`,
    },
  };
}

export default async function ProviderPage({ params }: PageProps) {
  const { slug } = await params;
  const provider = await getProviderBySlug(slug);
  if (!provider) notFound();

  const verification = VERIFICATION[provider.verification];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.name,
    description: provider.description ?? undefined,
    telephone: provider.phone,
    email: provider.email,
    url: provider.website ?? undefined,
    address: {
      "@type": "PostalAddress",
      addressLocality: provider.city.name,
      addressRegion: provider.city.state,
      addressCountry: "IN",
      ...(provider.address_is_public && provider.address
        ? { streetAddress: provider.address }
        : {}),
    },
    areaServed: provider.areas_covered,
    knowsLanguage: provider.languages,
    foundingDate: provider.established_year
      ? String(provider.established_year)
      : undefined,
  };

  const facts = [
    provider.pricing_band && {
      label: "Pricing",
      value: PRICING_BAND_LABEL[provider.pricing_band],
    },
    provider.established_year && {
      label: "Operating since",
      value: String(provider.established_year),
    },
    provider.staff_size && { label: "Team size", value: provider.staff_size },
    provider.languages.length > 0 && {
      label: "Languages",
      value: provider.languages.join(", "),
    },
    provider.areas_covered.length > 0 && {
      label: "Areas covered",
      value: provider.areas_covered.join(", "),
    },
    provider.address_is_public &&
      provider.address && { label: "Address", value: provider.address },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-5xl px-5 py-10">
        <nav className="text-sm text-ink-faint">
          <Link href="/search" className="hover:text-brand-700">
            All providers
          </Link>
          {" / "}
          <Link href={`/search?city=${provider.city.slug}`} className="hover:text-brand-700">
            {provider.city.name}
          </Link>
        </nav>

        <header className="mt-4 border-b border-line pb-8">
          <h1 className="text-3xl sm:text-4xl">{provider.name}</h1>
          <p className="mt-2 text-ink-soft">
            {provider.city.name}, {provider.city.state}
          </p>

          <div className="mt-4">
            <VerificationBadge level={provider.verification} showDefinition />
            {!verification.showBadge && (
              <p className="text-sm text-ink-faint">{verification.definition}</p>
            )}
          </div>

          <a
            href="#enquire"
            className="mt-6 inline-block rounded-card bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
          >
            Send a care request
          </a>
        </header>

        <div className="grid gap-10 py-8 lg:grid-cols-[1fr_18rem]">
          <div>
            {provider.description && (
              <section>
                <h2 className="text-xl">About</h2>
                <p className="mt-3 max-w-prose text-ink-soft">{provider.description}</p>
              </section>
            )}

            <section className="mt-10">
              <h2 className="text-xl">Services offered</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {provider.services.map((service) => (
                  <li
                    key={service.id}
                    className="rounded-full bg-surface-alt px-3 py-1.5 text-sm text-ink-soft"
                  >
                    {service.name}
                  </li>
                ))}
              </ul>
            </section>

            <section className="mt-10">
              <h2 className="text-xl">Contact</h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-ink-faint">Phone</dt>
                  <dd>
                    <a href={`tel:${provider.phone.replace(/\s/g, "")}`} className="text-brand-700">
                      {provider.phone}
                    </a>
                  </dd>
                </div>
                <div className="flex gap-3">
                  <dt className="w-24 shrink-0 text-ink-faint">Email</dt>
                  <dd>
                    <a href={`mailto:${provider.email}`} className="text-brand-700">
                      {provider.email}
                    </a>
                  </dd>
                </div>
                {provider.website && (
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-ink-faint">Website</dt>
                    <dd>
                      <a
                        href={provider.website}
                        rel="nofollow noopener"
                        target="_blank"
                        className="text-brand-700 break-all"
                      >
                        {provider.website}
                      </a>
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          </div>

          {facts.length > 0 && (
            <aside className="h-fit rounded-card border border-line bg-surface p-5">
              <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-faint">
                At a glance
              </h2>
              <dl className="mt-4 space-y-3 text-sm">
                {facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-ink-faint">{fact.label}</dt>
                    <dd className="mt-0.5">{fact.value}</dd>
                  </div>
                ))}
              </dl>
            </aside>
          )}
        </div>

        <section id="enquire" className="scroll-mt-6 border-t border-line pt-10">
          <h2 className="text-2xl">Send a care request</h2>
          <p className="mt-2 max-w-prose text-ink-soft">
            Tell {provider.name} what you need. The more you share, the more useful their
            reply will be. Only your name, phone number and the care needed are required.
          </p>
          <p className="mt-2 max-w-prose text-sm text-ink-faint">
            Please don&rsquo;t include detailed medical records here &mdash; we only collect
            what a provider needs to respond.
          </p>

          <div className="mt-8">
            <EnquiryForm
              providerId={provider.id}
              providerName={provider.name}
              cityId={provider.city_id}
              cityName={provider.city.name}
              services={provider.services}
              areas={provider.areas_covered}
              languages={provider.languages}
            />
          </div>
        </section>
      </div>
    </>
  );
}
