"use client";

import { useEffect, useState } from "react";
import { requestMagicLink, type AuthMode } from "@/lib/actions";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";

const COOLDOWN_SECONDS = 60;

type LoginFormProps = {
  authError?: string;
};

export function LoginForm({ authError }: LoginFormProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(authError === "auth" ? "Anmeldung fehlgeschlagen — bitte erneut versuchen." : "");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;

    setLoading(true);
    setError("");

    const result = await requestMagicLink(
      email,
      displayName,
      mode,
      window.location.origin,
    );

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSent(true);
    setCooldown(COOLDOWN_SECONDS);
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setSent(false);
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

        <div className="mb-6 flex rounded-lg border border-chalk/10 bg-white/5 p-1">
          <button
            type="button"
            onClick={() => switchMode("login")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "login"
                ? "bg-floodlight/20 text-floodlight"
                : "text-chalk/50 hover:text-chalk/70"
            }`}
          >
            Einloggen
          </button>
          <button
            type="button"
            onClick={() => switchMode("register")}
            className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition ${
              mode === "register"
                ? "bg-floodlight/20 text-floodlight"
                : "text-chalk/50 hover:text-chalk/70"
            }`}
          >
            Registrieren
          </button>
        </div>

        {sent ? (
          <div className="ticket-stub rounded-xl border border-chalk/10 p-6 text-center">
            <p className="text-lg font-medium text-chalk">Link ist unterwegs</p>
            <p className="mt-2 text-sm text-chalk/50">
              Prüfe dein Postfach ({email}) und klicke auf den Magic Link auf
              diesem Gerät.
            </p>
            {mode === "login" && (
              <p className="mt-3 text-xs text-chalk/40">
                Neues Gerät? Jeder Login braucht einen frischen Link — der alte
                funktioniert nicht mehrfach.
              </p>
            )}
            {cooldown > 0 && (
              <p className="mt-4 text-xs text-chalk/30">
                Erneut senden in {cooldown}s
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-chalk/50">
              {mode === "register"
                ? "Erstelle deinen Account mit Name und E-Mail."
                : "Schon registriert? Name und E-Mail eingeben — wir schicken dir einen Login-Link."}
            </p>
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
                  autoComplete="email"
                  className="mt-1 w-full rounded-lg border border-chalk/10 bg-white/5 px-4 py-3 text-chalk placeholder:text-chalk/30 focus:border-floodlight/50 focus:outline-none"
                />
              </label>
              {error && <p className="text-sm text-signal">{error}</p>}
              <Button
                type="submit"
                disabled={loading || cooldown > 0}
                className="w-full"
              >
                {loading
                  ? "Sende Link…"
                  : mode === "register"
                    ? "Account anlegen"
                    : "Magic Link senden"}
              </Button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-xs text-chalk/30">
          Einladungscode: WM26-FREUNDE
        </p>
      </motion.div>
    </main>
  );
}
