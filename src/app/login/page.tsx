"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const name = displayName.trim();
    if (name.length < 2) {
      setError("Name muss mindestens 2 Zeichen haben");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { display_name: name },
      },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <main className="login-stadium flex min-h-dvh flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-10 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-floodlight/70">
            FIFA WM 2026
          </p>
          <h1 className="font-display mt-2 text-5xl font-bold tracking-tight text-chalk">
            WM<span className="text-floodlight">26</span>
          </h1>
          <p className="mt-3 text-sm text-chalk/50">
            Tippe mit deinen Freunden. Siehst du erst, was die anderen tippen,
            wenn du deinen eigenen Tipp bestätigt hast.
          </p>
        </div>

        {sent ? (
          <div className="ticket-stub rounded-xl border border-chalk/10 p-6 text-center">
            <p className="text-lg font-medium text-chalk">Link ist unterwegs</p>
            <p className="mt-2 text-sm text-chalk/50">
              Prüfe dein Postfach ({email}) und klicke auf den Magic Link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-chalk/40">
                Dein Name
              </span>
              <input
                type="text"
                required
                minLength={2}
                maxLength={24}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Wie sollen dich Freunde sehen?"
                autoComplete="nickname"
                className="mt-1 w-full rounded-lg border border-chalk/10 bg-white/5 px-4 py-3 text-chalk placeholder:text-chalk/30 focus:border-floodlight/50 focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-chalk/40">
                E-Mail
              </span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dein@email.de"
                className="mt-1 w-full rounded-lg border border-chalk/10 bg-white/5 px-4 py-3 text-chalk placeholder:text-chalk/30 focus:border-floodlight/50 focus:outline-none"
              />
            </label>
            {error && <p className="text-sm text-signal">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sende Link…" : "Magic Link senden"}
            </Button>
          </form>
        )}

        <p className="mt-8 text-center text-xs text-chalk/30">
          Einladungscode: WM26-FREUNDE
        </p>
      </motion.div>
    </main>
  );
}
