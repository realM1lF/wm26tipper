"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { joinLeague } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { INVITE_CODE } from "@/lib/data/teams";
import { motion } from "framer-motion";

export default function JoinPage() {
  const [code, setCode] = useState(INVITE_CODE);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await joinLeague(code);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Fehler beim Beitreten");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ticket-stub w-full max-w-md rounded-xl border border-chalk/10 p-8"
      >
        <h1 className="font-display text-2xl font-bold text-chalk">
          Liga beitreten
        </h1>
        <p className="mt-2 text-sm text-chalk/50">
          Gib den Einladungscode deiner Freunde-Liga ein.
        </p>
        <form onSubmit={handleJoin} className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-chalk/40">
              Einladungscode
            </span>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="mt-1 w-full rounded-lg border border-chalk/10 bg-white/5 px-4 py-3 font-mono text-lg tracking-widest text-floodlight focus:border-floodlight/50 focus:outline-none"
            />
          </label>
          {error && <p className="text-sm text-signal">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Tritt bei…" : "Liga beitreten"}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
