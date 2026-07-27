# LinkSnap

A URL shortener with a live click-analytics dashboard.

- **Create short links**: paste a long URL, get back a random 7-character base62 code.
- **Redirect + log**: visiting `/<code>` redirects to the original URL and records a click (timestamp, referrer, user agent).
- **Live dashboard**: `/dashboard` shows your links and click counts updating on their own via Server-Sent Events (SSE) — no page refresh.
- **Auth**: email + password (bcryptjs + JWT in an httpOnly cookie), so you only ever see your own links.
- **Rate limiting**: max 20 new links per user per hour, enforced in the database — no extra services needed.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS, Postgres via `@neondatabase/serverless` (no Prisma, no native binaries), deployed on Vercel.

## Setup

See the step-by-step guide from Claude for exact commands. Short version:

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` and `JWT_SECRET`.
3. Run `sql/schema.sql` against your Neon database once.
4. `npm run dev`
