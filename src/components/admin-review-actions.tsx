"use client";

import { useActionState } from "react";

import { reviewProvider, type ReviewState } from "@/app/admin/actions";
import type { ProviderStatus } from "@/lib/database.types";

const BUTTONS: Record<ProviderStatus, { decision: ProviderStatus; label: string; tone: string }[]> = {
  draft: [],
  pending: [
    { decision: "approved", label: "Approve", tone: "bg-brand-600 text-white hover:bg-brand-700" },
    { decision: "rejected", label: "Reject", tone: "border border-line text-danger-500" },
  ],
  approved: [{ decision: "suspended", label: "Suspend", tone: "border border-line text-danger-500" }],
  rejected: [
    { decision: "approved", label: "Approve", tone: "bg-brand-600 text-white hover:bg-brand-700" },
    { decision: "pending", label: "Back to pending", tone: "border border-line text-ink-soft" },
  ],
  suspended: [
    { decision: "approved", label: "Restore", tone: "bg-brand-600 text-white hover:bg-brand-700" },
    { decision: "rejected", label: "Reject", tone: "border border-line text-danger-500" },
  ],
};

const CONFIRM: Partial<Record<ProviderStatus, string>> = {
  approved: "Publish this listing to families in search?",
  rejected: "Reject this listing? It stays hidden from search.",
  suspended: "Hide this live listing from search?",
};

export function AdminReviewActions({
  providerId,
  status,
}: {
  providerId: string;
  status: ProviderStatus;
}) {
  const [state, formAction, pending] = useActionState<ReviewState, FormData>(reviewProvider, {});
  const buttons = BUTTONS[status] ?? [];

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="providerId" value={providerId} />
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">
          Note for the record <span className="font-normal text-ink-faint">optional</span>
        </span>
        <textarea
          name="notes"
          rows={2}
          maxLength={1000}
          className="w-full rounded-card border border-line bg-surface px-3 py-2 text-sm text-ink"
          placeholder="e.g. Called the owner, confirmed address and services"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        {buttons.map((button) => (
          <button
            key={button.decision}
            type="submit"
            name="decision"
            value={button.decision}
            disabled={pending}
            onClick={(event) => {
              const question = CONFIRM[button.decision];
              if (question && !window.confirm(question)) event.preventDefault();
            }}
            className={`rounded-card px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${button.tone}`}
          >
            {button.label}
          </button>
        ))}
        {pending && <span className="self-center text-sm text-ink-faint">Saving…</span>}
      </div>
      {state.error && (
        <p role="alert" className="rounded-card bg-danger-100 px-3 py-2 text-sm text-danger-500">
          {state.error}
        </p>
      )}
      {state.done && !pending && (
        <p role="status" className="text-sm text-success-700">
          {state.done}
        </p>
      )}
    </form>
  );
}
