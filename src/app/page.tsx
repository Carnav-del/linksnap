import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-24">
      <p className="font-mono text-sm uppercase tracking-[0.3em] text-accent">
        LinkSnap
      </p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight text-white sm:text-5xl">
        Shorten a link.
        <br />
        Watch the clicks land <span className="text-accent2">live</span>.
      </h1>
      <p className="mt-5 max-w-xl text-lg text-white/60">
        Paste any URL, get a short code back, and watch a dashboard update in
        real time every time someone opens it — no refresh needed.
      </p>

      <div className="mt-10 flex gap-4">
        <Link
          href="/register"
          className="rounded-lg bg-accent px-5 py-3 font-medium text-ink transition hover:brightness-110"
        >
          Create an account
        </Link>
        <Link
          href="/login"
          className="rounded-lg border border-line px-5 py-3 font-medium text-white/80 transition hover:border-white/40"
        >
          Sign in
        </Link>
      </div>

      <div className="mt-16 grid gap-4 border-t border-line pt-8 sm:grid-cols-3">
        <Feature label="Base62 short codes" text="Random, collision-checked, 7 characters long." />
        <Feature label="Live dashboard" text="Server-sent events push new click counts to the page." />
        <Feature label="Per-account links" text="You only ever see the links you created." />
      </div>
    </main>
  );
}

function Feature({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-wider text-accent2">
        {label}
      </p>
      <p className="mt-1 text-sm text-white/60">{text}</p>
    </div>
  );
}
