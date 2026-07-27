"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type LinkRow = {
  id: number;
  short_code: string;
  original_url: string;
  created_at: string;
  click_count: number;
  last_click_at?: string | null;
};

export default function DashboardClient() {
  const router = useRouter();
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_BASE_URL ?? "";

  // Load the initial list of links.
  useEffect(() => {
    fetch("/api/links")
      .then((res) => res.json())
      .then((data) => setLinks(data.links ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Subscribe to live click-count updates. EventSource automatically
  // reconnects on its own if the connection drops, so we don't need to
  // handle that ourselves.
  const esRef = useRef<EventSource | null>(null);
  useEffect(() => {
    const es = new EventSource("/api/links/stream");
    esRef.current = es;

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.addEventListener("update", (event) => {
      setConnected(true);
      const payload = JSON.parse((event as MessageEvent).data) as {
        links: { id: number; click_count: number; last_click_at: string | null }[];
      };
      setLinks((current) => {
        const updates = new Map(payload.links.map((l) => [l.id, l]));
        return current.map((link) => {
          const u = updates.get(link.id);
          return u
            ? { ...link, click_count: u.click_count, last_click_at: u.last_click_at }
            : link;
        });
      });
    });

    return () => es.close();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await fetch("/api/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setLinks((current) => [data.link, ...current]);
      setUrl("");
    } finally {
      setCreating(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function copyShortLink(id: number, code: string) {
    navigator.clipboard.writeText(`${baseUrl}/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Your links</h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/50">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connected ? "bg-accent" : "bg-warn"
              }`}
            />
            {connected ? "Live" : "Reconnecting…"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg border border-line px-3 py-1.5 text-sm text-white/70 hover:border-white/40"
        >
          Sign out
        </button>
      </div>

      <form onSubmit={handleCreate} className="mt-8 flex gap-3">
        <input
          type="url"
          required
          placeholder="https://example.com/some/very/long/url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-lg border border-line bg-panel px-3 py-2.5 text-white outline-none focus:border-accent2"
        />
        <button
          type="submit"
          disabled={creating}
          className="rounded-lg bg-accent px-5 py-2.5 font-medium text-ink transition hover:brightness-110 disabled:opacity-50"
        >
          {creating ? "Shortening…" : "Shorten"}
        </button>
      </form>
      {error && <p className="mt-2 text-sm text-warn">{error}</p>}

      <div className="mt-10">
        {loading ? (
          <p className="text-sm text-white/50">Loading your links…</p>
        ) : links.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-white/50">
            No links yet. Paste a URL above to create your first short link.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {links.map((link) => (
              <li
                key={link.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-line bg-panel px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-accent2">
                      /{link.short_code}
                    </span>
                    <button
                      onClick={() => copyShortLink(link.id, link.short_code)}
                      className="text-xs text-white/40 hover:text-white/70"
                    >
                      {copiedId === link.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-white/50">
                    {link.original_url}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-2xl font-semibold tabular-nums text-white">
                    {link.click_count}
                  </p>
                  <p className="text-xs text-white/40">
                    {link.click_count === 1 ? "click" : "clicks"}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
