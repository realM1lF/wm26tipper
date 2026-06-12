import type { GroupStanding, GroupStandingRow } from "@/lib/groups/standings";

const GROUPS_API = "https://worldcup26.ir/get/groups";
const TEAMS_API = "https://worldcup26.ir/get/teams";

type ApiGroupTeam = {
  team_id: string;
  mp: string;
  w: string;
  l: string;
  d: string;
  pts: string;
  gf: string;
  ga: string;
  gd: string;
};

type ApiGroup = {
  name: string;
  teams: ApiGroupTeam[];
};

type ApiTeam = {
  id: string;
  name_en: string;
  flag_emoji?: string;
  fifa_code: string;
  groups: string;
};

const FLAG_BY_CODE: Record<string, string> = {
  MEX: "🇲🇽", RSA: "🇿🇦", KOR: "🇰🇷", CZE: "🇨🇿", CAN: "🇨🇦", BIH: "🇧🇦",
  QAT: "🇶🇦", SUI: "🇨🇭", BRA: "🇧🇷", MAR: "🇲🇦", HAI: "🇭🇹", SCO: "🏴",
  USA: "🇺🇸", PAR: "🇵🇾", AUS: "🇦🇺", TUR: "🇹🇷", GER: "🇩🇪", CUW: "🇨🇼",
  CIV: "🇨🇮", ECU: "🇪🇨", NED: "🇳🇱", JPN: "🇯🇵", SWE: "🇸🇪", TUN: "🇹🇳",
  BEL: "🇧🇪", EGY: "🇪🇬", IRN: "🇮🇷", NZL: "🇳🇿", ESP: "🇪🇸", CPV: "🇨🇻",
  KSA: "🇸🇦", URU: "🇺🇾", FRA: "🇫🇷", SEN: "🇸🇳", IRQ: "🇮🇶", NOR: "🇳🇴",
  ARG: "🇦🇷", ALG: "🇩🇿", AUT: "🇦🇹", JOR: "🇯🇴", POR: "🇵🇹", COD: "🇨🇩",
  UZB: "🇺🇿", COL: "🇨🇴", ENG: "🏴", CRO: "🇭🇷", GHA: "🇬🇭", PAN: "🇵🇦",
};

export async function fetchExternalGroupStandings(): Promise<GroupStanding[]> {
  const [groupsRes, teamsRes] = await Promise.all([
    fetch(GROUPS_API, { next: { revalidate: 300 } }),
    fetch(TEAMS_API, { next: { revalidate: 3600 } }),
  ]);

  if (!groupsRes.ok || !teamsRes.ok) return [];

  const groupsData = (await groupsRes.json()) as { groups: ApiGroup[] };
  const teamsData = (await teamsRes.json()) as { teams: ApiTeam[] };

  const teamById = new Map(teamsData.teams.map((t) => [t.id, t]));

  return groupsData.groups
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((group) => ({
      group: group.name,
      rows: group.teams
        .map((row): GroupStandingRow => {
          const team = teamById.get(row.team_id);
          const code = team?.fifa_code ?? row.team_id;
          return {
            code,
            name: team?.name_en ?? code,
            flag_emoji: FLAG_BY_CODE[code] ?? "⚽",
            played: parseInt(row.mp, 10) || 0,
            won: parseInt(row.w, 10) || 0,
            drawn: parseInt(row.d, 10) || 0,
            lost: parseInt(row.l, 10) || 0,
            goalsFor: parseInt(row.gf, 10) || 0,
            goalsAgainst: parseInt(row.ga, 10) || 0,
            goalDiff: parseInt(row.gd, 10) || 0,
            points: parseInt(row.pts, 10) || 0,
          };
        })
        .sort(
          (a, b) =>
            b.points - a.points ||
            b.goalDiff - a.goalDiff ||
            b.goalsFor - a.goalsFor,
        ),
    }));
}
