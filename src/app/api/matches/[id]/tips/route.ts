import { createClient } from "@/lib/supabase/server";
import { getScoringPair } from "@/lib/scoring/resolve-result";
import { calculatePoints } from "@/lib/scoring/calculatePoints";
import { formatResultDisplay } from "@/lib/utils";

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

  const isFinished = match.status === "finished";
  const scoring = getScoringPair(match);
  const matchResult =
    isFinished && scoring ? { home: scoring.home, away: scoring.away } : null;
  const resultDisplay = isFinished ? formatResultDisplay(match) : null;

  const { data: myTip } = await supabase
    .from("tips")
    .select("id")
    .eq("match_id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myTip) {
    return Response.json({
      unlocked: false,
      isFinished,
      tips: [],
      matchResult: null,
      resultDisplay: null,
    });
  }

  const { data: tips } = await supabase
    .from("tips")
    .select("*, profiles(*)")
    .eq("match_id", id);

  const { data: ledger } = await supabase
    .from("points_ledger")
    .select("user_id, points, breakdown")
    .eq("match_id", id);

  const ledgerMap = new Map(
    ledger?.map((p) => [p.user_id, { points: p.points, breakdown: p.breakdown }]) ?? [],
  );

  const mappedTips = (tips ?? []).map((t) => {
    const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
    const entry = ledgerMap.get(t.user_id);

    let points: number | null = entry?.points ?? null;
    let breakdown: string | null = entry?.breakdown ?? null;

    if (matchResult && points == null) {
      const calc = calculatePoints(
        { home: t.home_score, away: t.away_score },
        matchResult,
      );
      points = calc.points;
      breakdown = calc.breakdown;
    }

    return {
      id: t.id,
      user_id: t.user_id,
      home_score: t.home_score,
      away_score: t.away_score,
      profile,
      points,
      breakdown,
    };
  });

  mappedTips.sort((a, b) => {
    const pa = a.points ?? -1;
    const pb = b.points ?? -1;
    if (pb !== pa) return pb - pa;
    const na = a.profile?.display_name ?? "";
    const nb = b.profile?.display_name ?? "";
    return na.localeCompare(nb, "de");
  });

  return Response.json({
    unlocked: true,
    isFinished,
    tips: mappedTips,
    matchResult,
    resultDisplay,
  });
}
