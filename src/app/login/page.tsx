import type { Metadata } from "next";
import { isAccessPasswordConfigured } from "@/lib/access-control";
import { AccessLoginForm } from "./access-login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Private demo access — DraftFlow",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  const passwordConfigured = isAccessPasswordConfigured();

  return (
    <main className="flex min-h-screen items-center justify-center bg-canvas px-5 py-12">
      <section className="w-full max-w-md border border-hairline bg-panel p-8 shadow-2xl shadow-black/20 sm:p-10">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center border border-accent/40 bg-accent/10 font-serif text-lg text-accent">
            D
          </div>
          <div>
            <p className="font-serif text-lg leading-none text-ink-primary">
              DraftFlow
            </p>
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-ink-muted">
              Editorial workspace
            </p>
          </div>
        </div>

        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
          Private demo
        </p>
        <h1 className="mt-3 font-serif text-3xl text-ink-primary">
          A quieter place to write.
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink-secondary">
          Enter the shared access password to open this DraftFlow workspace.
        </p>

        <AccessLoginForm passwordConfigured={passwordConfigured} />

        <p className="mt-8 border-t border-hairline pt-5 font-mono text-[10px] leading-5 text-ink-muted">
          Access is limited to invited demo viewers. Sessions expire after 12
          hours.
        </p>
      </section>
    </main>
  );
}
