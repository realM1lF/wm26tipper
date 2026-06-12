import { getCurrentUser, getMatchesWithTeams, getMyTips } from "@/lib/queries";
import { fetchExternalGroupStandings } from "@/lib/groups/external-standings";
import { getTournamentPhase } from "@/lib/tournament/phase";
import { MatchesView } from "@/components/matches/MatchesView";

export default async function MatchesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; view?: string; stage?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null;

  const params = await searchParams;
  const [matches, myTips, groupStandings] = await Promise.all([
    getMatchesWithTeams(),
    getMyTips(user.id),
    fetchExternalGroupStandings(),
  ]);

  const phase = getTournamentPhase(matches);

  return (
    <MatchesView
      matches={matches}
      tips={myTips}
      currentUserId={user.id}
      phase={phase}
      groupStandings={groupStandings}
      filter={params.filter}
      view={params.view}
      stage={params.stage}
    />
  );
}
