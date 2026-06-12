"use client";

import { motion } from "framer-motion";
import type { Tip } from "@/lib/types";
import { projectPoints } from "@/lib/scoring";
import { kickoffCountdown, formatResultDisplay, cn } from "@/lib/utils";
import { useLiveMatch } from "@/hooks/useLiveMatch";
import { TensionMeter } from "./TensionMeter";

type Props = {
  matchId: string;
  kickoffAt: string;
  myTip?: Tip | null;
  enabled?: boolean;
};

export function LiveTicket({ matchId, kickoffAt, myTip, enabled = true }: Props) {
  const { data, connected, error } = useLiveMatch(matchId, enabled);

  const status = data?.status ?? "scheduled";
  const isLive = status === "live";
  const isFinished = status === "finished";
  const locked = data?.locked ?? false;

  const liveHome = data?.home_score ?? 0;
  const liveAway = data?.away_score ?? 0;
  const projected =
    myTip && (isLive || locked) && !isFinished
      ? projectPoints(myTip.home_score, myTip.away_score, liveHome, liveAway)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className={cn(
        "mt-4 overflow-hidden rounded-lg border bg-ticket-surface/60",
        isLive ? "live-ticket-border border-signal/30" : "border-chalk/10",
      )}
    >
      {isLive && (
        <div className="live-pulse h-0.5 bg-gradient-to-r from-transparent via-signal to-transparent" />
      )}

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-chalk/40">
            Live-Stand
          </p>

          {!data && !error ? (
            <p className="mt-1 text-xs text-chalk/30">Verbinde…</p>
          ) : error ? (
            <p className="mt-1 text-xs text-signal">{error}</p>
          ) : isLive || (locked && !isFinished) ? (
            <p className="scoreboard mt-1 font-mono text-2xl font-bold tabular-nums text-chalk">
              {liveHome}
              <span className="mx-1.5 text-chalk/30">:</span>
              {liveAway}
              {data!.live_elapsed && isLive && (
                <span className="ml-2 text-sm font-normal text-chalk/50">
                  {data!.live_elapsed}&apos;
                </span>
              )}
            </p>
          ) : isFinished ? (
            <div className="mt-1">
              <p className="scoreboard font-mono text-2xl font-bold tabular-nums text-chalk">
                {formatResultDisplay({
                  home_score: liveHome,
                  away_score: liveAway,
                  decided_by: data!.decided_by,
                  pen_home: data!.pen_home,
                  pen_away: data!.pen_away,
                }) ?? `${liveHome}:${liveAway}`}
                <span className="ml-2 text-xs font-normal uppercase text-chalk/40">
                  Endstand
                </span>
              </p>
              {data!.points != null && (
                <p className="mt-0.5 text-xs text-pitch-line">
                  +{data!.points} {data!.breakdown}
                </p>
              )}
            </div>
          ) : (
            <p className="mt-1 text-xs text-chalk/50">
              Ab Anstoß live · Anstoß {kickoffCountdown(data?.kickoff_at ?? kickoffAt)}
            </p>
          )}
        </div>

        <StatusPill status={status} connected={connected} />
      </div>

      {projected && myTip && <TensionMeter projected={projected} />}

      {myTip && !isFinished && (
        <div className="border-t border-chalk/5 px-4 py-2">
          <p className="text-[10px] text-chalk/30">
            Dein Tipp: {myTip.home_score}:{myTip.away_score}
          </p>
        </div>
      )}

      {!myTip && locked && !isFinished && (
        <div className="border-t border-chalk/5 px-4 py-2">
          <p className="text-[10px] text-chalk/30">
            Anstoß — Tippen nicht mehr möglich
          </p>
        </div>
      )}
    </motion.div>
  );
}

function StatusPill({
  status,
  connected,
}: {
  status: "scheduled" | "live" | "finished";
  connected: boolean;
}) {
  if (status === "live") {
    return (
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-signal/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-signal">
        <span className="live-dot h-1.5 w-1.5 rounded-full bg-signal" />
        Live
      </span>
    );
  }
  if (status === "finished") {
    return (
      <span className="shrink-0 rounded-full bg-signal/20 px-2.5 py-1 text-[10px] uppercase tracking-wider text-signal">
        Beendet
      </span>
    );
  }
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-wider",
        connected
          ? "bg-floodlight/10 text-floodlight/70"
          : "bg-chalk/10 text-chalk/40",
      )}
    >
      {connected ? "Verbunden" : "Wartet"}
    </span>
  );
}
