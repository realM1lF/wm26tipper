import type { RankingRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  rows: RankingRow[];
  currentUserId?: string;
  highlight?: boolean;
};

const podiumStyles = [
  "border-floodlight/50 bg-floodlight/10",
  "border-chalk/30 bg-chalk/5",
  "border-amber-700/40 bg-amber-900/10",
];

export function Leaderboard({ rows, currentUserId, highlight }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-chalk/40">
        Noch keine Spieler in der Liga.
      </p>
    );
  }

  const topThree = rows.slice(0, 3);
  const rest = rows.slice(3);

  return (
    <div className="space-y-4">
      {topThree.length >= 2 && (
        <ol className="grid gap-2 sm:grid-cols-3 sm:items-stretch">
          {[1, 0, 2].map((podiumIndex) => {
            const row = topThree[podiumIndex];
            if (!row) return <div key={podiumIndex} />;
            const isMe = row.user_id === currentUserId;
            return (
              <li
                key={row.user_id}
                className={cn(
                  "flex h-full min-h-[10.5rem] w-full flex-col items-center justify-between rounded-xl border px-4 py-4 text-center transition-colors",
                  podiumStyles[podiumIndex],
                  isMe && highlight && "ring-1 ring-floodlight/40",
                  podiumIndex === 0 && "sm:order-2",
                  podiumIndex === 1 && "sm:order-1",
                  podiumIndex === 2 && "sm:order-3",
                )}
              >
                <span className="font-display text-2xl font-bold text-floodlight/80">
                  {podiumIndex + 1}
                </span>
                <span
                  className="mt-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-pitch-night"
                  style={{ backgroundColor: row.avatar_color }}
                >
                  {row.display_name[0].toUpperCase()}
                </span>
                <p className="mt-2 line-clamp-2 w-full text-sm font-medium text-chalk">
                  {row.display_name}
                </p>
                <p className="font-display mt-1 text-2xl font-bold tabular-nums text-pitch-line">
                  {row.total_points}
                </p>
              </li>
            );
          })}
        </ol>
      )}

      {topThree.length === 1 && (
        <ol className="space-y-2">
          {topThree.map((row, index) => (
            <LeaderboardRow
              key={row.user_id}
              row={row}
              index={index}
              currentUserId={currentUserId}
              highlight={highlight}
            />
          ))}
        </ol>
      )}

      {rest.length > 0 && (
        <ol className="space-y-2">
          {rest.map((row, index) => (
            <LeaderboardRow
              key={row.user_id}
              row={row}
              index={index + 3}
              currentUserId={currentUserId}
              highlight={highlight}
            />
          ))}
        </ol>
      )}
    </div>
  );
}

function LeaderboardRow({
  row,
  index,
  currentUserId,
  highlight,
}: {
  row: RankingRow;
  index: number;
  currentUserId?: string;
  highlight?: boolean;
}) {
  const isMe = row.user_id === currentUserId;
  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-xl border border-chalk/10 bg-white/[0.02] px-4 py-3 transition-colors",
        isMe && highlight && "border-floodlight/30 bg-floodlight/5",
      )}
    >
      <span className="font-display w-8 text-center text-lg font-bold tabular-nums text-chalk/40">
        {index + 1}
      </span>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-pitch-night"
        style={{ backgroundColor: row.avatar_color }}
      >
        {row.display_name[0].toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-chalk">
          {row.display_name}
          {isMe && (
            <span className="ml-1 text-xs text-floodlight/70">(du)</span>
          )}
        </p>
        <p className="text-xs text-chalk/40">
          {row.exact_hits} exakte Treffer
        </p>
      </div>
      <span className="font-display text-xl font-bold tabular-nums text-pitch-line">
        {row.total_points}
      </span>
    </li>
  );
}
