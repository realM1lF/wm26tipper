import type { RankingRow } from "@/lib/types";
import { cn } from "@/lib/utils";

type Props = {
  rows: RankingRow[];
  currentUserId?: string;
  highlight?: boolean;
};

const rankColors: Record<number, string> = {
  1: "text-floodlight",
  2: "text-chalk/70",
  3: "text-amber-600/80",
};

export function Leaderboard({ rows, currentUserId, highlight }: Props) {
  if (rows.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-chalk/40">
        Noch keine Spieler in der Liga.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-chalk/10">
      {/* Desktop table */}
      <table className="hidden w-full border-collapse sm:table">
        <thead>
          <tr className="border-b border-chalk/10 bg-white/[0.02]">
            <th className="w-12 px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-widest text-chalk/40">
              #
            </th>
            <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-widest text-chalk/40">
              Spieler
            </th>
            <th className="w-20 px-4 py-2.5 text-center text-[10px] font-medium uppercase tracking-widest text-chalk/40">
              Exakt
            </th>
            <th className="w-24 px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-widest text-chalk/40">
              Punkte
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <LeaderboardTableRow
              key={row.user_id}
              row={row}
              rank={index + 1}
              currentUserId={currentUserId}
              highlight={highlight}
              zebra={index % 2 === 1}
            />
          ))}
        </tbody>
      </table>

      {/* Mobile rows */}
      <ul className="divide-y divide-chalk/5 sm:hidden">
        {rows.map((row, index) => (
          <LeaderboardMobileRow
            key={row.user_id}
            row={row}
            rank={index + 1}
            currentUserId={currentUserId}
            highlight={highlight}
          />
        ))}
      </ul>
    </div>
  );
}

function LeaderboardTableRow({
  row,
  rank,
  currentUserId,
  highlight,
  zebra,
}: {
  row: RankingRow;
  rank: number;
  currentUserId?: string;
  highlight?: boolean;
  zebra: boolean;
}) {
  const isMe = row.user_id === currentUserId;

  return (
    <tr
      className={cn(
        "transition-colors hover:bg-white/[0.04]",
        zebra && "bg-white/[0.02]",
        isMe && highlight && "bg-floodlight/5 ring-1 ring-inset ring-floodlight/20",
      )}
    >
      <td className="px-4 py-3">
        <span
          className={cn(
            "font-display text-lg font-bold tabular-nums",
            rankColors[rank] ?? "text-chalk/40",
          )}
        >
          {rank}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-pitch-night"
            style={{ backgroundColor: row.avatar_color }}
          >
            {row.display_name[0].toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium text-chalk">
            {row.display_name}
            {isMe && (
              <span className="ml-1.5 text-xs font-normal text-floodlight/70">(du)</span>
            )}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className="text-sm tabular-nums text-chalk/60">{row.exact_hits}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <span className="font-display text-xl font-bold tabular-nums text-pitch-line">
          {row.total_points}
        </span>
      </td>
    </tr>
  );
}

function LeaderboardMobileRow({
  row,
  rank,
  currentUserId,
  highlight,
}: {
  row: RankingRow;
  rank: number;
  currentUserId?: string;
  highlight?: boolean;
}) {
  const isMe = row.user_id === currentUserId;

  return (
    <li
      className={cn(
        "px-3 py-3",
        isMe && highlight && "bg-floodlight/5 ring-1 ring-inset ring-floodlight/20",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "font-display w-6 shrink-0 text-center text-base font-bold tabular-nums",
              rankColors[rank] ?? "text-chalk/40",
            )}
          >
            {rank}
          </span>
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-pitch-night"
            style={{ backgroundColor: row.avatar_color }}
          >
            {row.display_name[0].toUpperCase()}
          </span>
          <span className="truncate text-sm font-medium text-chalk">
            {row.display_name}
            {isMe && (
              <span className="ml-1 text-xs font-normal text-floodlight/70">(du)</span>
            )}
          </span>
        </div>
        <span className="font-display shrink-0 text-lg font-bold tabular-nums text-pitch-line">
          {row.total_points}
        </span>
      </div>
      <p className="mt-1 pl-[3.875rem] text-[11px] tabular-nums text-chalk/40">
        {row.exact_hits} exakt
      </p>
    </li>
  );
}
