"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import type { MatchWithTeams, Tip } from "@/lib/types";
import {
  formatKickoff,
  formatCountdownToKickoff,
  formatResultDisplay,
  isKnockoutMatch,
  matchHeaderLabel,
  cn,
} from "@/lib/utils";
import { matchTeamsReady } from "@/lib/utils";
import { useKickoffLock } from "@/hooks/useKickoffLock";
import { ScoreStepper } from "./ScoreStepper";
import { Button } from "@/components/ui/Button";
import { LiveTicket } from "./LiveTicket";

type Props = {
  match: MatchWithTeams;
  myTip?: Tip | null;
  onSubmit: (home: number, away: number) => Promise<void>;
  loading?: boolean;
  compact?: boolean;
};

export function MatchTicket({
  match,
  myTip,
  onSubmit,
  loading,
  compact,
}: Props) {
  const locked = useKickoffLock(match.kickoff_at);
  const teamsReady = matchTeamsReady(match);
  const canTip = teamsReady && !locked;
  const [home, setHome] = useState(myTip?.home_score ?? 0);
  const [away, setAway] = useState(myTip?.away_score ?? 0);
  const hasTip = !!myTip;
  const showLive =
    !compact &&
    (locked || match.status === "live" || match.status === "finished");

  useEffect(() => {
    setHome(myTip?.home_score ?? 0);
    setAway(myTip?.away_score ?? 0);
  }, [myTip?.home_score, myTip?.away_score]);

  const ticketSerial = match.fifa_match_id
    ? `#${String(match.fifa_match_id).padStart(3, "0")}`
    : null;

  const resultLine = formatResultDisplay(match);

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "ticket-stub relative overflow-hidden rounded-xl border border-chalk/10 bg-pitch-night/80 backdrop-blur-sm",
        compact ? "p-4" : "p-6",
        locked && !hasTip && teamsReady && "ticket-void",
        match.status === "live" && "live-ticket-border",
      )}
    >
      <div className="ticket-perforation absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-floodlight/60 to-transparent" />

      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-floodlight/80">
            {matchHeaderLabel(match)}
          </p>
          <p className="mt-1 text-xs text-chalk/50">
            {formatKickoff(match.kickoff_at)} ·{" "}
            {locked ? "Anstoß war" : formatCountdownToKickoff(match.kickoff_at)}
          </p>
          {isKnockoutMatch(match.stage) && teamsReady && !locked && (
            <p className="mt-1 text-[10px] text-chalk/35">
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

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <TeamBlock
          team={match.home_team}
          label={match.home_team_label}
          align="left"
        />
        {!compact && canTip ? (
          <div className="flex items-center gap-4 px-2">
            <ScoreStepper value={home} onChange={setHome} disabled={!canTip} />
            <span className="font-display text-2xl text-chalk/30">:</span>
            <ScoreStepper value={away} onChange={setAway} disabled={!canTip} />
          </div>
        ) : (
          <div className="font-display text-center text-3xl font-bold tabular-nums text-chalk">
            {hasTip ? (
              <span>
                {myTip!.home_score}
                <span className="mx-1 text-chalk/30">:</span>
                {myTip!.away_score}
              </span>
            ) : match.status === "finished" && resultLine ? (
              <span className="text-2xl">{resultLine}</span>
            ) : (
              <span className="text-chalk/30">– : –</span>
            )}
          </div>
        )}
        <TeamBlock
          team={match.away_team}
          label={match.away_team_label}
          align="right"
        />
      </div>

      {!teamsReady && !locked && (
        <p className="mt-4 rounded-lg border border-dashed border-chalk/10 bg-white/[0.02] px-3 py-2 text-center text-xs text-chalk/45">
          Teams stehen noch fest — Tippen ab Bekanntgabe der Paarung
        </p>
      )}

      {!compact && canTip && (
        <footer className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-chalk/40">
            {hasTip
              ? "Tipp gespeichert — änderbar bis Anstoß"
              : "Tipps der anderen siehst du nach Bestätigung"}
          </p>
          <Button
            onClick={() => onSubmit(home, away)}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {hasTip ? "Tipp aktualisieren" : "Tipp bestätigen"}
          </Button>
        </footer>
      )}

      {!compact && locked && !hasTip && match.status !== "finished" && teamsReady && (
        <footer className="mt-6 text-center text-xs text-signal/80">
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

      {compact && (
        <footer className="mt-3">
          <Link
            href={`/matches/${match.id}`}
            className="text-xs font-medium text-floodlight hover:underline"
          >
            {!teamsReady
              ? "Paarung ansehen →"
              : locked
                ? "Live verfolgen →"
                : hasTip
                  ? "Details & Freunde-Tipps →"
                  : "Jetzt tippen →"}
          </Link>
        </footer>
      )}
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
    <div className={cn("flex flex-col gap-1", align === "right" && "items-end text-right")}>
      <span className="text-2xl">{team?.flag_emoji ?? "⚽"}</span>
      <span className="font-display text-sm font-semibold uppercase tracking-wide text-chalk">
        {team?.name ?? label ?? "TBD"}
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
      <span className="rounded-full bg-chalk/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-chalk/60">
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
    <span className="rounded-full bg-floodlight/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-floodlight">
      Tippen
    </span>
  );
}
