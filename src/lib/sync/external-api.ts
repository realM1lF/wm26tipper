const API_URL = "https://worldcup26.ir/get/games";

export type ExternalGame = {
  id: string;
  home_team_name_en?: string;
  away_team_name_en?: string;
  home_team_label?: string;
  away_team_label?: string;
  home_score: string;
  away_score: string;
  finished: string;
  time_elapsed: string;
  group: string;
  type: string;
  local_date: string;
};

export type ExternalGamesResponse = {
  games: ExternalGame[];
};

export async function fetchExternalGames(): Promise<ExternalGame[]> {
  const res = await fetch(API_URL, {
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`worldcup26.ir: ${res.status}`);
  const data = (await res.json()) as ExternalGamesResponse;
  return data.games ?? [];
}

export function parseExternalStatus(game: ExternalGame): {
  status: "scheduled" | "live" | "finished";
  liveElapsed: string | null;
} {
  if (game.finished === "TRUE" || game.time_elapsed === "finished") {
    return { status: "finished", liveElapsed: "FT" };
  }
  const elapsed = game.time_elapsed?.trim() ?? "";
  if (elapsed && elapsed !== "notstarted") {
    return { status: "live", liveElapsed: elapsed };
  }
  return { status: "scheduled", liveElapsed: null };
}

export function parseExternalScore(value: string): number {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

export type SyncUpdate = {
  fifa_match_id: number;
  external_game_id: string;
  home_team_code: string | null;
  away_team_code: string | null;
  home_team_label: string | null;
  away_team_label: string | null;
  kickoff_at: string;
  stage: string;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished";
  live_elapsed: string | null;
};

export function mapGameToUpdate(
  game: ExternalGame,
  kickoffAt: string,
  homeCode: string | null,
  awayCode: string | null,
): SyncUpdate {
  const { status, liveElapsed } = parseExternalStatus(game);
  const homeScore = parseExternalScore(game.home_score);
  const awayScore = parseExternalScore(game.away_score);
  const isFinished = status === "finished";

  return {
    fifa_match_id: parseInt(game.id, 10),
    external_game_id: game.id,
    home_team_code: homeCode,
    away_team_code: awayCode,
    home_team_label: game.home_team_label ?? null,
    away_team_label: game.away_team_label ?? null,
    kickoff_at: kickoffAt,
    stage: game.type,
    group_name: game.type === "group" ? game.group : null,
    home_score: isFinished || status === "live" ? homeScore : null,
    away_score: isFinished || status === "live" ? awayScore : null,
    status,
    live_elapsed: liveElapsed,
  };
}
