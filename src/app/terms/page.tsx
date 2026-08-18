import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and disclaimer",
  description: "The terms on which CareConnect India provides its service.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="rounded-card border border-accent-500/30 bg-accent-100 px-4 py-3 text-sm text-ink-soft">
        <strong className="font-medium text-ink">Draft — pending legal review.</strong> These
        terms describe how the product currently works and must be reviewed by a qualified
        adviser before launch.
      </p>

      <h1 className="mt-8 text-4xl">Terms and disclaimer</h1>

      <div className="mt-6 space-y-8 text-ink-soft">
        <section>
          <h2 className="text-xl text-ink">What CareConnect is</h2>
          <p className="mt-2">
            CareConnect India is a discovery platform. We help families find and contact
            aged-care providers. We are not a care provider, a healthcare provider, a
            staffing agency or an employer of caregivers.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">What verification means</h2>
          <p className="mt-2">
            Each verification level on a listing describes a specific set of checks that
            CareConnect has completed. Those definitions are published on every profile. A
            verification is not a guarantee of the quality, safety or suitability of the
            care a provider delivers, and it is not a recommendation.
          </p>
          <p className="mt-2">
            A provider&rsquo;s paid listing tier affects only where they appear in search
            results. It never affects their verification level.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">Your relationship with the provider</h2>
          <p className="mt-2">
            Any care arrangement, price, schedule and payment is agreed directly between
            you and the provider. CareConnect is not a party to that agreement and does not
            supervise the care delivered. You are responsible for satisfying yourself that
            a provider is suitable before engaging them.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">No medical advice</h2>
          <p className="mt-2">
            Nothing on CareConnect is medical advice. Service descriptions are general
            information to help you find the right kind of provider. For medical decisions,
            consult a qualified doctor.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">Not an emergency service</h2>
          <p className="mt-2">
            CareConnect does not respond to emergencies. If someone needs urgent help, call
            your local emergency number or go to the nearest hospital.
          </p>
        </section>
      </div>
    </div>
  );
}
