"use client";

import { useEffect, useState } from "react";

export type LiveData = {
  status: "scheduled" | "live" | "finished";
  home_score: number | null;
  away_score: number | null;
  decided_by?: string | null;
  pen_home?: number | null;
  pen_away?: number | null;
  live_elapsed: string | null;
  kickoff_at: string;
  points: number | null;
  breakdown: string | null;
  locked: boolean;
};

export function useLiveMatch(matchId: string, enabled = true) {
  const [data, setData] = useState<LiveData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout> | undefined;
    let retries = 0;

    function connect() {
      source = new EventSource(`/api/matches/${matchId}/live/stream`);

      source.onopen = () => {
        setConnected(true);
        setError(null);
        retries = 0;
      };

      source.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as LiveData;
          setData(parsed);
          if (parsed.status === "finished") {
            source?.close();
            setConnected(false);
          }
        } catch {
          setError("Live-Daten ungültig");
        }
      };

      source.onerror = () => {
        setConnected(false);
        source?.close();
        if (retries < 5) {
          retries++;
          retryTimeout = setTimeout(connect, Math.min(1000 * retries, 5000));
        } else {
          setError("Live-Verbindung unterbrochen");
        }
      };
    }

    connect();

    return () => {
      source?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [matchId, enabled]);

  return { data, connected, error };
}
