export type ProjectedScore = {
  points: 0 | 2 | 3 | 4;
  breakdown: string;
};

export function projectPoints(
  tipHome: number,
  tipAway: number,
  liveHome: number,
  liveAway: number,
): ProjectedScore {
  if (tipHome === liveHome && tipAway === liveAway) {
    return { points: 4, breakdown: "Exaktes Ergebnis" };
  }

  if (liveHome === liveAway) {
    if (tipHome === tipAway) {
      return { points: 3, breakdown: "Richtiges Unentschieden" };
    }
    return { points: 0, breakdown: "Kein Treffer" };
  }

  const tipDiff = tipHome - tipAway;
  const liveDiff = liveHome - liveAway;
  const tipTendency = Math.sign(tipDiff);
  const liveTendency = Math.sign(liveDiff);

  if (tipTendency === liveTendency) {
    if (tipDiff === liveDiff) {
      return { points: 3, breakdown: "Richtige Tordifferenz" };
    }
    return { points: 2, breakdown: "Richtige Tendenz" };
  }

  return { points: 0, breakdown: "Kein Treffer" };
}
