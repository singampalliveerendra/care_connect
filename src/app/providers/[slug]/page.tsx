import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CareRequestPanel } from "@/components/care-request-panel";
import { Directions, PhoneCall, WhatsApp } from "@/components/icons";
import { VerificationBadge } from "@/components/verification-badge";
import { formatPhone, mapsHref, telHref, whatsappHref } from "@/lib/contact";
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
  const whatsapp = provider.whatsapp
    ? whatsappHref(
        provider.whatsapp,
        `Hello ${provider.name}, I found you on Care Connect and would like to ask about care for a family member.`,
      )
    : null;
  const directions = mapsHref(provider.latitude, provider.longitude);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: provider.name,
    description: provider.description ?? undefined,
    telephone: provider.phone,
    email: provider.email,
    ...(provider.latitude != null && provider.longitude != null
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: provider.latitude,
            longitude: provider.longitude,
          },
        }
      : {}),
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

          {/* The three ways to make contact, in the order families use them.
              The number is printed rather than hidden behind a "show" click —
              a listing that makes you work for a phone number reads as one
              that is farming your details. */}
          <div className="mt-6 flex flex-wrap gap-2">
            <a
              href={telHref(provider.phone)}
              className="btn btn-call"
              aria-label={`Call ${provider.name} on ${formatPhone(provider.phone)}`}
            >
              <PhoneCall className="size-4" />
              {formatPhone(provider.phone)}
            </a>

            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp"
              >
                <WhatsApp className="size-4" />
                WhatsApp
              </a>
            )}

            <a href="#enquire" className="btn btn-secondary">
              Send a care request
            </a>

            {directions && (
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost"
              >
                <Directions className="size-4" />
                Directions
              </a>
            )}
          </div>
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
                    <a href={telHref(provider.phone)} className="text-brand-700">
                      {formatPhone(provider.phone)}
                    </a>
                  </dd>
                </div>
                {provider.whatsapp && (
                  <div className="flex gap-3">
                    <dt className="w-24 shrink-0 text-ink-faint">WhatsApp</dt>
                    <dd>
                      <a
                        href={whatsapp ?? telHref(provider.whatsapp)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-700"
                      >
                        {formatPhone(provider.whatsapp)}
                      </a>
                    </dd>
                  </div>
                )}
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

          <CareRequestPanel
            providerId={provider.id}
            providerName={provider.name}
            cityId={provider.city_id}
            cityName={provider.city.name}
            services={provider.services}
            areas={provider.areas_covered}
            languages={provider.languages}
            facts={facts}
            verified={verification.showBadge}
          />
        </div>

      </div>
    </>
  );
}
