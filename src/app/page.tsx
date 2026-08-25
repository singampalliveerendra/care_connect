import Image from "next/image";
import Link from "next/link";

import {
  ArrowRight,
  BadgeCheck,
  CategoryIcon,
  FileCheck,
  IdCard,
  Lock,
  MapPin,
  ShieldCheck,
} from "@/components/icons";
// import { ScopeDisclaimer } from "@/components/scope-disclaimer";
import { SearchBar } from "@/components/search-bar";
import { VERIFICATION } from "@/lib/domain";
import { getCities, getCityProviderCounts, getServiceCatalogue, getServices } from "@/lib/queries";

export const revalidate = 300;

/* Hidden with the three-steps section above.
const STEPS = [
  {
    Glyph: Search,
    title: "Search your parents' city",
    body: "Filter by the type of care, the area they live in, and the language they are most comfortable speaking.",
  },
  {
    Glyph: Message,
    title: "Send one care request",
    body: "Describe the situation once — condition, mobility, hours needed, budget. No repeating it to six agencies.",
  },
  {
    Glyph: Users,
    title: "Providers reach out to you",
    body: "Your request goes straight to the providers you chose. They contact you directly to talk it through.",
  },
];
*/

/** Icons for the badge explainer, keyed to the levels the brief allows us to
 *  display. Kept beside VERIFICATION rather than inside it so the domain layer
 *  stays free of presentation concerns. */
const BADGE_GLYPHS: Record<string, typeof ShieldCheck> = {
  business_verified: ShieldCheck,
  credential_verified: FileCheck,
  background_check: IdCard,
  careconnect_verified: BadgeCheck,
};

export default async function HomePage() {
  const [cities, services, catalogue, counts] = await Promise.all([
    getCities(),
    getServices(),
    getServiceCatalogue(),
    getCityProviderCounts(),
  ]);

  const totalProviders = Object.values(counts).reduce((sum, n) => sum + n, 0);

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative isolate overflow-hidden border-b border-line bg-surface">
        <div
          aria-hidden="true"
          className="dot-field absolute inset-0 opacity-50 [mask-image:radial-gradient(70%_60%_at_70%_0%,#000,transparent)]"
        />
        <div
          aria-hidden="true"
          className="absolute -right-40 -top-40 size-[34rem] rounded-full bg-gradient-to-br from-brand-50 via-accent-50 to-transparent blur-3xl"
        />
        <div aria-hidden="true" className="grain-layer" />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-8 sm:pb-28 sm:pt-10">
          {/* The search bar leads the hero — it is the only thing on this page
              a worried family actually needs, so it sits above the fold and
              above the headline rather than under it. */}
          <div className="animate-fade-rise mx-auto max-w-3xl">
            <SearchBar cities={cities} services={services} />
          </div>

          {/* Headline and mark sit side by side from lg up. Below that the mark
              drops under the copy at a reduced size — a full-width square would
              push everything under it far off the fold. */}
          <div className="mt-4 grid items-center gap-10 sm:mt-5 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <h1 className="animate-fade-rise text-4xl leading-[1.1] sm:text-6xl">
                Find care{" "}
                <em className="font-normal not-italic text-brand-600">
                  you can trust
                </em>{" "}
                for your parents.
              </h1>

              {/* <p className="animate-fade-rise mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
                Compare aged-care providers in your parents&rsquo; city, see exactly what
                has been verified, and send one structured care request that reaches
                them directly.
              </p> */}
            </div>

            <Image
              src="/hero-care.png"
              alt="An elderly couple at home within a location pin, cradled in an open hand beside a growing tree — find trusted care, peace of mind for your parents."
              width={1254}
              height={1254}
              priority
              sizes="(min-width: 1024px) 13rem, 7.5rem"
              className="animate-fade-rise mx-auto w-[7.5rem] max-w-full justify-self-center lg:w-[13rem] lg:justify-self-end"
            />
          </div>

          {/* Trust banner. This closes the hero because the question a
              stressed family is actually asking at this moment is
              not "can I search" but "can I trust this". Each claim is
              a link to the page that substantiates it — an unbacked trust
              badge is worse than none. */}
          <ul className="stagger mt-10 grid gap-4 sm:grid-cols-2">
            {[
              {
                Glyph: ShieldCheck,
                title: "Verified providers",
                body: `Every one of the ${totalProviders} listings is checked before it goes live.`,
                href: "/how-it-works#verification",
              },
              {
                Glyph: Lock,
                title: "Your privacy protected",
                body: "Your details reach only the providers you choose. Never sold, never broadcast.",
                href: "/privacy",
              },
            ].map(({ Glyph, title, body, href }) => (
              <li key={title}>
                <Link
                  href={href}
                  className="card card-interactive flex h-full flex-col gap-2 p-5 hover:no-underline"
                >
                  <Glyph className="size-6 text-brand-600" />
                  <span className="font-medium text-ink">{title}</span>
                  <span className="text-sm leading-relaxed text-ink-soft">{body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------- 3 steps (hidden)
      {( --------------------------------------------------------- 3 steps )}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">How it works</p>
        <h2 className="mt-3 max-w-2xl text-3xl">
          Three steps, and you are talking to real providers.
        </h2>

        <ol className="stagger mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="relative">
              {( The rule connects the steps into a sequence on wide screens. )}
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-14 top-6 hidden h-px w-[calc(100%-2rem)] bg-gradient-to-r from-brand-100 to-transparent md:block"
                />
              )}
              <span className="relative grid size-12 place-items-center rounded-card bg-brand-600 text-white shadow-lift">
                <step.Glyph className="size-6" />
                <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-accent-500 text-[0.6875rem] font-semibold text-white">
                  {index + 1}
                </span>
              </span>
              <h3 className="mt-5 text-lg">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>

        {( Stating the limits right after the three steps, while the family is
            still forming a model of what this product is. Discovering the
            boundary later — after sending a request — costs more trust than
            naming it here. )}
        {( <ScopeDisclaimer className="mt-14" /> )}
      </section>
      */}

      {/* ---------------------------------------------------------- cities */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Coverage</p>
              <h2 className="mt-3 text-3xl">Cities we cover today</h2>
              <p className="mt-3 max-w-2xl text-ink-soft">
                We open a city only once we have enough verified providers in it.
                Visakhapatnam is our test bed; more cities follow.
              </p>
            </div>
            <Link href="/search" className="btn btn-secondary">
              Browse every provider
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ul className="stagger mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cities.map((city) => (
              <li key={city.id}>
                <Link
                  href={`/search?city=${city.slug}`}
                  className="card card-interactive group flex h-full items-center gap-3 p-4"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600 ring-1 ring-brand-100 transition-colors group-hover:bg-brand-100">
                    <MapPin className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{city.name}</span>
                    <span className="mt-0.5 block text-sm text-ink-faint">
                      {city.state} &middot; {counts[city.slug] ?? 0} providers
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* -------------------------------------------------------- services */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="eyebrow">Services</p>
        <h2 className="mt-3 text-3xl">What kind of care do you need?</h2>
        <p className="mt-3 max-w-2xl text-ink-soft">
          Not sure which one fits? Pick the closest — you can describe the full
          situation in your care request.
        </p>

        <div className="stagger mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {catalogue.map((category) => (
            <div key={category.id} className="card flex h-full flex-col p-5">
              <span className="grid size-11 place-items-center rounded-card bg-accent-50 text-accent-600 ring-1 ring-accent-100">
                <CategoryIcon slug={category.slug} className="size-6" />
              </span>
              <h3 className="mt-4 text-lg">{category.name}</h3>
              {category.description && (
                <p className="mt-1.5 text-sm leading-relaxed text-ink-faint">
                  {category.description}
                </p>
              )}
              <ul className="mt-4 flex flex-wrap gap-1.5 border-t border-line-soft pt-4">
                {category.services.map((service) => (
                  <li key={service.id}>
                    <Link
                      href={`/search?service=${service.slug}`}
                      className="chip chip-neutral transition-colors hover:bg-brand-50 hover:text-brand-700"
                    >
                      {service.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- badges */}
      <section className="border-y border-line bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <div className="grid gap-12 lg:grid-cols-[22rem_1fr]">
            <div>
              <p className="eyebrow">Trust</p>
              <h2 className="mt-3 text-3xl">What our badges actually mean</h2>
              <p className="mt-4 leading-relaxed text-ink-soft">
                A badge is a statement about checks we have completed &mdash; never a
                claim about the quality of care.
              </p>
              <p className="mt-4 rounded-card border border-accent-200 bg-accent-50 p-4 text-sm leading-relaxed text-accent-700">
                <strong className="font-semibold">Paying for a listing never changes
                a provider&rsquo;s verification level.</strong>{" "}
                A premium listing can appear higher in results, and we label it as
                promoted. It cannot buy a badge.
              </p>
            </div>

            <dl className="stagger grid gap-4 sm:grid-cols-2">
              {Object.entries(VERIFICATION)
                .filter(([, value]) => value.showBadge)
                .map(([key, value]) => {
                  const Glyph = BADGE_GLYPHS[key] ?? ShieldCheck;
                  return (
                    <div key={key} className="card p-5">
                      <dt className="flex items-center gap-2.5 font-medium text-brand-700">
                        <Glyph className="size-5 shrink-0" />
                        {value.label}
                      </dt>
                      <dd className="mt-2 text-sm leading-relaxed text-ink-soft">
                        {value.definition}
                      </dd>
                    </div>
                  );
                })}
            </dl>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- distance */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="relative isolate overflow-hidden rounded-hero bg-brand-800 px-7 py-14 text-ink-invert sm:px-14">
          <div
            aria-hidden="true"
            className="stack-lines absolute inset-0 opacity-[0.07]"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 -right-16 size-80 rounded-full bg-brand-600/40 blur-3xl"
          />

          <div className="relative max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm text-brand-100">
              <MapPin className="size-4" />
              For families at a distance
            </span>
            <h2 className="mt-5 text-3xl text-white sm:text-4xl">
              You can&rsquo;t be there every day. Their care doesn&rsquo;t have to be
              your 3 a.m. problem.
            </h2>
            <p className="mt-4 leading-relaxed text-brand-100">
              Whether you are a flight or a train ride away: compare providers
              before you call, send a request with the full picture, and give
              someone nearby a contact they can follow up with.
            </p>
            <Link href="/nri" className="btn btn-accent mt-8">
              See how it works from anywhere
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- provider */}
      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-5 py-14">
          <div>
            <h2 className="text-2xl">Do you run a care service?</h2>
            <p className="mt-2 max-w-xl text-ink-soft">
              List your service and receive structured care requests from families
              &mdash; with the situation already described.
            </p>
          </div>
          <Link href="/provider/register" className="btn btn-primary">
            List your service
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
