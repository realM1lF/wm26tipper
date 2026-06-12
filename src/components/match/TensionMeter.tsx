import type { ProjectedScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";

type Props = {
  projected: ProjectedScore;
};

const STEPS = [
  { points: 0, label: "0" },
  { points: 2, label: "2" },
  { points: 3, label: "3" },
  { points: 4, label: "4" },
] as const;

export function TensionMeter({ projected }: Props) {
  return (
    <div className="mt-3 border-t border-chalk/5 pt-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] uppercase tracking-widest text-chalk/40">
          Spannungsmeter
        </p>
        <p
          className={cn(
            "text-xs font-medium",
            projected.points === 4 && "text-floodlight",
            projected.points >= 2 && projected.points < 4 && "text-pitch-line",
            projected.points === 0 && "text-chalk/40",
          )}
        >
          Aktuell: +{projected.points} — {projected.breakdown}
        </p>
      </div>
      <div className="flex gap-1">
        {STEPS.map((step) => (
          <div key={step.points} className="flex-1">
            <div
              className={cn(
                "h-1.5 rounded-full transition-colors",
                projected.points === step.points
                  ? step.points === 4
                    ? "bg-floodlight"
                    : step.points >= 2
                      ? "bg-pitch-line"
                      : "bg-chalk/30"
                  : "bg-chalk/10",
              )}
            />
            <p
              className={cn(
                "mt-1 text-center text-[9px] tabular-nums",
                projected.points === step.points
                  ? "text-chalk/70"
                  : "text-chalk/25",
              )}
            >
              {step.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
