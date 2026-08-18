import { VERIFICATION, type VerificationLevel } from "@/lib/domain";

/**
 * Brief §11: only render a badge for a level whose definition is documented,
 * and show that definition rather than implying a stronger check than performed.
 */
export function VerificationBadge({
  level,
  showDefinition = false,
}: {
  level: VerificationLevel;
  showDefinition?: boolean;
}) {
  const entry = VERIFICATION[level];
  if (!entry.showBadge) return null;

  const emphasis =
    level === "careconnect_verified"
      ? "bg-brand-600 text-white"
      : "bg-brand-50 text-brand-700 ring-1 ring-brand-100";

  return (
    <span className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${emphasis}`}
        title={entry.definition}
      >
        <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5 fill-current">
          <path d="M8 0.5 10 2.6l2.9-.3.5 2.9 2.4 1.7-1.5 2.5 1 2.8-2.8 1-1 2.8-2.8-.6-2.4 1.7L4 14.6l-2.8-.6.4-2.9L0 8.9l2-2.1L1.6 3.8l2.8-1L5.5.9l2.5.9z" />
          <path d="M6.9 10.6 4.6 8.3l1-1 1.3 1.3 3.4-3.4 1 1z" className="fill-white" />
        </svg>
        {entry.label}
      </span>
      {showDefinition && (
        <span className="text-xs text-ink-faint">{entry.definition}</span>
      )}
    </span>
  );
}

export function UnverifiedNote({ level }: { level: VerificationLevel }) {
  if (VERIFICATION[level].showBadge) return null;
  return (
    <p className="text-xs text-ink-faint">{VERIFICATION.unverified.definition}</p>
  );
}
