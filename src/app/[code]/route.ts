import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

// This handles GET requests to any short path, e.g. https://yoursite.com/aZ3kLQ9
// It looks up the original URL, logs the click (fire-and-forget style but awaited
// so we know it succeeded), and redirects the visitor.
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  const code = params.code;

  const rows = await sql`
    SELECT id, original_url FROM links WHERE short_code = ${code}
  `;
  const link = rows[0] as { id: number; original_url: string } | undefined;

  if (!link) {
    return NextResponse.redirect(new URL(`/?notfound=${code}`, request.url));
  }

  const referrer = request.headers.get("referer") ?? null;
  const userAgent = request.headers.get("user-agent") ?? null;

  // Log the click. We await this so the dashboard's next poll is guaranteed
  // to see it, but it's a single fast INSERT so it barely adds latency.
  await sql`
    INSERT INTO clicks (link_id, referrer, user_agent)
    VALUES (${link.id}, ${referrer}, ${userAgent})
  `;

  return NextResponse.redirect(link.original_url);
}
