import { Close } from "@/components/icons";

/**
 * What Care Connect deliberately isn't.
 *
 * Every line here is a brief constraint, not a legal hedge: no consumer
 * booking or payment (§20), no claim to supervise delivery (§11, §33), no
 * medical advice (§3, §33). Stating the limits plainly is a trust move — a
 * family that discovers the boundary after sending a request trusts the
 * product less than one told up front.
 *
 * Shared between /how-it-works and the homepage so the wording cannot drift.
 */

const LIMITS = [
  "We don’t book or schedule care for you.",
  "We don’t take payment for care services.",
  "We don’t supervise or guarantee the care a provider delivers.",
  "We don’t give medical advice.",
];

export function ScopeDisclaimer({ className = "" }: { className?: string }) {
  return (
    <section className={`card p-6 ${className}`}>
      <h2 className="text-xl">What we don&rsquo;t do</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {LIMITS.map((limit) => (
          <li key={limit} className="flex items-start gap-2.5 text-ink-soft">
            <Close className="mt-0.5 size-4 shrink-0 text-ink-faint" />
            <span>{limit}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
