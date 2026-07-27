import { NextRequest } from "next/server";
import { neon } from "@neondatabase/serverless";
import { AUTH_COOKIE_NAME, verifyToken } from "@/lib/auth";

// Edge runtime lets this connection stream data for longer than a normal
// serverless function, and it's required for the @neondatabase/serverless
// driver's fetch-based queries to work smoothly here.
export const runtime = "edge";

// How often we check the database for new clicks and push an update.
// This is "real-time" in the sense that the browser never refreshes and
// numbers update on their own — under the hood it's a short poll running
// on the server, which is the practical way to do live updates against a
// serverless Postgres database without adding a separate pub/sub service.
const POLL_INTERVAL_MS = 2000;

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = token ? await verifyToken(token) : null;

  if (!session) {
    return new Response("Not signed in", { status: 401 });
  }

  const sql = neon(process.env.DATABASE_URL!);
  const userId = session.userId;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (closed) return;
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      async function pushUpdate() {
        try {
          const rows = await sql`
            SELECT
              l.id,
              l.short_code,
              COUNT(c.id)::int AS click_count,
              MAX(c.clicked_at) AS last_click_at
            FROM links l
            LEFT JOIN clicks c ON c.link_id = l.id
            WHERE l.user_id = ${userId}
            GROUP BY l.id
          `;
          send("update", { links: rows, at: new Date().toISOString() });
        } catch (err) {
          send("error", { message: "Failed to fetch updates" });
        }
      }

      // Send an update immediately, then keep polling on an interval.
      await pushUpdate();
      const interval = setInterval(pushUpdate, POLL_INTERVAL_MS);

      // Clean up if the client disconnects (closes the tab, navigates away).
      request.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
