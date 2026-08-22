import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Care Connect",
  description: "Get in touch with the Care Connect team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-4xl">Contact us</h1>
      <p className="mt-4 text-lg text-ink-soft">
        For anything about a listing, a verification, or a care request you&rsquo;ve sent.
      </p>

      <dl className="mt-10 space-y-6">
        <div>
          <dt className="font-medium">Families</dt>
          <dd className="mt-1 text-ink-soft">
            <a href="mailto:families@careconnect.example.in" className="text-brand-700">
              families@careconnect.example.in
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-medium">Providers</dt>
          <dd className="mt-1 text-ink-soft">
            <a href="mailto:providers@careconnect.example.in" className="text-brand-700">
              providers@careconnect.example.in
            </a>
          </dd>
        </div>
        <div>
          <dt className="font-medium">Privacy and data requests</dt>
          <dd className="mt-1 text-ink-soft">
            <a href="mailto:privacy@careconnect.example.in" className="text-brand-700">
              privacy@careconnect.example.in
            </a>
          </dd>
        </div>
      </dl>

      <p className="mt-10 rounded-card border border-accent-500/30 bg-accent-100 px-4 py-3 text-sm text-ink-soft">
        Care Connect is not an emergency service. If someone needs urgent medical help, call
        your local emergency number or go to the nearest hospital.
      </p>
    </div>
  );
}
