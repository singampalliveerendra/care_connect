import type { Metadata } from "next";
import Link from "next/link";

import { ScopeDisclaimer } from "@/components/scope-disclaimer";

export const metadata: Metadata = {
  title: "How CareConnect works",
  description:
    "Search providers in your parents' city, compare what has been verified, and send one structured care request that reaches the provider directly.",
  alternates: { canonical: "/how-it-works" },
};

const steps = [
  {
    title: "Choose the city",
    body: "We open a city only once there are enough verified providers in it, so a search always returns real options.",
  },
  {
    title: "Pick the kind of care",
    body: "Attendant, nursing at home, physiotherapy, dementia care, palliative care, assisted living — described in plain language.",
  },
  {
    title: "Compare providers",
    body: "Filter by area, language spoken and verification level. Every badge links to exactly what that check covers.",
  },
  {
    title: "Send one structured request",
    body: "Instead of a blank contact form, you answer a short set of questions so the provider can give you a real answer first time.",
  },
  {
    title: "The provider contacts you",
    body: "Your request lands in their dashboard and is sent to them. They call you back directly, usually within a day or two.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <h1 className="text-4xl">How CareConnect works</h1>
      <p className="mt-4 text-lg text-ink-soft">
        We help you find and contact aged-care providers. We don&rsquo;t provide care
        ourselves, and we don&rsquo;t take a cut of what you pay a provider.
      </p>

      <ol className="mt-12 space-y-8">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-medium text-brand-700">
              {index + 1}
            </span>
            <div>
              <h2 className="text-lg">{step.title}</h2>
              <p className="mt-1 text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <ScopeDisclaimer className="mt-14" />

      <p className="mt-10">
        <Link
          href="/search"
          className="inline-block rounded-card bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
        >
          Start searching
        </Link>
      </p>
    </div>
  );
}
