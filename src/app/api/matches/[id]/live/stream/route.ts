import { createClient } from "@/lib/supabase/server";
import { syncSingleMatch } from "@/lib/sync/match-results";
import { isTipLocked } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function fetchLivePayload(matchId: string, userId: string) {
  const supabase = await createClient();

  let { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", matchId)
    .single();

  if (!match) return null;

  const kickoffPassed = isTipLocked(match.kickoff_at);
  if (match.fifa_match_id && match.status !== "finished" && kickoffPassed) {
    try {
      const updated = await syncSingleMatch(match.fifa_match_id);
      if (updated) match = updated;
    } catch {
      // DB-Fallback
    }
  }

  const { data: points } = await supabase
    .from("points_ledger")
    .select("points, breakdown")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    status: match.status as "scheduled" | "live" | "finished",
    home_score: match.home_score,
    away_score: match.away_score,
    decided_by: match.decided_by,
    pen_home: match.pen_home,
    pen_away: match.pen_away,
    live_elapsed: match.live_elapsed,
    kickoff_at: match.kickoff_at,
    points: points?.points ?? null,
    breakdown: points?.breakdown ?? null,
    locked: kickoffPassed,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        const payload = await fetchLivePayload(id, user.id);
        if (!payload) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "not_found" })}\n\n`),
          );
          controller.close();
          return false;
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`),
        );

        return payload.status !== "finished";
      };

      let keepRunning = await send();

      const interval = setInterval(async () => {
        if (!keepRunning) return;
        keepRunning = await send();
        if (!keepRunning) {
          clearInterval(interval);
          controller.close();
        }
      }, 10_000);

      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
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
