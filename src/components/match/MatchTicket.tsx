"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { MatchWithTeams, Tip } from "@/lib/types";
import {
  formatKickoff,
  kickoffCountdown,
  formatResultDisplay,
  formatTeamPlaceholder,
  isKnockoutMatch,
  matchHeaderLabel,
  cn,
} from "@/lib/utils";
import { matchTeamsReady } from "@/lib/utils";
import { useKickoffLock } from "@/hooks/useKickoffLock";
import { ScoreStepper } from "./ScoreStepper";
import { Button } from "@/components/ui/Button";
import { LiveTicket } from "./LiveTicket";
import { FriendsTipsAccordion } from "./FriendsTipsAccordion";

type Props = {
  match: MatchWithTeams;
  myTip?: Tip | null;
  currentUserId: string;
  onSubmit: (home: number, away: number) => Promise<void>;
  loading?: boolean;
  tipRevision?: number;
};

export function MatchTicket({
  match,
  myTip,
  currentUserId,
  onSubmit,
  loading,
  tipRevision = 0,
}: Props) {
  const locked = useKickoffLock(match.kickoff_at);
  const teamsReady = matchTeamsReady(match);
  const canTip = teamsReady && !locked;
  const [home, setHome] = useState(myTip?.home_score ?? 0);
  const [away, setAway] = useState(myTip?.away_score ?? 0);
  const [kickoffLabel, setKickoffLabel] = useState(() =>
    locked ? "Anstoß war" : kickoffCountdown(match.kickoff_at),
  );
  const hasTip = !!myTip;
  const showLive =
    locked || match.status === "live" || match.status === "finished";

  useEffect(() => {
    setHome(myTip?.home_score ?? 0);
    setAway(myTip?.away_score ?? 0);
  }, [myTip?.home_score, myTip?.away_score]);

  useEffect(() => {
    const update = () => {
      setKickoffLabel(
        locked ? "Anstoß war" : kickoffCountdown(match.kickoff_at),
      );
    };
    update();
    if (locked) return;
    const id = window.setInterval(update, 30_000);
    return () => window.clearInterval(id);
  }, [locked, match.kickoff_at]);

  const ticketSerial = match.fifa_match_id
    ? `#${String(match.fifa_match_id).padStart(3, "0")}`
    : null;

  const resultLine = formatResultDisplay(match);

  const scoreArea = canTip ? (
    <div className="flex items-center justify-center gap-2 sm:gap-4 sm:px-2">
      <ScoreStepper value={home} onChange={setHome} disabled={!canTip} />
      <span className="font-display shrink-0 text-xl text-chalk/30 sm:text-2xl">:</span>
      <ScoreStepper value={away} onChange={setAway} disabled={!canTip} />
    </div>
  ) : (
    <div className="font-display text-center text-2xl font-bold tabular-nums text-chalk sm:text-3xl">
      {hasTip ? (
        <span>
          {myTip!.home_score}
          <span className="mx-1 text-chalk/30">:</span>
          {myTip!.away_score}
        </span>
      ) : match.status === "finished" && resultLine ? (
        <span className="text-xl sm:text-2xl">{resultLine}</span>
      ) : (
        <span className="text-chalk/30">– : –</span>
      )}
    </div>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "ticket-stub relative overflow-x-hidden rounded-xl border border-chalk/10 bg-pitch-night/80 backdrop-blur-sm p-4 sm:p-6",
        locked && !hasTip && teamsReady && "ticket-void",
        match.status === "live" && "live-ticket-border",
      )}
    >
      <div className="ticket-perforation absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-floodlight/60 to-transparent" />

      <header className="mb-4 flex items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-floodlight/80">
            {matchHeaderLabel(match)}
          </p>
          <p className="mt-1 text-xs text-chalk/60">{formatKickoff(match.kickoff_at)}</p>
          <p className="mt-0.5 text-[11px] text-chalk/40">
            {locked ? "Anstoß war" : `Anstoß ${kickoffLabel}`}
          </p>
          {isKnockoutMatch(match.stage) && teamsReady && !locked && (
            <p className="mt-1 text-[10px] leading-snug text-chalk/35">
              Wertung nach 90 Min + Verlängerung
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          {ticketSerial && (
            <span className="font-mono text-[10px] tracking-widest text-chalk/20">
              {ticketSerial}
            </span>
          )}
          <StatusBadge match={match} hasTip={hasTip} locked={locked} teamsReady={teamsReady} />
        </div>
      </header>

      <div className="space-y-4 sm:hidden">
        <div className="grid grid-cols-2 gap-2">
          <TeamBlock
            team={match.home_team}
            label={match.home_team_label}
            align="left"
          />
          <TeamBlock
            team={match.away_team}
            label={match.away_team_label}
            align="right"
          />
        </div>
        {scoreArea}
      </div>

      <div className="hidden sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center sm:gap-3">
        <TeamBlock
          team={match.home_team}
          label={match.home_team_label}
          align="left"
        />
        {scoreArea}
        <TeamBlock
          team={match.away_team}
          label={match.away_team_label}
          align="right"
        />
      </div>

      {!teamsReady && !locked && (
        <p className="mt-4 rounded-lg border border-dashed border-chalk/10 bg-white/[0.02] px-3 py-2 text-center text-xs leading-relaxed text-chalk/45">
          Teams stehen noch fest — Tippen ab Bekanntgabe der Paarung
        </p>
      )}

      {canTip && (
        <footer className="mt-5 flex flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-xs leading-relaxed text-chalk/40 sm:text-left">
            {hasTip
              ? "Tipp gespeichert — änderbar bis Anstoß"
              : "Tipps der anderen siehst du nach Bestätigung"}
          </p>
          <Button
            variant={hasTip ? "tipUpdate" : "tip"}
            onClick={() => onSubmit(home, away)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {hasTip ? "Tipp aktualisieren" : "Tipp bestätigen"}
          </Button>
        </footer>
      )}

      {locked && !hasTip && match.status !== "finished" && teamsReady && (
        <footer className="mt-5 text-center text-xs text-signal/80 sm:mt-6">
          Anstoß — Tippen nicht mehr möglich
        </footer>
      )}

      {showLive && teamsReady && (
        <LiveTicket
          matchId={match.id}
          kickoffAt={match.kickoff_at}
          myTip={myTip}
        />
      )}

      <FriendsTipsAccordion
        matchId={match.id}
        currentUserId={currentUserId}
        hasTip={hasTip}
        refreshKey={tipRevision}
      />
    </motion.article>
  );
}

function TeamBlock({
  team,
  label,
  align,
}: {
  team: MatchWithTeams["home_team"];
  label?: string | null;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5 sm:gap-1",
        align === "right" && "items-end text-right",
      )}
    >
      <span className="text-2xl leading-none">{team?.flag_emoji ?? "⚽"}</span>
      <span
        className={cn(
          "font-display w-full text-xs font-semibold uppercase leading-tight tracking-wide text-chalk sm:text-sm",
          align === "right" ? "text-right" : "text-left",
        )}
      >
        <span className="line-clamp-2 break-words">
          {team?.name ?? formatTeamPlaceholder(label) ?? label ?? "TBD"}
        </span>
      </span>
    </div>
  );
}

function StatusBadge({
  match,
  hasTip,
  locked,
  teamsReady,
}: {
  match: MatchWithTeams;
  hasTip: boolean;
  locked: boolean;
  teamsReady: boolean;
}) {
  if (!teamsReady) {
    return (
      <span className="rounded-full bg-chalk/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-chalk/50">
        Offen
      </span>
    );
  }
  if (match.status === "live") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-signal/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-signal">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-signal" />
        Live
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="rounded-full bg-signal/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-signal">
        Beendet
      </span>
    );
  }
  if (locked) {
    return (
      <span className="rounded-full bg-signal/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-signal">
        Gesperrt
      </span>
    );
  }
  if (hasTip) {
    return (
      <span className="rounded-full bg-pitch-line/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-pitch-line">
        Getippt
      </span>
    );
  }
  return (
    <span className="rounded-full bg-tip-open/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-tip-open">
      Tippen
    </span>
  );
}
