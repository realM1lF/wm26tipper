import { createClient } from "@/lib/supabase/server";
import type { Match, MatchWithTeams, RankingRow, Team, Tip } from "@/lib/types";

function attachTeams<T extends { home_team_code: string | null; away_team_code: string | null }>(
  matches: T[],
  teamMap: Map<string, Team>,
): (T & { home_team: Team | null; away_team: Team | null })[] {
  return matches.map((m) => ({
    ...m,
    home_team: m.home_team_code ? teamMap.get(m.home_team_code) ?? null : null,
    away_team: m.away_team_code ? teamMap.get(m.away_team_code) ?? null : null,
  }));
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function getMembership(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("league_members")
    .select("*, leagues(*)")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function getMatchesWithTeams(): Promise<MatchWithTeams[]> {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("kickoff_at", { ascending: true });

  if (!matches?.length) return [];

  const { data: teams } = await supabase.from("teams").select("*");
  const teamMap = new Map(teams?.map((t) => [t.code, t]) ?? []);

  return attachTeams(matches as Match[], teamMap);
}

export async function getMyTips(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tips")
    .select("*")
    .eq("user_id", userId);
  return data ?? [];
}

export async function getMatchById(id: string): Promise<MatchWithTeams | null> {
  const supabase = await createClient();
  const { data: match } = await supabase
    .from("matches")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!match) return null;

  const codes = [match.home_team_code, match.away_team_code].filter(Boolean) as string[];
  const { data: teams } = codes.length
    ? await supabase.from("teams").select("*").in("code", codes)
    : { data: [] as Team[] };

  const teamMap = new Map(teams?.map((t) => [t.code, t]) ?? []);
  return attachTeams([match as Match], teamMap)[0] ?? null;
}

export async function getTipsForMatch(matchId: string, userId: string) {
  const supabase = await createClient();
  const { data: myTip } = await supabase
    .from("tips")
    .select("*")
    .eq("match_id", matchId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!myTip) return { myTip: null, friendsTips: [], pointsMap: new Map() };

  const { data: tips } = await supabase
    .from("tips")
    .select("*, profiles(*)")
    .eq("match_id", matchId);

  const { data: points } = await supabase
    .from("points_ledger")
    .select("*")
    .eq("match_id", matchId);

  const pointsMap = new Map(points?.map((p) => [p.user_id, p.points]) ?? []);

  return {
    myTip,
    friendsTips: (tips ?? []).map((t) => {
      const profile = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
      return {
        ...t,
        profile,
        points: pointsMap.get(t.user_id),
      };
    }) as (Tip & {
      profile?: { display_name: string; avatar_color: string };
      points?: number;
    })[],
    pointsMap,
  };
}

export async function getRanking(): Promise<RankingRow[]> {
  const supabase = await createClient();

  const { data: members } = await supabase
    .from("league_members")
    .select("user_id, profiles(display_name, avatar_color)");

  if (!members?.length) return [];

  const { data: points } = await supabase.from("points_ledger").select("*");

  const totals = new Map<string, { points: number; exact: number }>();
  for (const m of members) {
    totals.set(m.user_id, { points: 0, exact: 0 });
  }

  for (const p of points ?? []) {
    const t = totals.get(p.user_id);
    if (!t) continue;
    t.points += p.points;
    if (p.breakdown === "Exaktes Ergebnis") {
      t.exact += 1;
    }
  }

  return members
    .map((m) => {
      const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
      return {
        user_id: m.user_id,
        display_name: profile?.display_name ?? "Spieler",
        avatar_color: profile?.avatar_color ?? "#F4C430",
        total_points: totals.get(m.user_id)?.points ?? 0,
        exact_hits: totals.get(m.user_id)?.exact ?? 0,
      };
    })
    .sort((a, b) => b.total_points - a.total_points || b.exact_hits - a.exact_hits);
}
