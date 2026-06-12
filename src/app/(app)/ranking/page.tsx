import { getCurrentUser, getRanking } from "@/lib/queries";
import { Leaderboard } from "@/components/ranking/Leaderboard";

export default async function RankingPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const ranking = await getRanking();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-chalk">Rangliste</h1>
        <p className="mt-1 text-sm text-chalk/50">
          2-3-4 Punkte · Tendenz · Differenz · Exakt
        </p>
      </header>

      <div className="rounded-xl border border-chalk/10 bg-white/[0.02] p-5 text-sm text-chalk/55">
        <p className="font-display text-base font-semibold text-chalk/85">Spielregeln</p>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-floodlight/80">
              Punkte
            </p>
            <ul className="mt-2 space-y-1 text-xs">
              <li>Exaktes Ergebnis → <strong className="text-pitch-line">4 Punkte</strong></li>
              <li>Richtige Tordifferenz → <strong className="text-pitch-line">3 Punkte</strong></li>
              <li>Richtiges Unentschieden → <strong className="text-pitch-line">3 Punkte</strong></li>
              <li>Richtige Tendenz → <strong className="text-pitch-line">2 Punkte</strong></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-floodlight/80">
              Gruppenspiele
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              Es zählt das Ergebnis nach 90 Minuten inklusive Nachspielzeit.
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-floodlight/80">
              K.o.-Spiele
            </p>
            <p className="mt-1 text-xs leading-relaxed">
              Es zählt der Stand nach 90 Minuten und Verlängerung (120 Minuten).
              Elfmeter entscheiden nur den Sieger — sie fließen nicht ins getippte
              Ergebnis ein. Ein Tipp 1:1 kann 3 Punkte bringen, wenn es nach
              Verlängerung 1:1 steht.
            </p>
          </div>
        </div>
      </div>

      <Leaderboard rows={ranking} currentUserId={user.id} highlight />
    </div>
  );
}
