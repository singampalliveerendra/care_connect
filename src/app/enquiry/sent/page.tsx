import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Your care request has been sent",
  robots: { index: false },
};

export default async function EnquirySentPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; count?: string }>;
}) {
  const { provider, count } = await searchParams;
  // The sidebar form sends one request to several providers, so it reports a
  // count where the profile form reports a name.
  const sentToMany = Number(count) > 1;

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-50">
        <svg viewBox="0 0 24 24" className="size-7 fill-none stroke-brand-600 stroke-2">
          <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h1 className="mt-6 text-3xl">Your care request has been sent</h1>

      <p className="mt-4 text-lg text-ink-soft">
        {provider ? (
          <>
            <strong className="font-medium text-ink">{provider}</strong> has your request
            and your contact number.
          </>
        ) : sentToMany ? (
          <>
            <strong className="font-medium text-ink">{count} providers</strong> have your
            request and your contact number.
          </>
        ) : (
          <>The provider has your request and your contact number.</>
        )}
      </p>

      <div className="mt-8 rounded-card border border-line bg-surface p-6 text-left">
        <h2 className="font-sans text-xs font-semibold uppercase tracking-widest text-ink-faint">
          What happens next
        </h2>
        <ol className="mt-4 space-y-3 text-sm text-ink-soft">
          <li className="flex gap-3">
            <span className="font-medium text-brand-600">1</span>
            {sentToMany ? "Each provider" : "The provider"} reviews what you&rsquo;ve told
            them about your parent&rsquo;s needs.
          </li>
          <li className="flex gap-3">
            <span className="font-medium text-brand-600">2</span>
            They contact you directly on the number you gave, usually within a day or
            two.{sentToMany ? " Expect more than one call." : ""}
          </li>
          <li className="flex gap-3">
            <span className="font-medium text-brand-600">3</span>
            You discuss details, cost and timing with {sentToMany ? "whoever suits you" : "them"}
            &mdash; Care Connect isn&rsquo;t part of that conversation.
          </li>
        </ol>
      </div>

      <p className="mt-8 text-sm text-ink-faint">
        Want to compare a few options? Sending the same request to two or three providers
        is completely normal.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link
          href="/search"
          className="rounded-card bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700"
        >
          Contact another provider
        </Link>
        <Link
          href="/"
          className="rounded-card border border-line px-5 py-2.5 font-medium text-ink-soft transition-colors hover:border-brand-100"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
