export type Profile = {
  id: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
};

export type Team = {
  code: string;
  name: string;
  flag_emoji: string;
  group_name: string | null;
};

export type DecidedBy = "regulation" | "extra_time" | "penalties";

export type Match = {
  id: string;
  fifa_match_id: number | null;
  home_team_code: string | null;
  away_team_code: string | null;
  home_team_label?: string | null;
  away_team_label?: string | null;
  kickoff_at: string;
  stage: string;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
  scoring_home?: number | null;
  scoring_away?: number | null;
  decided_by?: DecidedBy | null;
  pen_home?: number | null;
  pen_away?: number | null;
  status: "scheduled" | "live" | "finished";
  live_elapsed?: string | null;
  external_game_id?: string | null;
  home_team?: Team | null;
  away_team?: Team | null;
};

export type MatchWithTeams = Match & {
  home_team: Team | null;
  away_team: Team | null;
};

export type Tip = {
  id: string;
  user_id: string;
  match_id: string;
  home_score: number;
  away_score: number;
  submitted_at: string;
  profile?: Profile;
};

export type PointsEntry = {
  id: string;
  user_id: string;
  match_id: string;
  points: number;
  breakdown: string;
};

export type League = {
  id: string;
  name: string;
  invite_code: string;
  created_by: string | null;
};

export type LeagueMember = {
  league_id: string;
  user_id: string;
  role: "admin" | "member";
  profile?: Profile;
};

export type RankingRow = {
  user_id: string;
  display_name: string;
  avatar_color: string;
  total_points: number;
  exact_hits: number;
  matchday_points?: number;
};
