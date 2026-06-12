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
  existing?: Partial<ScoringFields> & {
    live_elapsed?: string | null;
    home_team_label?: string | null;
    away_team_label?: string | null;
  } | null,
) {
  const homeCode = resolveTeamCode(game.home_team_name_en);
  const awayCode = resolveTeamCode(game.away_team_name_en);
  const kickoffAt = parseApiKickoff(game.local_date);
  const patch = mapGameToUpdate(game, kickoffAt, homeCode, awayCode);

  if (!patch.home_team_label && existing?.home_team_label) {
    patch.home_team_label = existing.home_team_label;
  }
  if (!patch.away_team_label && existing?.away_team_label) {
    patch.away_team_label = existing.away_team_label;
  }

  const elapsedForScoring =
    patch.status === "finished" &&
    (patch.live_elapsed === "FT" || patch.live_elapsed === "finished") &&
    existing?.live_elapsed &&
    !/^ft$/i.test(existing.live_elapsed.trim())
      ? existing.live_elapsed
      : patch.live_elapsed;

  const scoring =
    patch.status === "finished" &&
    patch.home_score != null &&
    patch.away_score != null
      ? resolveScoringResult({
          stage: patch.stage,
          status: patch.status,
          home_score: patch.home_score,
          away_score: patch.away_score,
          live_elapsed: elapsedForScoring,
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
        "id, status, home_score, away_score, scoring_home, scoring_away, decided_by, pen_home, pen_away, live_elapsed, home_team_label, away_team_label",
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
