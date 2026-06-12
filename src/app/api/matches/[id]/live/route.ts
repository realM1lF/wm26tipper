import { createClient } from "@/lib/supabase/server";
import { syncSingleMatch } from "@/lib/sync/match-results";
import { getScoringPair } from "@/lib/scoring/resolve-result";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .single();

  if (!match) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const kickoffPassed = new Date(match.kickoff_at) <= new Date();
  if (
    match.fifa_match_id &&
    match.status !== "finished" &&
    kickoffPassed
  ) {
    try {
      const updated = await syncSingleMatch(match.fifa_match_id);
      if (updated) match = updated;
    } catch {
      // Fallback auf DB-Stand
    }
  }

  const { data: points } = await supabase
    .from("points_ledger")
    .select("points, breakdown")
    .eq("match_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  return Response.json({
    status: match.status,
    home_score: match.home_score,
    away_score: match.away_score,
    scoring_home: match.scoring_home,
    scoring_away: match.scoring_away,
    decided_by: match.decided_by,
    pen_home: match.pen_home,
    pen_away: match.pen_away,
    live_elapsed: match.live_elapsed,
    kickoff_at: match.kickoff_at,
    points: points?.points ?? null,
    breakdown: points?.breakdown ?? null,
    locked: kickoffPassed,
    scoring: getScoringPair(match),
  });
}
