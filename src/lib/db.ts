import { neon } from "@neondatabase/serverless";

// This creates a SQL query function using Neon's HTTP driver.
// It works in both regular Node.js API routes AND Edge runtime routes,
// which is why we use it instead of Prisma or better-sqlite3 (those need
// native binaries that don't work in serverless/edge environments).
//
// Usage: const rows = await sql`SELECT * FROM users WHERE id = ${id}`;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your .env.local file (see .env.example)."
  );
}

export const sql = neon(process.env.DATABASE_URL);
