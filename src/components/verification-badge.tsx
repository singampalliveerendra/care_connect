import { BadgeCheck, FileCheck, IdCard, ShieldCheck } from "@/components/icons";
import { VERIFICATION, type VerificationLevel } from "@/lib/domain";

/**
 * Brief §11: only render a badge for a level whose definition is documented,
 * and show that definition rather than implying a stronger check than the one
 * actually performed.
 *
 * Each level gets its own glyph and weight so a family can tell them apart at
 * a glance — four identically-shaped green pills would read as one badge with
 * four different captions, which is exactly the confusion §11 guards against.
 */
const STYLES: Record<
  VerificationLevel,
  { className: string; Glyph: (props: React.SVGProps<SVGSVGElement>) => React.ReactElement }
> = {
  unverified: { className: "", Glyph: ShieldCheck },
  business_verified: {
    className: "bg-surface-alt text-ink-soft ring-1 ring-line-strong",
    Glyph: Building,
  },
  credential_verified: {
    className: "bg-brand-50 text-brand-700 ring-1 ring-brand-100",
    Glyph: FileCheck,
  },
  background_check: {
    className: "bg-accent-50 text-accent-700 ring-1 ring-accent-200",
    Glyph: IdCard,
  },
  careconnect_verified: {
    className: "bg-brand-600 text-white shadow-soft",
    Glyph: BadgeCheck,
  },
};

// Small local glyph: the business badge wants a premises mark, not a shield.
function Building(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      <path d="M4.4 20.6h15.2M6 20.6V4.6a1.2 1.2 0 0 1 1.2-1.2h9.6A1.2 1.2 0 0 1 18 4.6v16" />
      <path d="M9.2 7.4h1.6M13.2 7.4h1.6M9.2 11h1.6M13.2 11h1.6M10.4 20.6v-3.8h3.2v3.8" />
    </svg>
  );
}

export function VerificationBadge({
  level,
  showDefinition = false,
  size = "sm",
}: {
  level: VerificationLevel;
  showDefinition?: boolean;
  size?: "sm" | "md";
}) {
  const entry = VERIFICATION[level];
  if (!entry.showBadge) return null;

  const { className, Glyph } = STYLES[level];

  return (
    <span className="inline-flex flex-col gap-1.5">
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full font-medium ${className} ${
          size === "md" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
        }`}
        title={entry.definition}
      >
        <Glyph className={size === "md" ? "size-4" : "size-3.5"} />
        {entry.label}
      </span>
      {showDefinition && (
        <span className="max-w-prose text-xs leading-relaxed text-ink-faint">
          {entry.definition}
        </span>
      )}
    </span>
  );
}

export function UnverifiedNote({ level }: { level: VerificationLevel }) {
  if (VERIFICATION[level].showBadge) return null;
  return (
    <p className="inline-flex items-center gap-1.5 rounded-full bg-surface-alt px-2.5 py-1 text-xs text-ink-faint">
      <ShieldCheck className="size-3.5" />
      {VERIFICATION.unverified.definition}
    </p>
  );
}
