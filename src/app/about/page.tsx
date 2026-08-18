import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About CareConnect India",
  description:
    "CareConnect India helps families discover, compare and contact trustworthy aged-care providers across Indian cities.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-5 py-16">
      <h1 className="text-4xl">About CareConnect India</h1>

      <div className="mt-6 space-y-5 text-lg text-ink-soft">
        <p>
          Finding care for an ageing parent in India is unreasonably hard. Families ask
          around, collect phone numbers, and hope the person who picks up is trustworthy.
          For adult children living in another city &mdash; or another country &mdash; it is
          harder still.
        </p>
        <p>
          CareConnect exists to fix the first part of that problem: discovery and trust.
          We list aged-care providers city by city, publish exactly what we have verified
          about each one, and let you send a single structured request instead of
          repeating your situation on a dozen phone calls.
        </p>
        <p>
          We start in Visakhapatnam, where we recruit and verify providers ourselves, and
          open new cities only once there is enough real supply to make a search worth
          doing.
        </p>
      </div>

      <h2 className="mt-12 text-2xl">What we believe</h2>
      <ul className="mt-4 space-y-3 text-ink-soft">
        <li>
          <strong className="font-medium text-ink">A badge must mean something.</strong>{" "}
          We publish the definition of every verification level, and never imply a check
          we haven&rsquo;t done.
        </li>
        <li>
          <strong className="font-medium text-ink">Paying us doesn&rsquo;t buy trust.</strong>{" "}
          A provider&rsquo;s subscription affects where they appear in search. It never
          affects their verification level.
        </li>
        <li>
          <strong className="font-medium text-ink">Collect only what&rsquo;s needed.</strong>{" "}
          We ask what a provider needs in order to help you, and nothing more. We do not
          collect medical records.
        </li>
      </ul>
    </div>
  );
}
