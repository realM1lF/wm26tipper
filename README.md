# WM26 — Freunde-Tippspiel

Tippspiel für die FIFA WM 2026 (48 Teams, 104 Spiele). Freunde tippen exakte Ergebnisse, sammeln Punkte (2-3-4-System) und sehen fremde Tipps erst nach eigenem bestätigtem Tipp.

## Navigation

- **Start** — Live-Spiele, offene Tipps, Rangliste
- **Spiele** — Tippen, Nach Datum, Gruppentabellen, K.o.-Phasen
- **Rangliste** — Gesamtwertung + Spielregeln

## Stack

- **Frontend:** Next.js 16 + Tailwind CSS v4
- **Backend:** Supabase (Auth, PostgreSQL, RLS)
- **Daten:** [worldcup26.ir](https://worldcup26.ir/get/games) (104 Spiele inkl. K.o.)
- **Hosting:** Netlify (Cron alle 5 Min)

## Spielregeln

| Treffer | Punkte |
|---------|--------|
| Exaktes Ergebnis | 4 |
| Richtige Tordifferenz | 3 |
| Richtige Tendenz | 2 |

- **Gruppenspiele:** Wertung nach 90 Minuten inkl. Nachspielzeit
- **K.o.-Spiele:** Wertung nach 120 Minuten (90 + Verlängerung). Elfmeter entscheiden nur den Sieger — nicht als Tore im Tipp
- Tipp-Deadline: Anstoß. Fremde Tipps sichtbar nach eigenem Tipp

## Lokales Setup

### 1. Umgebungsvariablen

Kopiere `.env.example` nach `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- optional `CRON_SECRET`
- optional `DATABASE_URL` (für Migrationen)

### 2. Supabase Auth

- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**`
- Email-Provider aktivieren

**Custom SMTP (Pflicht für ~20–30 Freunde):** Supabase-Standard-SMTP erlaubt nur wenige E-Mails pro Stunde und oft nur an Team-Mitglieder. Für die Freunde-Liga unbedingt Custom SMTP einrichten:

1. Supabase → **Authentication → SMTP Settings** → Custom SMTP aktivieren  
   Empfohlen: [Resend](https://resend.com) (Free Tier reicht für ~30 Registrierungen + Re-Logins)
   - Host: `smtp.resend.com`, Port: `465`, User: `resend`, Passwort: Resend-API-Key
   - Absender: verifizierte Domain, z. B. `WM26 <noreply@deine-domain.de>`
2. Supabase → **Authentication → Rate Limits** → E-Mail-Limit auf **100/h** (oder höher) setzen  
   (Nach Custom SMTP ist der Default oft nur 30/h — bei gleichzeitiger Anmeldung mehrerer Freunde zu wenig.)
3. Produktion: Redirect URL `https://deine-site.netlify.app/**` eintragen

**Login-Flow:** Registrieren (Name + E-Mail) → Magic Link → Liga beitreten.  
Auf neuem Gerät: **Einloggen** (gleiche E-Mail + Name) → neuer Magic Link → direkt ins Dashboard.

### 3. Datenbank

Mit `DATABASE_URL`:

```bash
npm run db:setup
npm run sync:results
```

Manuell: Migrationen `001`–`005` in `supabase/migrations/` ausführen, oder nur `004_005_combined.sql` im SQL Editor wenn 001–003 schon laufen. Dann:

```bash
npm run sync:results   # alle 104 Spiele
npm run db:setup       # Teams + Gruppenspiele seeden (Fallback)
```

### 4. App starten

```bash
npm install
npm run dev
```

**Einladungscode:** `WM26-FREUNDE`

## Sync & Live

- **Produktion:** Netlify `sync-results` → `/api/cron/sync-results` alle 5 Min
- **Lokal:** `npm run sync:results` (upsertet alle 104 Spiele + Ergebnisse)
- **Live:** Nach Tipp erscheint Live-Stand (SSE, 30s Fallback)

## Go-Live-Checkliste

1. Migrationen 001–005 auf Supabase
2. `npm run sync:results` → 104 Spiele in DB
3. Netlify Env + `CRON_SECRET` + Supabase Redirect URL
4. Gruppenspiel: Tippen → Freunde-Tipps → Live → Punkte
5. K.o.-Spiel mit Platzhalter-Teams: sichtbar, Tippen gesperrt bis Teams bekannt

## Netlify Deploy

1. Repo mit Netlify verbinden (Build: `npm run build`, Plugin: `@netlify/plugin-nextjs`)
2. **Env-Variablen** in Netlify → Site configuration → Environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` (empfohlen — schützt `/api/cron/sync-results`)
3. Supabase Redirect URL: `https://deine-site.netlify.app/**`
4. Nach erstem Deploy: Migration `004_005_combined.sql` in Supabase, dann einmalig Sync triggern (Scheduled Function läuft alle 5 Min)

**Scheduled Function:** `netlify/functions/sync-results.mjs` ruft `/api/cron/sync-results` auf.

