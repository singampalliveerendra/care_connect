import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Care Connect collects, uses and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <p className="rounded-card border border-accent-500/30 bg-accent-100 px-4 py-3 text-sm text-ink-soft">
        <strong className="font-medium text-ink">Draft — pending legal review.</strong> This
        page describes how the product currently handles data. It must be reviewed by a
        qualified adviser for the Indian operating model before launch.
      </p>

      <h1 className="mt-8 text-4xl">Privacy policy</h1>

      <div className="mt-6 space-y-8 text-ink-soft">
        <section>
          <h2 className="text-xl text-ink">What we collect</h2>
          <p className="mt-2">
            When you send a care request we collect your name and phone number, optionally
            your email, and the details you give about the care needed &mdash; the city and
            area, the type of service, the age and mobility of the person needing care,
            timing, language and budget preferences.
          </p>
          <p className="mt-2">
            We do not collect medical records, diagnoses, prescriptions or clinical history.
            Please don&rsquo;t include them in the free-text fields.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">Who sees it</h2>
          <p className="mt-2">
            Your care request is shared with the single provider you chose to contact. It
            is not published, not sold, and not shared with other providers. Care Connect
            staff can access requests to operate and support the service.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">How it&rsquo;s protected</h2>
          <p className="mt-2">
            Requests are stored in an access-controlled database. Only the provider you
            contacted and authorised Care Connect staff can read them. Administrative
            actions on records are logged.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">Your choices</h2>
          <p className="mt-2">
            You can ask us for a copy of the requests you&rsquo;ve sent, or ask us to delete
            them, by writing to{" "}
            <a href="mailto:privacy@careconnect.example.in" className="text-brand-700">
              privacy@careconnect.example.in
            </a>
            . Deletion does not recall a request a provider has already received.
          </p>
        </section>

        <section>
          <h2 className="text-xl text-ink">Providers</h2>
          <p className="mt-2">
            Provider business details — name, description, services, areas, languages and
            contact information — are published publicly. Verification evidence and internal
            notes are not.
          </p>
        </section>
      </div>
    </div>
  );
}
