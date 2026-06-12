import Link from "next/link";
import { getCurrentUser, getMatchesWithTeams, getMyTips, getRanking, getProfile } from "@/lib/queries";
import { getTournamentPhase } from "@/lib/tournament/phase";
import { Leaderboard } from "@/components/ranking/Leaderboard";
import { MatchTicketClient } from "@/components/match/MatchTicketClient";
import {
  isTipLocked,
  isMatchLiveOrPending,
  sortMatchesByPriority,
  matchTeamsReady,
} from "@/lib/utils";
import { INVITE_CODE } from "@/lib/data/teams";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const [profile, matches, myTips, ranking] = await Promise.all([
    getProfile(user.id),
    getMatchesWithTeams(),
    getMyTips(user.id),
    getRanking(),
  ]);

  const phase = getTournamentPhase(matches);
  const tipMap = new Map(myTips.map((t) => [t.match_id, t]));
  const sorted = sortMatchesByPriority(matches);
  const liveNow = sorted.filter((m) => isMatchLiveOrPending(m));
  const now = new Date();
  const upcoming = sorted
    .filter(
      (m) =>
        m.status !== "finished" &&
        m.status !== "live" &&
        matchTeamsReady(m) &&
        new Date(m.kickoff_at) >= now,
    )
    .slice(0, 3);

  const openCount = matches.filter(
    (m) =>
      matchTeamsReady(m) &&
      !tipMap.has(m.id) &&
      !isTipLocked(m.kickoff_at) &&
      m.status !== "finished",
  ).length;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs uppercase tracking-widest text-floodlight/70">
          {phase === "finished"
            ? "WM 2026 beendet"
            : phase === "knockout"
              ? "K.o.-Phase"
              : "Gruppenphase"}
        </p>
        <h1 className="font-display mt-1 text-3xl font-bold text-chalk">
          {profile?.display_name ?? "Tipper"}
        </h1>
        {openCount > 0 ? (
          <Link
            href="/matches?filter=open"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-pitch-line px-4 py-2.5 text-sm font-medium text-white shadow-[0_0_20px_rgba(27,143,78,0.2)] transition-colors hover:bg-pitch-line/90"
          >
            {openCount} {openCount === 1 ? "Spiel wartet" : "Spiele warten"} auf deinen Tipp
            <span aria-hidden>→</span>
          </Link>
        ) : (
          <p className="mt-2 text-sm text-chalk/50">
            Alle tippbaren Spiele erledigt — stark!
          </p>
        )}
      </header>

      {liveNow.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-widest text-signal">
              Jetzt live
            </h2>
            <Link href="/matches?filter=live" className="text-xs text-floodlight hover:underline">
              Alle Live-Spiele →
            </Link>
          </div>
          <div className="space-y-4">
            {liveNow.slice(0, 3).map((match) => (
              <MatchTicketClient
                key={match.id}
                match={match}
                myTip={tipMap.get(match.id) ?? null}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xs font-medium uppercase tracking-widest text-chalk/50">
              Nächste Spiele
            </h2>
            <Link href="/matches" className="text-xs text-floodlight hover:underline">
              Alle Spiele →
            </Link>
          </div>
          <div className="space-y-4">
            {upcoming.map((match) => (
              <MatchTicketClient
                key={match.id}
                match={match}
                myTip={tipMap.get(match.id) ?? null}
                compact
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-chalk/50">
            Rangliste
          </h2>
          <Link href="/ranking" className="text-xs text-floodlight hover:underline">
            Vollständig →
          </Link>
        </div>
        <Leaderboard rows={ranking.slice(0, 5)} currentUserId={user.id} highlight />
      </section>

      <section className="rounded-xl border border-chalk/10 bg-white/[0.02] p-4">
        <p className="text-xs text-chalk/40">Einladungscode für Freunde</p>
        <p className="font-mono mt-1 text-lg tracking-widest text-floodlight">{INVITE_CODE}</p>
      </section>
    </div>
  );
}
