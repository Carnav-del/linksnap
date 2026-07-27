import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { AUTH_COOKIE_NAME, verifyToken } from "@/lib/auth";
import { randomShortCode, isValidUrl } from "@/lib/shortcode";

// Middleware already blocks requests with no valid session from reaching
// here, but we still need to read WHO is making the request so we can
// filter/save links by user_id. This re-reads the same cookie.
async function getSession(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

const MAX_LINKS_PER_HOUR = 20;

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const rows = await sql`
    SELECT
      l.id,
      l.short_code,
      l.original_url,
      l.created_at,
      COUNT(c.id)::int AS click_count
    FROM links l
    LEFT JOIN clicks c ON c.link_id = l.id
    WHERE l.user_id = ${session.userId}
    GROUP BY l.id
    ORDER BY l.created_at DESC
  `;

  return NextResponse.json({ links: rows });
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const originalUrl = typeof body?.url === "string" ? body.url.trim() : "";

  if (!originalUrl || !isValidUrl(originalUrl)) {
    return NextResponse.json(
      { error: "Enter a valid http:// or https:// URL" },
      { status: 400 }
    );
  }

  // --- Rate limiting ---
  // Count how many links this user has created in the last hour. This is a
  // simple database-based limiter: no extra infrastructure (like Redis)
  // needed, which keeps the project easy to deploy on Vercel + Neon alone.
  const recent = await sql`
    SELECT COUNT(*)::int AS count
    FROM links
    WHERE user_id = ${session.userId}
      AND created_at > now() - interval '1 hour'
  `;
  const recentCount = (recent[0] as { count: number }).count;

  if (recentCount >= MAX_LINKS_PER_HOUR) {
    return NextResponse.json(
      {
        error: `You've created ${MAX_LINKS_PER_HOUR} links in the last hour. Please wait a bit before creating more.`,
      },
      { status: 429 }
    );
  }

  // --- Generate a unique short code, retrying on the rare collision ---
  let shortCode = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomShortCode();
    const clash = await sql`SELECT 1 FROM links WHERE short_code = ${candidate}`;
    if (clash.length === 0) {
      shortCode = candidate;
      break;
    }
  }
  if (!shortCode) {
    return NextResponse.json(
      { error: "Could not generate a unique short code, please try again" },
      { status: 500 }
    );
  }

  const rows = await sql`
    INSERT INTO links (user_id, short_code, original_url)
    VALUES (${session.userId}, ${shortCode}, ${originalUrl})
    RETURNING id, short_code, original_url, created_at
  `;

  return NextResponse.json({ link: { ...rows[0], click_count: 0 } }, { status: 201 });
}
