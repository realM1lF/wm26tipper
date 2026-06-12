import type { Match, Team } from "@/lib/types";

export type GroupStandingRow = {
  code: string;
  name: string;
  flag_emoji: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
};

export type GroupStanding = {
  group: string;
  rows: GroupStandingRow[];
};

export function computeGroupStandings(
  teams: Team[],
  matches: Match[],
): GroupStanding[] {
  const finished = matches.filter(
    (m) => m.stage === "group" && m.status === "finished" && m.group_name,
  );

  const stats = new Map<string, GroupStandingRow>();

  for (const team of teams) {
    if (!team.group_name) continue;
    stats.set(team.code, {
      code: team.code,
      name: team.name,
      flag_emoji: team.flag_emoji,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDiff: 0,
      points: 0,
    });
  }

  for (const match of finished) {
    if (match.home_score == null || match.away_score == null) continue;
    if (!match.home_team_code || !match.away_team_code) continue;

    const home = stats.get(match.home_team_code);
    const away = stats.get(match.away_team_code);
    if (!home || !away) continue;

    home.played++;
    away.played++;
    home.goalsFor += match.home_score;
    home.goalsAgainst += match.away_score;
    away.goalsFor += match.away_score;
    away.goalsAgainst += match.home_score;

    if (match.home_score > match.away_score) {
      home.won++;
      away.lost++;
      home.points += 3;
    } else if (match.home_score < match.away_score) {
      away.won++;
      home.lost++;
      away.points += 3;
    } else {
      home.drawn++;
      away.drawn++;
      home.points += 1;
      away.points += 1;
    }
  }

  for (const row of stats.values()) {
    row.goalDiff = row.goalsFor - row.goalsAgainst;
  }

  const groups = new Map<string, GroupStandingRow[]>();
  for (const team of teams) {
    if (!team.group_name) continue;
    const row = stats.get(team.code);
    if (!row) continue;
    if (!groups.has(team.group_name)) groups.set(team.group_name, []);
    groups.get(team.group_name)!.push(row);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, rows]) => ({
      group,
      rows: rows.sort(
        (a, b) =>
          b.points - a.points ||
          b.goalDiff - a.goalDiff ||
          b.goalsFor - a.goalsFor,
      ),
    }));
}
