"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  label?: string;
};

export function ScoreStepper({ value, onChange, disabled, label }: Props) {
  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] uppercase tracking-widest text-chalk/40">
          {label}
        </span>
      )}
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          disabled={disabled || value <= 0}
          onClick={() => onChange(Math.max(0, value - 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-chalk/10 bg-white/5 text-lg text-chalk hover:border-floodlight/40 disabled:opacity-30"
          aria-label="Tor abziehen"
        >
          −
        </motion.button>
        <span className="font-display min-w-[2.5rem] text-center text-4xl font-bold tabular-nums text-floodlight">
          {value}
        </span>
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          disabled={disabled || value >= 9}
          onClick={() => onChange(Math.min(9, value + 1))}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-chalk/10 bg-white/5 text-lg text-chalk hover:border-floodlight/40 disabled:opacity-30"
          aria-label="Tor dazu"
        >
          +
        </motion.button>
      </div>
    </div>
  );
}
