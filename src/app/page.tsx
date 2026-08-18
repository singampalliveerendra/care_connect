import Link from "next/link";

import { SearchBar } from "@/components/search-bar";
import { VERIFICATION } from "@/lib/domain";
import { getCities, getCityProviderCounts, getServiceCatalogue, getServices } from "@/lib/queries";

export const revalidate = 300;

export default async function HomePage() {
  const [cities, services, catalogue, counts] = await Promise.all([
    getCities(),
    getServices(),
    getServiceCatalogue(),
    getCityProviderCounts(),
  ]);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
            Aged care across India
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
            Find care you can trust for your parents, wherever you are.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-soft">
            Compare aged-care providers in your parents&rsquo; city, see exactly what has
            been verified, and send one structured care request that reaches them directly.
          </p>

          <div className="mt-8 max-w-3xl">
            <SearchBar cities={cities} services={services} />
          </div>

          <p className="mt-4 text-sm text-ink-faint">
            Living overseas?{" "}
            <Link href="/nri" className="text-brand-700 underline underline-offset-2">
              See how NRI families arrange care from abroad
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl">Cities we cover today</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          We open a city only once we have enough verified providers in it. Visakhapatnam
          is our test bed; more cities follow.
        </p>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((city) => (
            <li key={city.id}>
              <Link
                href={`/search?city=${city.slug}`}
                className="flex h-full flex-col justify-between rounded-card border border-line bg-surface p-4 transition-colors hover:border-brand-100 hover:bg-brand-50"
              >
                <span className="font-medium">{city.name}</span>
                <span className="mt-1 text-sm text-ink-faint">
                  {city.state} &middot; {counts[city.slug] ?? 0} providers
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="text-2xl">What kind of care do you need?</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {catalogue.map((category) => (
              <div key={category.id}>
                <h3 className="text-lg text-brand-700">{category.name}</h3>
                {category.description && (
                  <p className="mt-1 text-sm text-ink-faint">{category.description}</p>
                )}
                <ul className="mt-3 space-y-1.5 text-sm">
                  {category.services.map((service) => (
                    <li key={service.id}>
                      <Link
                        href={`/search?service=${service.slug}`}
                        className="text-ink-soft hover:text-brand-700"
                      >
                        {service.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-2xl">What our badges actually mean</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          A badge is a statement about checks we have completed &mdash; never a claim about
          the quality of care. Paying for a listing never changes a provider&rsquo;s
          verification level.
        </p>

        <dl className="mt-8 grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {Object.entries(VERIFICATION)
            .filter(([, value]) => value.showBadge)
            .map(([key, value]) => (
              <div key={key}>
                <dt className="font-medium text-brand-700">{value.label}</dt>
                <dd className="mt-1 text-sm text-ink-soft">{value.definition}</dd>
              </div>
            ))}
        </dl>
      </section>
    </>
  );
}
