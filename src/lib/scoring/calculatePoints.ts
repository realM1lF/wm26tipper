export type Score = { home: number; away: number };

export type PointsResult = {
  points: number;
  breakdown: string;
};

/** Kicktipp-style 2-3-4 scoring */
export function calculatePoints(
  tip: Score,
  result: Score,
): PointsResult {
  if (tip.home === result.home && tip.away === result.away) {
    return { points: 4, breakdown: "Exaktes Ergebnis" };
  }

  if (result.home === result.away) {
    if (tip.home === tip.away) {
      return { points: 3, breakdown: "Richtiges Unentschieden" };
    }
    return { points: 0, breakdown: "Kein Treffer" };
  }

  const tipDiff = tip.home - tip.away;
  const resultDiff = result.home - result.away;

  const tendency = (s: Score) =>
    s.home > s.away ? 1 : s.home < s.away ? -1 : 0;

  if (tendency(tip) === tendency(result)) {
    if (tipDiff === resultDiff) {
      return { points: 3, breakdown: "Richtige Tordifferenz" };
    }
    return { points: 2, breakdown: "Richtige Tendenz" };
  }

  return { points: 0, breakdown: "Kein Treffer" };
}
