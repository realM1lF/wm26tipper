import { formatInTimeZone } from "date-fns-tz";
import { formatDistanceToNow, isPast } from "date-fns";
import { de } from "date-fns/locale";
import type { Match } from "@/lib/types";

const BERLIN = "Europe/Berlin";

export function formatKickoff(iso: string) {
  return formatInTimeZone(
    iso,
    BERLIN,
    "EEE, d. MMM · HH:mm 'Uhr'",
    { locale: de },
  );
}

export function formatKickoffShort(iso: string) {
  return formatInTimeZone(iso, BERLIN, "d.M. HH:mm", { locale: de });
}

export function kickoffCountdown(iso: string) {
  const date = new Date(iso);
  if (isPast(date)) return "Anstoß war";
  return `in ${formatDistanceToNow(date, { locale: de })}`;
}

export function formatCountdownToKickoff(iso: string) {
  const target = new Date(iso).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return "Anstoß war";

  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatMatchday(iso: string) {
  return formatInTimeZone(iso, BERLIN, "EEEE, d. MMMM", { locale: de });
}

export function matchdayKey(iso: string) {
  return formatInTimeZone(iso, BERLIN, "yyyy-MM-dd");
}

export function groupMatchesByMatchday<T extends { kickoff_at: string }>(
  matches: T[],
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const match of matches) {
    const key = matchdayKey(match.kickoff_at);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(match);
  }
  return map;
}

export function isMatchLiveOrPending(match: Pick<Match, "status" | "kickoff_at">) {
  return match.status === "live" || (isTipLocked(match.kickoff_at) && match.status !== "finished");
}

export function isTipLocked(kickoffAt: string) {
  return isPast(new Date(kickoffAt));
}

export function stageLabel(stage: string) {
  const labels: Record<string, string> = {
    group: "Gruppenphase",
    r32: "Achtzehntelfinale",
    r16: "Achtelfinale",
    qf: "Viertelfinale",
    sf: "Halbfinale",
    third: "Spiel um Platz 3",
    final: "Finale",
  };
  return labels[stage] ?? stage;
}

export function matchHeaderLabel(match: {
  stage: string;
  group_name?: string | null;
}) {
  if (match.stage === "group" && match.group_name) {
    return `Gruppe ${match.group_name} · Gruppenphase`;
  }
  return stageLabel(match.stage);
}

export function formatResultDisplay(match: {
  home_score: number | null;
  away_score: number | null;
  decided_by?: string | null;
  pen_home?: number | null;
  pen_away?: number | null;
}): string | null {
  if (match.home_score == null || match.away_score == null) return null;
  const base = `${match.home_score}:${match.away_score}`;
  if (
    match.decided_by === "penalties" &&
    match.pen_home != null &&
    match.pen_away != null
  ) {
    return `${base} · ${match.pen_home}:${match.pen_away} i.E.`;
  }
  if (match.decided_by === "penalties") {
    return `${base} · i.E.`;
  }
  if (match.decided_by === "extra_time") {
    return `${base} · n.V.`;
  }
  return base;
}

/** Deutsche Kurzform für K.o.-Platzhalter aus der API */
export function formatTeamPlaceholder(label: string | null | undefined): string | null {
  if (!label?.trim()) return null;
  return label
    .trim()
    .replace(/^Winner Group (.+)$/i, "Sieger Gr. $1")
    .replace(/^Runner-up Group (.+)$/i, "2. Gr. $1")
    .replace(/^3rd Group (.+)$/i, "3. Gr. $1");
}

export function isKnockoutMatch(stage: string) {
  return stage !== "group";
}

export function matchTeamsReady(match: {
  home_team_code?: string | null;
  away_team_code?: string | null;
}): boolean {
  return !!(match.home_team_code && match.away_team_code);
}

export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function sortMatchesByPriority<T extends { status: string; kickoff_at: string }>(
  matches: T[],
): T[] {
  const rank = (m: T) => {
    if (m.status === "live") return 0;
    if (isTipLocked(m.kickoff_at) && m.status !== "finished") return 1;
    if (m.status === "scheduled") return 2;
    return 3;
  };

  return [...matches].sort((a, b) => {
    const diff = rank(a) - rank(b);
    if (diff !== 0) return diff;
    return new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime();
  });
}
