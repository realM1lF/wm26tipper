"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { MatchWithTeams, Tip } from "@/lib/types";
import type { GroupStanding } from "@/lib/groups/standings";
import type { TournamentPhase } from "@/lib/tournament/phase";
import { KNOCKOUT_STAGES } from "@/lib/tournament/phase";
import {
  isMatchLiveOrPending,
  isTipLocked,
  matchTeamsReady,
  sortMatchesByPriority,
  stageLabel,
  cn,
} from "@/lib/utils";
import { MatchTicketClient } from "@/components/match/MatchTicketClient";
import { MatchdayTimeline } from "@/components/matches/MatchdayTimeline";
import { GroupTableGrid } from "@/components/groups/GroupTable";

type Props = {
  matches: MatchWithTeams[];
  tips: Tip[];
  phase: TournamentPhase;
  groupStandings: GroupStanding[];
  filter?: string;
  view?: string;
  stage?: string;
};

export function MatchesView({
  matches,
  tips,
  phase,
  groupStandings,
  filter,
  view,
  stage,
}: Props) {
  const tipMap = useMemo(
    () => new Map(tips.map((t) => [t.match_id, t])),
    [tips],
  );

  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  let filtered = matches;

  if (filter === "open") {
    filtered = matches.filter(
      (m) =>
        matchTeamsReady(m) &&
        !tipMap.has(m.id) &&
        !isTipLocked(m.kickoff_at) &&
        m.status !== "finished",
    );
  } else if (filter === "tipped") {
    filtered = matches.filter((m) => tipMap.has(m.id));
  } else if (filter === "finished") {
    filtered = matches.filter((m) => m.status === "finished");
  } else if (filter === "live") {
    filtered = matches.filter((m) => isMatchLiveOrPending(m));
  } else if (filter === "relevant" || !filter) {
    filtered = matches.filter((m) => {
      if (m.status === "live" || isMatchLiveOrPending(m)) return true;
      if (
        matchTeamsReady(m) &&
        !tipMap.has(m.id) &&
        !isTipLocked(m.kickoff_at) &&
        m.status !== "finished"
      ) {
        return true;
      }
      const day = m.kickoff_at.slice(0, 10);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return (
        m.status === "scheduled" &&
        (day === todayKey || day === tomorrow.toISOString().slice(0, 10))
      );
    });
    if (!filter) filtered = sortMatchesByPriority(filtered);
  }

  if (stage) {
    filtered = filtered.filter((m) => m.stage === stage);
  }

  filtered = sortMatchesByPriority(filtered);

  const filters = [
    { key: "relevant", label: "Relevant" },
    { key: "live", label: "Live" },
    { key: "open", label: "Offen" },
    { key: "tipped", label: "Getippt" },
    { key: "finished", label: "Beendet" },
  ];

  const phaseLabel =
    phase === "group_stage"
      ? "Gruppenphase"
      : phase === "knockout"
        ? "K.o.-Runde"
        : "Turnier beendet";

  const showGroups = view === "groups";

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-floodlight/70">
          WM 2026 · {phaseLabel}
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold text-chalk">Spiele</h1>
        <p className="mt-1 text-sm text-chalk/50">
          {matches.length} Spiele · Tippen, Live, Gruppentabellen
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        <ViewTab href="/matches" active={!showGroups && view !== "dates"} label="Übersicht" />
        <ViewTab href="/matches?view=dates" active={view === "dates"} label="Nach Datum" />
        {groupStandings.length > 0 && (
          <ViewTab href="/matches?view=groups" active={showGroups} label="Gruppen" />
        )}
      </div>

      {showGroups ? (
        <GroupTableGrid standings={groupStandings} />
      ) : view === "dates" ? (
        <MatchdayTimeline matches={matches} tips={tips} />
      ) : (
        <>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <Link
                key={f.key}
                href={`/matches?filter=${f.key}${stage ? `&stage=${stage}` : ""}`}
                className={cn(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors",
                  (filter ?? "relevant") === f.key
                    ? "bg-floodlight/20 text-floodlight"
                    : "bg-white/5 text-chalk/60 hover:text-chalk",
                )}
              >
                {f.label}
              </Link>
            ))}
          </div>

          {phase !== "group_stage" && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {KNOCKOUT_STAGES.map((s) => (
                <Link
                  key={s}
                  href={`/matches?filter=${filter ?? "relevant"}&stage=${s}`}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-xs transition-colors",
                    stage === s
                      ? "bg-pitch-line/20 text-pitch-line"
                      : "bg-white/5 text-chalk/50 hover:text-chalk",
                  )}
                >
                  {stageLabel(s)}
                </Link>
              ))}
              {stage && (
                <Link
                  href={`/matches?filter=${filter ?? "relevant"}`}
                  className="shrink-0 rounded-full px-3 py-1 text-xs text-chalk/40 hover:text-chalk"
                >
                  Alle Phasen
                </Link>
              )}
            </div>
          )}

          <div className="space-y-4">
            {filtered.length === 0 ? (
              <p className="py-12 text-center text-sm text-chalk/40">
                Keine Spiele in dieser Ansicht.
              </p>
            ) : (
              filtered.map((match) => (
                <MatchTicketClient
                  key={match.id}
                  match={match}
                  myTip={tipMap.get(match.id) ?? null}
                />
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ViewTab({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-floodlight/15 text-floodlight"
          : "text-chalk/50 hover:bg-white/5 hover:text-chalk",
      )}
    >
      {label}
    </Link>
  );
}
