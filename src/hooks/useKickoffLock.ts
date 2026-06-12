"use client";

import { useEffect, useState } from "react";
import { isTipLocked } from "@/lib/utils";

export function useKickoffLock(kickoffAt: string) {
  const [locked, setLocked] = useState(() => isTipLocked(kickoffAt));

  useEffect(() => {
    setLocked(isTipLocked(kickoffAt));
    const kickoff = new Date(kickoffAt).getTime();
    const now = Date.now();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    if (kickoff > now) {
      timeoutId = setTimeout(() => setLocked(true), kickoff - now);
    }

    intervalId = setInterval(() => {
      setLocked(isTipLocked(kickoffAt));
    }, 30_000);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [kickoffAt]);

  return locked;
}
