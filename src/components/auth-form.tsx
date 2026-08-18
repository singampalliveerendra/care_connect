"use client";

import { useActionState, useState } from "react";

import { signIn, signUp, type ActionState } from "@/app/provider/actions";

const fieldClass =
  "w-full rounded-card border border-line bg-surface px-3 py-2.5 text-ink";

export function AuthForm({ next, defaultMode = "signin" }: { next?: string; defaultMode?: "signin" | "signup" }) {
  const [mode, setMode] = useState<"signin" | "signup">(defaultMode);
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

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
          {state.fieldErrors?.password && (
            <span className="mt-1 block text-xs text-danger-500">
              {state.fieldErrors.password}
            </span>
          )}
        </label>

        {state.error && (
          <p role="alert" className="rounded-card bg-danger-100 px-3 py-2 text-sm text-danger-500">
            {state.error}
          </p>
        )}

        {state.notice && (
          <p className="rounded-card bg-accent-100 px-3 py-2 text-sm text-ink-soft">
            {state.notice}
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
