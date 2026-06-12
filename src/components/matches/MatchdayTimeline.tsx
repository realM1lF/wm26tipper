"use client";

import { useMemo, useState } from "react";
import type { MatchWithTeams, Tip } from "@/lib/types";
import { formatMatchday, matchdayKey, cn } from "@/lib/utils";
import { MatchTicketClient } from "@/components/match/MatchTicketClient";

type Props = {
  matches: MatchWithTeams[];
  tips: Tip[];
  currentUserId: string;
};

export function MatchdayTimeline({ matches, tips, currentUserId }: Props) {
  const tipMap = useMemo(
    () => new Map(tips.map((t) => [t.match_id, t])),
    [tips],
  );

  const days = useMemo(() => {
    const map = new Map<string, MatchWithTeams[]>();
    for (const match of matches) {
      const key = matchdayKey(match.kickoff_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(match);
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, dayMatches]) => ({
        key,
        label: formatMatchday(dayMatches[0]!.kickoff_at),
        matches: dayMatches.sort(
          (a, b) =>
            new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime(),
        ),
        hasLive: dayMatches.some((m) => m.status === "live"),
      }));
  }, [matches]);

  const todayKey = matchdayKey(new Date().toISOString());
  const defaultKey =
    days.find((d) => d.key === todayKey)?.key ??
    days.find((d) => d.key >= todayKey)?.key ??
    days[0]?.key ??
    todayKey;

  const [selected, setSelected] = useState(defaultKey);
  const activeDay = days.find((d) => d.key === selected) ?? days[0];

  if (!activeDay) {
    return (
      <p className="py-8 text-center text-sm text-chalk/40">
        Keine Spiele gefunden.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="-mx-4 border-b border-chalk/10 px-4 pb-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {days.map((day) => (
            <button
              key={day.key}
              type="button"
              onClick={() => setSelected(day.key)}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm transition-colors",
                selected === day.key
                  ? day.hasLive
                    ? "bg-signal/20 text-signal"
                    : "bg-floodlight/20 text-floodlight"
                  : "bg-white/5 text-chalk/60 hover:text-chalk",
              )}
            >
              {day.label}
              {day.hasLive && (
                <span className="live-dot ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-signal align-middle" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {activeDay.matches.map((match) => (
          <MatchTicketClient
            key={match.id}
            match={match}
            myTip={tipMap.get(match.id) ?? null}
            currentUserId={currentUserId}
          />
        ))}
      </div>
    </div>
  );
}
