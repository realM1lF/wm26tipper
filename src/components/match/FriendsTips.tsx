import type { Tip, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type TipWithProfile = Tip & {
  profile?: Profile;
  points?: number | null;
  breakdown?: string | null;
};

type Props = {
  tips: TipWithProfile[];
  currentUserId: string;
  isFinished?: boolean;
  resultDisplay?: string | null;
  matchResult?: { home: number; away: number } | null;
  embedded?: boolean;
};

function pointsStyle(points: number) {
  if (points >= 4) return "text-floodlight bg-floodlight/15";
  if (points >= 2) return "text-pitch-line bg-pitch-line/15";
  return "text-chalk/35 bg-chalk/5";
}

function breakdownStyle(points: number) {
  if (points >= 4) return "text-floodlight/80";
  if (points >= 2) return "text-pitch-line/80";
  return "text-chalk/35";
}

export function FriendsTips({
  tips,
  currentUserId,
  isFinished,
  resultDisplay,
  matchResult,
  embedded,
}: Props) {
  if (tips.length === 0) {
    return (
      <div
        className={cn(
          "rounded-lg border border-dashed border-chalk/10 p-4 text-center text-sm text-chalk/40",
          !embedded && "rounded-xl p-6",
        )}
      >
        Noch keine weiteren Tipps sichtbar.
      </div>
    );
  }

  const showScoring = isFinished && matchResult;

  return (
    <div className={cn(!embedded && "space-y-2")}>
      {!embedded && (
        <h3 className="text-xs font-medium uppercase tracking-widest text-chalk/50">
          Tipps der Gruppe
        </h3>
      )}

      {showScoring && resultDisplay && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-lg border border-chalk/10 bg-white/[0.03] px-4 py-2.5">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-chalk/40">
            Endstand
          </span>
          <span className="font-display text-lg font-bold tabular-nums text-chalk">
            {resultDisplay}
          </span>
        </div>
      )}

      <ul className="divide-y divide-chalk/5 overflow-hidden rounded-lg border border-chalk/10">
        {tips.map((tip) => {
          const isMe = tip.user_id === currentUserId;
          const points =
            showScoring && tip.points != null ? tip.points : null;
          const breakdown =
            showScoring && tip.breakdown ? tip.breakdown : null;

          return (
            <li
              key={tip.id}
              className={cn(
                "bg-white/[0.02] px-3 py-2.5 sm:px-4 sm:py-3",
                isMe && "bg-floodlight/5",
              )}
            >
              {/* Desktop row */}
              <div className="hidden items-center gap-3 sm:flex sm:gap-4">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-pitch-night"
                    style={{ backgroundColor: tip.profile?.avatar_color ?? "#F4C430" }}
                  >
                    {(tip.profile?.display_name ?? "?")[0].toUpperCase()}
                  </span>
                  <span className="truncate text-sm text-chalk">
                    {tip.profile?.display_name ?? "Spieler"}
                    {isMe && (
                      <span className="ml-2 text-xs text-floodlight/70">(du)</span>
                    )}
                  </span>
                </div>
                <span className="font-display shrink-0 text-base font-bold tabular-nums text-chalk">
                  {tip.home_score}:{tip.away_score}
                </span>
                {breakdown != null && points != null ? (
                  <>
                    <span
                      className={cn(
                        "hidden min-w-[7rem] text-center text-[11px] md:inline",
                        breakdownStyle(points),
                      )}
                    >
                      {breakdown}
                    </span>
                    <span
                      className={cn(
                        "min-w-[2.75rem] shrink-0 rounded px-2 py-0.5 text-center text-xs font-semibold tabular-nums",
                        pointsStyle(points),
                      )}
                    >
                      +{points}
                    </span>
                  </>
                ) : null}
              </div>

              {/* Mobile row */}
              <div className="sm:hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-pitch-night"
                      style={{ backgroundColor: tip.profile?.avatar_color ?? "#F4C430" }}
                    >
                      {(tip.profile?.display_name ?? "?")[0].toUpperCase()}
                    </span>
                    <span className="truncate text-sm text-chalk">
                      {tip.profile?.display_name ?? "Spieler"}
                      {isMe && (
                        <span className="ml-1.5 text-xs text-floodlight/70">(du)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="font-display text-base font-bold tabular-nums text-chalk">
                      {tip.home_score}:{tip.away_score}
                    </span>
                    {points != null && (
                      <span
                        className={cn(
                          "min-w-[2.25rem] rounded px-1.5 py-0.5 text-center text-xs font-semibold tabular-nums",
                          pointsStyle(points),
                        )}
                      >
                        +{points}
                      </span>
                    )}
                  </div>
                </div>
                {breakdown != null && points != null && (
                  <p
                    className={cn(
                      "mt-1 pl-[2.625rem] text-[11px] leading-snug",
                      breakdownStyle(points),
                    )}
                  >
                    {breakdown}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
