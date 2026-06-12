import type { Tip, Profile } from "@/lib/types";
import { cn } from "@/lib/utils";

type TipWithProfile = Tip & {
  profile?: Profile;
  points?: number;
};

type Props = {
  tips: TipWithProfile[];
  currentUserId: string;
  matchResult?: { home: number; away: number } | null;
};

export function FriendsTips({ tips, currentUserId, matchResult }: Props) {
  if (tips.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-chalk/10 p-6 text-center text-sm text-chalk/40">
        Noch keine weiteren Tipps sichtbar.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-widest text-chalk/50">
        Tipps der Gruppe
      </h3>
      <ul className="divide-y divide-chalk/5 overflow-hidden rounded-xl border border-chalk/10">
        {tips.map((tip) => {
          const isMe = tip.user_id === currentUserId;
          const points =
            matchResult && tip.points != null ? tip.points : null;

          return (
            <li
              key={tip.id}
              className={cn(
                "flex items-center justify-between gap-4 bg-white/[0.02] px-4 py-3",
                isMe && "bg-floodlight/5",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-pitch-night"
                  style={{ backgroundColor: tip.profile?.avatar_color ?? "#F4C430" }}
                >
                  {(tip.profile?.display_name ?? "?")[0].toUpperCase()}
                </span>
                <span className="text-sm text-chalk">
                  {tip.profile?.display_name ?? "Spieler"}
                  {isMe && (
                    <span className="ml-2 text-xs text-floodlight/70">(du)</span>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg font-bold tabular-nums text-chalk">
                  {tip.home_score}:{tip.away_score}
                </span>
                {points != null && (
                  <span className="min-w-[3rem] rounded bg-pitch-line/20 px-2 py-0.5 text-center text-xs font-medium text-pitch-line">
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
