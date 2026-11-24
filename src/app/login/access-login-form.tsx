"use client";

import { type FormEvent, useState } from "react";

interface AccessLoginFormProps {
  passwordConfigured: boolean;
}

export function AccessLoginForm({ passwordConfigured }: AccessLoginFormProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Could not sign in. Try again.");
        return;
      }

      window.location.replace("/");
    } catch {
      setError("Could not reach the sign-in service. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!passwordConfigured) {
    return (
      <div
        role="status"
        className="mt-8 border border-amber-500/30 bg-amber-500/5 p-4 text-sm leading-6 text-ink-secondary"
      >
        Demo access is not configured yet. Set a private
        <code className="mx-1 rounded bg-surface px-1.5 py-0.5 font-mono text-xs text-ink-primary">
          DEMO_ACCESS_PASSWORD
        </code>
        environment variable in Vercel. Use at least 24 characters, then
        redeploy.
      </div>
    );
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
      <label
        htmlFor="access-password"
        className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-muted"
      >
        Shared access password
      </label>
      <input
        id="access-password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={256}
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        className="w-full border border-hairline bg-canvas px-4 py-3 text-sm text-ink-primary outline-none transition placeholder:text-ink-muted focus:border-accent"
        placeholder="Enter the private demo password"
        disabled={isSubmitting}
      />
      {error && (
        <p role="alert" className="text-sm text-red-300">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting || password.length === 0}
        className="w-full bg-accent px-4 py-3 text-sm font-medium text-canvas transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Checking access…" : "Open workspace"}
      </button>
    </form>
  );
}
