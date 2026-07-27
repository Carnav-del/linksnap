import { neon, NeonQueryFunction } from "@neondatabase/serverless";

// This creates a SQL query function using Neon's HTTP driver.
// It works in both regular Node.js API routes AND Edge runtime routes,
// which is why we use it instead of Prisma or better-sqlite3 (those need
// native binaries that don't work in serverless/edge environments).
//
// Usage: const rows = await sql`SELECT * FROM users WHERE id = ${id}`;
//
// IMPORTANT: this only checks for DATABASE_URL the first time a query
// actually runs (at request time), not when this file is imported. Build
// tools (like Vercel's build step) import every route file just to inspect
// it, even ones that won't run yet — if we checked env vars at import time,
// the build would fail before you'd even had a chance to set them.

let cachedClient: NeonQueryFunction<false, false> | null = null;

function getClient(): NeonQueryFunction<false, false> {
  if (!cachedClient) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set. Add it to your .env.local file (see .env.example), or in your Vercel project's Environment Variables."
      );
    }
    cachedClient = neon(process.env.DATABASE_URL);
  }
  return cachedClient;
}

export const sql: NeonQueryFunction<false, false> = ((...args: Parameters<NeonQueryFunction<false, false>>) =>
  getClient()(...args)) as NeonQueryFunction<false, false>;