import type { Metadata } from "next";
import Link from "next/link";

import { SearchBar } from "@/components/search-bar";
import { getCities, getServices } from "@/lib/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Arranging care for parents in India from abroad",
  description:
    "For NRI families: compare verified aged-care providers in your parents' Indian city and send a structured care request from anywhere in the world.",
  alternates: { canonical: "/nri" },
};

const concerns = [
  {
    title: "You can't visit to check them out",
    answer:
      "Every listing shows exactly which checks Care Connect has completed, and what each check means. No vague trust badges.",
  },
  {
    title: "The time difference makes calls hard",
    answer:
      "Send a written care request instead. The provider gets the full picture in one go and replies on your schedule.",
  },
  {
    title: "You don't know what service to ask for",
    answer:
      "Browse by category — attendant, nursing, physiotherapy, dementia care — with plain descriptions of what each one covers.",
  },
  {
    title: "Language matters for your parent",
    answer:
      "Filter providers by the languages their caregivers actually speak, so your parent is comfortable from day one.",
  },
];

export default async function NriPage() {
  const [cities, services] = await Promise.all([getCities(), getServices()]);

  return (
    <>
      <section className="border-b border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:py-20">
          <p className="text-sm font-medium uppercase tracking-widest text-brand-600">
            For families living abroad
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight sm:text-5xl">
            Your parents are in India. Their care doesn&rsquo;t have to be.
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-ink-soft">
            Arrange care for your mother or father from Sydney, London, Dubai or Toronto.
            Compare providers in their city, see what has been verified, and send one
            structured request &mdash; without waiting for a good time to call.
          </p>

          <div className="mt-8 max-w-3xl">
            <SearchBar cities={cities} services={services} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-2xl">The hard parts of arranging care from far away</h2>
        <dl className="mt-8 grid gap-8 sm:grid-cols-2">
          {concerns.map((concern) => (
            <div key={concern.title}>
              <dt className="font-medium">{concern.title}</dt>
              <dd className="mt-1.5 text-ink-soft">{concern.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto max-w-5xl px-5 py-16">
          <h2 className="text-2xl">Popular searches for NRI families</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {[
              { label: "Home care in Hyderabad", href: "/search?city=hyderabad&service=caregiver" },
              { label: "Elderly care in Bangalore", href: "/search?city=bangalore&service=attendant" },
              { label: "Dementia care in Chennai", href: "/search?city=chennai&service=dementia-care" },
              { label: "Physiotherapy in Kochi", href: "/search?city=kochi&service=physiotherapy" },
              { label: "24x7 caregiver in Coimbatore", href: "/search?city=coimbatore&service=24x7-care" },
              { label: "Nursing at home in Vizag", href: "/search?city=visakhapatnam&service=nursing-at-home" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="inline-block rounded-full border border-line bg-ground px-4 py-2 text-sm text-ink-soft transition-colors hover:border-brand-100 hover:text-brand-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
