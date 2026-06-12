import { createClient } from "@/lib/supabase/server";
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

  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!match) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const { data: myTip } = await supabase
    .from("tips")
    .select("id")
    .eq("match_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myTip) {
    return Response.json({ unlocked: false, tips: [], matchResult: null });
  }

  const { data: tips } = await supabase
    .from("tips")
    .select("*, profiles(*)")
    .eq("match_id", id);

  const { data: points } = await supabase
    .from("points_ledger")
    .select("*")
    .eq("match_id", id);

  const pointsMap = new Map(points?.map((p) => [p.user_id, p.points]) ?? []);

  const scoring = getScoringPair(match);
  const matchResult =
    match.status === "finished" && scoring
      ? { home: scoring.home, away: scoring.away }
      : null;

  return Response.json({
    unlocked: true,
    tips: (tips ?? []).map((t) => {
      const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
      return {
        id: t.id,
        user_id: t.user_id,
        home_score: t.home_score,
        away_score: t.away_score,
        profile,
        points: pointsMap.get(t.user_id) ?? null,
      };
    }),
    matchResult,
  });
}
