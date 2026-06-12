"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FriendsTips } from "./FriendsTips";
import type { Tip, Profile } from "@/lib/types";

type TipWithProfile = Tip & {
  profile?: Profile;
  points?: number | null;
  breakdown?: string | null;
};

type Props = {
  matchId: string;
  currentUserId: string;
  hasTip: boolean;
  refreshKey?: number;
};

export function FriendsTipsAccordion({
  matchId,
  currentUserId,
  hasTip,
  refreshKey = 0,
}: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState<TipWithProfile[]>([]);
  const [matchResult, setMatchResult] = useState<{ home: number; away: number } | null>(
    null,
  );
  const [isFinished, setIsFinished] = useState(false);
  const [resultDisplay, setResultDisplay] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  const loadTips = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/matches/${matchId}/tips`);
      if (!res.ok) throw new Error("Laden fehlgeschlagen");
      const data = await res.json();
      setTips(data.tips ?? []);
      setMatchResult(data.matchResult ?? null);
      setIsFinished(!!data.isFinished);
      setResultDisplay(data.resultDisplay ?? null);
      setFetched(true);
    } catch {
      setTips([]);
      setMatchResult(null);
      setIsFinished(false);
      setResultDisplay(null);
      setFetched(true);
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    if (hasTip) {
      void loadTips();
    }
  }, [hasTip, loadTips, refreshKey]);

  useEffect(() => {
    if (!hasTip) {
      setFetched(false);
      setTips([]);
      setMatchResult(null);
      setIsFinished(false);
      setResultDisplay(null);
    }
  }, [hasTip]);

  function toggle() {
    setOpen((prev) => !prev);
  }

  const tipCount = hasTip && fetched ? tips.length : null;
  const headerHint =
    isFinished && resultDisplay && tipCount
      ? `Endstand ${resultDisplay} · ${tipCount} Tipper`
      : tipCount
        ? `${tipCount} Tipper`
        : null;

  return (
    <section className="mt-5 border-t border-chalk/10 pt-4 sm:mt-6">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-white/[0.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-chalk/30"
      >
        <div className="min-w-0 flex-1">
          <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-chalk/50">
            Freunde-Tipps
          </span>
          {headerHint && !open && (
            <p className="mt-0.5 truncate text-[11px] text-chalk/35">{headerHint}</p>
          )}
        </div>
        <span className="flex shrink-0 items-center gap-2">
          {tipCount != null && tipCount > 0 && open && (
            <span className="rounded-full bg-chalk/10 px-2 py-0.5 text-[10px] tabular-nums text-chalk/45">
              {tipCount}
            </span>
          )}
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-chalk/40"
            aria-hidden
          >
            ▾
          </motion.span>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              {!hasTip ? (
                <p className="rounded-lg border border-dashed border-floodlight/20 bg-floodlight/5 px-4 py-3 text-center text-sm leading-relaxed text-chalk/55">
                  Bestätige deinen Tipp — dann siehst du, was deine Freunde tippen.
                </p>
              ) : loading && !fetched ? (
                <p className="py-4 text-center text-xs text-chalk/35">Tipps werden geladen…</p>
              ) : (
                <FriendsTips
                  tips={tips}
                  currentUserId={currentUserId}
                  isFinished={isFinished}
                  resultDisplay={resultDisplay}
                  matchResult={matchResult}
                  embedded
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
