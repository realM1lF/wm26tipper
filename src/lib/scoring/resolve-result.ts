import { isKnockoutStage } from "@/lib/sync/team-map";

export type DecidedBy = "regulation" | "extra_time" | "penalties";

export type ScoringFields = {
  scoring_home: number | null;
  scoring_away: number | null;
  decided_by: DecidedBy | null;
  pen_home: number | null;
  pen_away: number | null;
};

type Input = {
  stage: string;
  status: "scheduled" | "live" | "finished";
  home_score: number | null;
  away_score: number | null;
  live_elapsed?: string | null;
  existing?: Partial<ScoringFields> | null;
};

function parsePenaltyFromElapsed(elapsed: string | null | undefined): {
  pen_home: number | null;
  pen_away: number | null;
} {
  if (!elapsed) return { pen_home: null, pen_away: null };
  // e.g. "penalties 4-5" or "PEN 4-5"
  const match = elapsed.match(/pen(?:alties|alty)?\s*(\d+)\s*[-:]\s*(\d+)/i);
  if (!match) return { pen_home: null, pen_away: null };
  return { pen_home: parseInt(match[1]!, 10), pen_away: parseInt(match[2]!, 10) };
}

function isExtraTime(elapsed: string | null | undefined): boolean {
  if (!elapsed) return false;
  return /^(ET|extra|1st extra|2nd extra)/i.test(elapsed.trim());
}

/** Derive scoring basis: group = 90 min; KO = 120 min; penalties stored separately */
export function resolveScoringResult(input: Input): ScoringFields {
  const { stage, status, home_score, away_score, live_elapsed, existing } = input;

  if (status !== "finished" || home_score == null || away_score == null) {
    return {
      scoring_home: null,
      scoring_away: null,
      decided_by: null,
      pen_home: null,
      pen_away: null,
    };
  }

  const parsedPen = parsePenaltyFromElapsed(live_elapsed);
  const pen_home = parsedPen.pen_home ?? existing?.pen_home ?? null;
  const pen_away = parsedPen.pen_away ?? existing?.pen_away ?? null;

  if (!isKnockoutStage(stage)) {
    return {
      scoring_home: home_score,
      scoring_away: away_score,
      decided_by: "regulation",
      pen_home: null,
      pen_away: null,
    };
  }

  // KO: penalties if draw after 120 min (heuristic when API lacks pen fields)
  const wentToPenalties =
    pen_home != null && pen_away != null && pen_home !== pen_away
      ? true
      : home_score === away_score;

  if (wentToPenalties) {
    return {
      scoring_home: home_score,
      scoring_away: away_score,
      decided_by: "penalties",
      pen_home,
      pen_away,
    };
  }

  const decided_by: DecidedBy = isExtraTime(live_elapsed)
    ? "extra_time"
    : "regulation";

  return {
    scoring_home: home_score,
    scoring_away: away_score,
    decided_by,
    pen_home: null,
    pen_away: null,
  };
}

export function getScoringPair(match: {
  scoring_home?: number | null;
  scoring_away?: number | null;
  home_score?: number | null;
  away_score?: number | null;
}): { home: number; away: number } | null {
  const home = match.scoring_home ?? match.home_score;
  const away = match.scoring_away ?? match.away_score;
  if (home == null || away == null) return null;
  return { home, away };
}
