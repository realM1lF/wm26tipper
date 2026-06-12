import { notFound, redirect } from "next/navigation";
import {
  getCurrentUser,
  getMatchById,
  getTipsForMatch,
} from "@/lib/queries";
import { getScoringPair } from "@/lib/scoring/resolve-result";
import { MatchTicketClient } from "@/components/match/MatchTicketClient";
import { FriendsTips } from "@/components/match/FriendsTips";
import { isTipLocked } from "@/lib/utils";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const match = await getMatchById(id);
  if (!match) notFound();

  const { myTip, friendsTips } = await getTipsForMatch(id, user.id);
  const locked = isTipLocked(match.kickoff_at);

  const scoring = getScoringPair(match);
  const matchResult =
    match.status === "finished" && scoring
      ? { home: scoring.home, away: scoring.away }
      : null;

  return (
    <div className="space-y-8">
      <MatchTicketClient match={match} myTip={myTip} />

      {myTip ? (
        <FriendsTips
          tips={friendsTips}
          currentUserId={user.id}
          matchResult={matchResult}
        />
      ) : (
        !locked && (
          <div className="rounded-xl border border-dashed border-floodlight/20 bg-floodlight/5 p-6 text-center text-sm text-chalk/60">
            Bestätige deinen Tipp — dann siehst du, was deine Freunde tippen.
          </div>
        )
      )}
    </div>
  );
}
