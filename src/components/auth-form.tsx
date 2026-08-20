"use client";

import { useActionState, useState } from "react";

import { authenticate, type ActionState, type AuthMode } from "@/app/provider/actions";

const fieldClass =
  "w-full rounded-card border border-line bg-surface px-3 py-2.5 text-ink";

export function AuthForm({ next, defaultMode = "signin" }: { next?: string; defaultMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(authenticate, {});

  // The hook's state survives a tab switch, so only show a result that came
  // back from the tab currently on screen.
  const result = state.mode === mode ? state : {};

  return (
    <div>
      <div className="mb-6 flex gap-1 rounded-card bg-surface-alt p-1 text-sm">
        {(["signin", "signup"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setMode(option)}
            aria-pressed={mode === option}
            className={`flex-1 rounded-[0.375rem] px-3 py-2 font-medium transition-colors ${
              mode === option ? "bg-surface text-ink shadow-sm" : "text-ink-faint"
            }`}
          >
            {option === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="mode" value={mode} />
        {next && <input type="hidden" name="next" value={next} />}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">Password</span>
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            className={fieldClass}
          />
          {result.fieldErrors?.password && (
            <span className="mt-1 block text-xs text-danger-500">
              {result.fieldErrors.password}
            </span>
          )}
        </label>

        {result.error && (
          <p role="alert" className="rounded-card bg-danger-100 px-3 py-2 text-sm text-danger-500">
            {result.error}
          </p>
        )}

        {result.notice && (
          <p className="rounded-card bg-accent-100 px-3 py-2 text-sm text-ink-soft">
            {result.notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-card bg-brand-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>
    </div>
  );
}
