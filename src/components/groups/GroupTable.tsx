import type { GroupStanding } from "@/lib/groups/standings";
import { cn } from "@/lib/utils";

type Props = {
  standings: GroupStanding[];
};

export function GroupTableGrid({ standings }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {standings.map((group) => (
        <div
          key={group.group}
          className="overflow-hidden rounded-xl border border-chalk/10 bg-white/[0.02]"
        >
          <div className="border-b border-chalk/10 bg-floodlight/5 px-4 py-2">
            <h2 className="font-display text-sm font-bold uppercase tracking-widest text-floodlight">
              Gruppe {group.group}
            </h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-chalk/40">
                <th className="px-3 py-2 text-left font-medium">Team</th>
                <th className="px-2 py-2 text-center font-medium">Sp</th>
                <th className="px-2 py-2 text-center font-medium">Diff</th>
                <th className="px-3 py-2 text-center font-medium">Pkt</th>
              </tr>
            </thead>
            <tbody>
              {group.rows.map((row, index) => (
                <tr
                  key={row.code}
                  className={cn(
                    "border-t border-chalk/5",
                    index < 2 && "bg-pitch-line/5",
                  )}
                >
                  <td className="px-3 py-2">
                    <span className="mr-1.5">{row.flag_emoji}</span>
                    <span className="text-chalk">{row.name}</span>
                  </td>
                  <td className="px-2 py-2 text-center tabular-nums text-chalk/60">
                    {row.played}
                  </td>
                  <td
                    className={cn(
                      "px-2 py-2 text-center tabular-nums",
                      row.goalDiff > 0
                        ? "text-pitch-line"
                        : row.goalDiff < 0
                          ? "text-signal"
                          : "text-chalk/50",
                    )}
                  >
                    {row.goalDiff > 0 ? "+" : ""}
                    {row.goalDiff}
                  </td>
                  <td className="px-3 py-2 text-center font-display text-sm font-bold tabular-nums text-chalk">
                    {row.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {group.rows.some((r) => r.played > 0) && (
            <p className="border-t border-chalk/5 px-3 py-1.5 text-[10px] text-chalk/30">
              Grün = Top 2
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
