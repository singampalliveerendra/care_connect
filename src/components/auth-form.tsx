"use client";

import { useActionState, useState } from "react";

import {
  authenticate,
  signInWithProvider,
  type ActionState,
  type AuthMode,
} from "@/app/provider/actions";
import { Google } from "@/components/icons";

const fieldClass =
  "w-full rounded-card border border-line bg-surface px-3 py-2.5 text-ink";

/** Messages for the `?error=` the OAuth callback bounces back with. A failed
 *  social sign-in lands on a fresh page render, so it cannot be reported
 *  through the form's action state. */
const OAUTH_ERRORS: Record<string, string> = {
  cancelled: "Sign-in was cancelled. Try again, or use your email and password.",
  oauth: "We couldn't complete that sign-in. Try again, or use your email and password.",
};

export function AuthForm({
  next,
  defaultMode = "signin",
  oauthError,
  signInOnly = false,
}: {
  next?: string;
  defaultMode?: AuthMode;
  oauthError?: string;
  /** Email and password sign-in only — no account creation, no Google. */
  signInOnly?: boolean;
}) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(authenticate, {});

  // The hook's state survives a tab switch, so only show a result that came
  // back from the tab currently on screen.
  const result = state.mode === mode ? state : {};

  return (
    <div>
      {!signInOnly && (
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
      )}

      {oauthError && OAUTH_ERRORS[oauthError] && (
        <p
          role="alert"
          className="mb-4 rounded-card bg-danger-100 px-3 py-2 text-sm text-danger-500"
        >
          {OAUTH_ERRORS[oauthError]}
        </p>
      )}

      {!signInOnly && (
      <>
      <form action={signInWithProvider}>
        <input type="hidden" name="provider" value="google" />
        {next && <input type="hidden" name="next" value={next} />}
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2.5 rounded-card border border-line bg-surface px-4 py-2.5 font-medium text-ink transition-colors hover:bg-surface-alt"
        >
          <Google className="size-5 shrink-0" />
          Continue with Google
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-ink-faint">
        <span className="h-px flex-1 bg-line" />
        or use your email
        <span className="h-px flex-1 bg-line" />
      </div>
      </>
      )}

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
