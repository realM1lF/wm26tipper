import type { Match } from "@/lib/types";
import { isKnockoutStage } from "@/lib/sync/team-map";

export type TournamentPhase = "group_stage" | "knockout" | "finished";

export function getTournamentPhase(
  matches: Pick<Match, "stage" | "status">[],
): TournamentPhase {
  if (!matches.length) return "group_stage";

  const groupMatches = matches.filter((m) => m.stage === "group");
  const koMatches = matches.filter((m) => isKnockoutStage(m.stage));

  const allGroupDone =
    groupMatches.length > 0 &&
    groupMatches.every((m) => m.status === "finished");

  const allDone = matches.every((m) => m.status === "finished");

  if (allDone) return "finished";
  if (allGroupDone && koMatches.some((m) => m.status !== "finished")) {
    return "knockout";
  }
  if (allGroupDone) return "knockout";
  return "group_stage";
}

export function showGroupsTab(phase: TournamentPhase): boolean {
  return phase === "group_stage" || phase === "knockout";
}

export const KNOCKOUT_STAGES = ["r32", "r16", "qf", "sf", "third", "final"] as const;
