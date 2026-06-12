import type { Tip, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type TipWithProfile = Tip & {
  profile?: Profile;
  points?: number | null;
};

type Props = {
  tips: TipWithProfile[];
  currentUserId: string;
  matchResult?: { home: number; away: number } | null;
  embedded?: boolean;
};

export function FriendsTips({ tips, currentUserId, matchResult, embedded }: Props) {
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

  return (
    <div className={cn(!embedded && "space-y-2")}>
      {!embedded && (
        <h3 className="text-xs font-medium uppercase tracking-widest text-chalk/50">
          Tipps der Gruppe
        </h3>
      )}
      <ul className="divide-y divide-chalk/5 overflow-hidden rounded-lg border border-chalk/10">
        {tips.map((tip) => {
          const isMe = tip.user_id === currentUserId;
          const points =
            matchResult && tip.points != null ? tip.points : null;

          return (
            <li
              key={tip.id}
              className={cn(
                "flex items-center justify-between gap-3 bg-white/[0.02] px-3 py-2.5 sm:gap-4 sm:px-4 sm:py-3",
                isMe && "bg-floodlight/5",
              )}
            >
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
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
              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <span className="font-display text-base font-bold tabular-nums text-chalk sm:text-lg">
                  {tip.home_score}:{tip.away_score}
                </span>
                {points != null && (
                  <span className="min-w-[2.75rem] rounded bg-pitch-line/20 px-2 py-0.5 text-center text-xs font-medium text-pitch-line">
                    +{points}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
