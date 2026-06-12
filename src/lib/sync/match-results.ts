import { createClient } from "@supabase/supabase-js";
import { resolveScoringResult, type ScoringFields } from "@/lib/scoring/resolve-result";
import {
  fetchExternalGames,
  mapGameToUpdate,
  type ExternalGame,
} from "./external-api";
import { parseApiKickoff } from "./kickoff";
import { resolveTeamCode } from "./team-map";

function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

export type SyncMetrics = {
  total: number;
  created: number;
  updated: number;
  teamsResolved: number;
  unknownTeams: string[];
};

function buildMatchRow(
  game: ExternalGame,
  existing?: Partial<ScoringFields> | null,
) {
  const homeCode = resolveTeamCode(game.home_team_name_en);
  const awayCode = resolveTeamCode(game.away_team_name_en);
  const kickoffAt = parseApiKickoff(game.local_date);
  const patch = mapGameToUpdate(game, kickoffAt, homeCode, awayCode);

  const scoring =
    patch.status === "finished" &&
    patch.home_score != null &&
    patch.away_score != null
      ? resolveScoringResult({
          stage: patch.stage,
          status: patch.status,
          home_score: patch.home_score,
          away_score: patch.away_score,
          live_elapsed: patch.live_elapsed,
          existing,
        })
      : {
          scoring_home: null,
          scoring_away: null,
          decided_by: null,
          pen_home: null,
          pen_away: null,
        };

  return { patch, homeCode, awayCode, scoring };
}

export async function syncMatchResults(): Promise<SyncMetrics> {
  const supabase = createServiceClient();
  const games = await fetchExternalGames();
  const metrics: SyncMetrics = {
    total: games.length,
    created: 0,
    updated: 0,
    teamsResolved: 0,
    unknownTeams: [],
  };

  for (const game of games) {
    const fifaId = parseInt(game.id, 10);
    if (!fifaId) continue;

    const { data: existing } = await supabase
      .from("matches")
      .select(
        "id, status, home_score, away_score, scoring_home, scoring_away, decided_by, pen_home, pen_away",
      )
      .eq("fifa_match_id", fifaId)
      .maybeSingle();

    const { patch, homeCode, awayCode, scoring } = buildMatchRow(game, existing);

    if (homeCode && awayCode) metrics.teamsResolved++;
    if (game.home_team_name_en && !homeCode) {
      metrics.unknownTeams.push(game.home_team_name_en);
    }
    if (game.away_team_name_en && !awayCode) {
      metrics.unknownTeams.push(game.away_team_name_en);
    }

    const row = {
      ...patch,
      ...scoring,
    };

    const { error } = await supabase.from("matches").upsert(row, {
      onConflict: "fifa_match_id",
    });

    if (error) throw new Error(error.message);

    if (existing) metrics.updated++;
    else metrics.created++;
  }

  metrics.unknownTeams = [...new Set(metrics.unknownTeams)];
  return metrics;
}

export async function syncSingleMatch(fifaMatchId: number) {
  const supabase = createServiceClient();
  const games = await fetchExternalGames();
  const game = games.find((g) => parseInt(g.id, 10) === fifaMatchId);
  if (!game) return null;

  const { data: existing } = await supabase
    .from("matches")
    .select("*")
    .eq("fifa_match_id", fifaMatchId)
    .maybeSingle();

  const { patch, scoring } = buildMatchRow(game, existing);

  const row = { ...patch, ...scoring };

  const { data, error } = await supabase
    .from("matches")
    .upsert(row, { onConflict: "fifa_match_id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
